// Arma el "plan" del seed: la lista completa de integrantes, vínculos,
// comités y puntajes que se van a sembrar, ya calculada en memoria y
// **determinista** (misma semilla -> mismos datos). Cada seeder toma luego su
// parte del plan y la persiste.
//
// Tamaño y semilla se controlan con variables de entorno:
//   SEED_MEMBERS      cuántos integrantes generar  (por defecto 150)
//   SEED_RANDOM_SEED  semilla del generador        (por defecto 20261118)

import {
  DOCUMENT_TYPES,
  FIRST_NAMES,
  GROUPS,
  LAST_NAMES,
  MEMBER_STATUSES,
  PROGRAMS,
  STATUS_WEIGHTS,
  type ActivityTemplate,
  type GroupTemplate,
  type MemberStatusTemplate,
} from './catalog.js';
import { createRandom, slugify, type Random } from './random.util.js';

export interface MemberPlan {
  idEpik: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  program: string;
  secondProgram: string;
}

export interface MembershipPlan {
  idEpik: number;
  groupName: string;
  statusName: string;
  /** Comités de ESE grupo a los que pertenece el integrante. */
  committeeNames: string[];
}

export interface PermanencePlan {
  idEpik: number;
  groupName: string;
  /** `null` = actividad de la hoja general del grupo. */
  committeeName: string | null;
  activityName: string;
  percentage: number;
}

export interface SeedPlan {
  groups: GroupTemplate[];
  statuses: MemberStatusTemplate[];
  members: MemberPlan[];
  memberships: MembershipPlan[];
  permanences: PermanencePlan[];
}

/** Primer ID EPIK: los integrantes se numeran 1001, 1002, ... */
const FIRST_ID_EPIK = 1001;

/** Probabilidad de que un integrante pertenezca además a un segundo grupo. */
const SECOND_GROUP_CHANCE = 0.1;

/** Probabilidad de que un integrante tenga un segundo programa académico. */
const SECOND_PROGRAM_CHANCE = 0.15;

/**
 * Probabilidad de que una pareja (integrante, actividad) tenga puntaje. El
 * resto queda sin calificar, que es como lo representa el modelo: lo que no se
 * califica simplemente no tiene fila en `permanence`.
 */
const SCORED_CHANCE = 0.88;

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} debe ser un entero positivo (recibido "${raw}").`);
  }

  return value;
}

export const SEED_CONFIG = {
  get members(): number {
    return readInt('SEED_MEMBERS', 150);
  },
  get randomSeed(): number {
    return readInt('SEED_RANDOM_SEED', 20261118);
  },
};

/** Elige un elemento según pesos relativos (los más pesados salen más). */
function pickWeighted<T extends string>(
  random: Random,
  weights: Record<string, number>,
  options: readonly T[],
): T {
  const total = options.reduce(
    (sum, option) => sum + (weights[option] ?? 1),
    0,
  );

  let threshold = random.next() * total;

  for (const option of options) {
    threshold -= weights[option] ?? 1;

    if (threshold <= 0) {
      return option;
    }
  }

  return options[options.length - 1];
}

/**
 * Reparte `count` cupos entre los grupos según su `share`, y los mezcla para
 * que los integrantes consecutivos no caigan todos en el mismo grupo.
 */
function buildGroupSlots(random: Random, count: number): string[] {
  const totalShare = GROUPS.reduce((sum, group) => sum + group.share, 0);
  const slots: string[] = [];

  for (const group of GROUPS) {
    const quota = Math.max(1, Math.round((count * group.share) / totalShare));

    for (let index = 0; index < quota; index += 1) {
      slots.push(group.name);
    }
  }

  // Completa o recorta hasta cuadrar exactamente con `count`.
  while (slots.length < count) {
    slots.push(GROUPS[0].name);
  }

  slots.length = count;

  // Mezcla determinista (Fisher-Yates con el PRNG del seed).
  for (let index = slots.length - 1; index > 0; index -= 1) {
    const other = random.int(0, index);

    [slots[index], slots[other]] = [slots[other], slots[index]];
  }

  return slots;
}

/** Cuántos comités le tocan a un integrante dentro de un grupo. */
function committeeCount(random: Random): number {
  const roll = random.next();

  if (roll < 0.2) {
    return 0;
  }

  if (roll < 0.75) {
    return 1;
  }

  return 2;
}

function buildMember(random: Random, idEpik: number): MemberPlan {
  const firstName = random.pick(FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);
  const secondLastName = random.pick(LAST_NAMES);
  const program = random.pick(PROGRAMS);
  const secondProgram = random.chance(SECOND_PROGRAM_CHANCE)
    ? random.pick(PROGRAMS.filter((option) => option !== program))
    : '';

  return {
    idEpik,
    fullName: `${firstName} ${lastName} ${secondLastName}`,
    documentType: random.pick(DOCUMENT_TYPES),
    // Únicos por construcción: 7919 es primo, así que ningún par de ID EPIK
    // produce el mismo documento ni el mismo celular.
    documentNumber: String(1000000000 + idEpik * 7919),
    email: `${slugify(firstName)}.${slugify(lastName)}${idEpik}@eafit.edu.co`,
    phone: `3${100000000 + idEpik * 7919}`,
    program,
    secondProgram,
  };
}

function scoreFor(random: Random, weight: number, profile: number): number {
  // El perfil del integrante (qué tan cumplido es) más un poco de ruido por
  // actividad. El puntaje nunca puede superar el peso de la actividad.
  const factor = profile + random.next() * 0.25 - 0.125;
  const score = Math.round(weight * factor);

  return Math.max(0, Math.min(weight, score));
}

export function buildSeedPlan(): SeedPlan {
  const random = createRandom(SEED_CONFIG.randomSeed);
  const memberCount = SEED_CONFIG.members;
  const groupsByName = new Map(GROUPS.map((group) => [group.name, group]));
  const statusNames = MEMBER_STATUSES.map((status) => status.name);
  const slots = buildGroupSlots(random, memberCount);

  const members: MemberPlan[] = [];
  const memberships: MembershipPlan[] = [];
  const permanences: PermanencePlan[] = [];

  for (let index = 0; index < memberCount; index += 1) {
    const idEpik = FIRST_ID_EPIK + index;
    const member = buildMember(random, idEpik);

    members.push(member);

    // Qué tan cumplido es este integrante (0.35 = flojo, 1 = impecable). Se
    // usa en todas sus actividades para que sus puntajes sean coherentes.
    const profile = 0.35 + random.next() * 0.65;

    const groupNames = [slots[index]];

    if (random.chance(SECOND_GROUP_CHANCE)) {
      const others = GROUPS.map((group) => group.name).filter(
        (name) => name !== groupNames[0],
      );

      groupNames.push(random.pick(others));
    }

    for (const groupName of groupNames) {
      const group = groupsByName.get(groupName);

      if (!group) {
        throw new Error(`El grupo "${groupName}" no está en el catálogo.`);
      }

      const committees = random.sample(
        group.committees,
        committeeCount(random),
      );

      memberships.push({
        idEpik,
        groupName,
        statusName: pickWeighted(random, STATUS_WEIGHTS, statusNames),
        committeeNames: committees.map((entry) => entry.name),
      });

      const sheets: {
        committeeName: string | null;
        activities: ActivityTemplate[];
      }[] = [
        { committeeName: null, activities: group.generalActivities },
        ...committees.map((entry) => ({
          committeeName: entry.name,
          activities: entry.activities,
        })),
      ];

      for (const sheet of sheets) {
        for (const activity of sheet.activities) {
          if (!random.chance(SCORED_CHANCE)) {
            continue;
          }

          permanences.push({
            idEpik,
            groupName,
            committeeName: sheet.committeeName,
            activityName: activity.name,
            percentage: scoreFor(random, activity.weight, profile),
          });
        }
      }
    }
  }

  return {
    groups: GROUPS,
    statuses: MEMBER_STATUSES,
    members,
    memberships,
    permanences,
  };
}
