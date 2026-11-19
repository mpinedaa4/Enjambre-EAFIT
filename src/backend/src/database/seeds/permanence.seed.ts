import { AppDataSource } from '../data-source.js';
import { Permanence } from '../../permanences/entities/permanence.entity.js';
import { Member } from '../../members/entities/member.entity.js';
import { Activity } from '../../activities/entities/activity.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import type { SeedPlan } from './data/plan.js';
import { CHUNK_SIZE, chunk, logStep } from './data/report.util.js';

// Puntos obtenidos por cada integrante en cada actividad. Nunca superan el
// peso de la actividad, y solo se registran para actividades de su grupo (y de
// sus comités): son las mismas reglas que valida `permanences.service.ts`.
// Lo que no se califica no tiene fila, igual que en la aplicación.
export async function seedPermanences(plan: SeedPlan): Promise<void> {
  const repository = AppDataSource.getRepository(Permanence);
  const memberRepository = AppDataSource.getRepository(Member);
  const activityRepository = AppDataSource.getRepository(Activity);
  const groupRepository = AppDataSource.getRepository(Group);

  const membersByIdEpik = new Map(
    (await memberRepository.find()).map((member) => [member.idEpik, member]),
  );
  const groupsByName = new Map(
    (await groupRepository.find()).map((group) => [group.name, group]),
  );
  const activitiesByKey = new Map(
    (await activityRepository.find()).map((activity) => {
      const groupId = activity.group?.id ?? activity.groupId;
      const committeeName = activity.committee?.name ?? null;

      return [
        `${groupId}:${committeeName ?? 'general'}:${activity.name}`,
        activity,
      ];
    }),
  );

  const existingKeys = new Set(
    (await repository.find()).map(
      (permanence) =>
        `${permanence.member?.id ?? permanence.memberId}:${permanence.activity?.id ?? permanence.activityId}`,
    ),
  );

  const missing: Permanence[] = [];

  for (const data of plan.permanences) {
    const member = membersByIdEpik.get(data.idEpik);
    const group = groupsByName.get(data.groupName);

    if (!member || !group) {
      throw new Error(
        'No se encontraron las entidades necesarias para Permanence.',
      );
    }

    const activity = activitiesByKey.get(
      `${group.id}:${data.committeeName ?? 'general'}:${data.activityName}`,
    );

    if (!activity) {
      throw new Error(
        `No existe la actividad "${data.activityName}" en "${group.name}".`,
      );
    }

    if (data.percentage > activity.weight) {
      throw new Error(
        `El puntaje de "${data.activityName}" supera el peso de la actividad.`,
      );
    }

    if (existingKeys.has(`${member.id}:${activity.id}`)) {
      continue;
    }

    missing.push(
      repository.create({ percentage: data.percentage, member, activity }),
    );
  }

  for (const block of chunk(missing, CHUNK_SIZE)) {
    await repository.save(block);
  }

  logStep('Puntajes', missing.length, plan.permanences.length - missing.length);
}
