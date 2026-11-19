import { AppDataSource } from '../data-source.js';
import { Committee } from '../../committees/entities/committee.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import { Member } from '../../members/entities/member.entity.js';
import type { SeedPlan } from './data/plan.js';
import { CHUNK_SIZE, chunk, logStep } from './data/report.util.js';

// Todo grupo necesita al menos un comité (así lo exige el formulario de
// grupos). Los comités se crean primero y luego se les asignan integrantes,
// siempre del mismo grupo del comité (la API lo valida igual).
export async function seedCommittees(plan: SeedPlan): Promise<void> {
  const repository = AppDataSource.getRepository(Committee);
  const groupRepository = AppDataSource.getRepository(Group);

  const groupsByName = new Map(
    (await groupRepository.find()).map((group) => [group.name, group]),
  );

  const existingKeys = new Set(
    (await repository.find()).map(
      (committee) =>
        `${committee.group?.id ?? committee.groupId}:${committee.name}`,
    ),
  );

  const missing: Committee[] = [];
  let planned = 0;

  for (const template of plan.groups) {
    const group = groupsByName.get(template.name);

    if (!group) {
      throw new Error(`No existe el grupo ${template.name}.`);
    }

    for (const committeeTemplate of template.committees) {
      planned += 1;

      if (existingKeys.has(`${group.id}:${committeeTemplate.name}`)) {
        continue;
      }

      missing.push(repository.create({ name: committeeTemplate.name, group }));
    }
  }

  if (missing.length > 0) {
    await repository.save(missing);
  }

  logStep('Comités', missing.length, planned - missing.length);

  await assignMembers(plan);
}

async function assignMembers(plan: SeedPlan): Promise<void> {
  const committeeRepository = AppDataSource.getRepository(Committee);
  const memberRepository = AppDataSource.getRepository(Member);

  const committeesByKey = new Map(
    (await committeeRepository.find()).map((committee) => [
      `${committee.group?.id ?? committee.groupId}:${committee.name}`,
      committee,
    ]),
  );

  const groupsByName = new Map(
    (await AppDataSource.getRepository(Group).find()).map((group) => [
      group.name,
      group,
    ]),
  );

  // Qué comités le corresponden a cada integrante, según el plan.
  const wanted = new Map<number, Committee[]>();
  let planned = 0;

  for (const membership of plan.memberships) {
    const group = groupsByName.get(membership.groupName);

    if (!group) {
      throw new Error(`No existe el grupo ${membership.groupName}.`);
    }

    for (const committeeName of membership.committeeNames) {
      const committee = committeesByKey.get(`${group.id}:${committeeName}`);

      if (!committee) {
        throw new Error(
          `No existe el comité "${committeeName}" en "${group.name}".`,
        );
      }

      planned += 1;

      const current = wanted.get(membership.idEpik) ?? [];

      wanted.set(membership.idEpik, [...current, committee]);
    }
  }

  const members = await memberRepository.find();
  const touched: Member[] = [];
  let created = 0;

  for (const member of members) {
    const desired = wanted.get(member.idEpik);

    if (!desired || desired.length === 0) {
      continue;
    }

    const current = member.committees ?? [];
    const currentIds = new Set(current.map((committee) => committee.id));
    const toAdd = desired.filter((committee) => {
      if (currentIds.has(committee.id)) {
        return false;
      }

      currentIds.add(committee.id);

      return true;
    });

    if (toAdd.length === 0) {
      continue;
    }

    member.committees = [...current, ...toAdd];
    created += toAdd.length;
    touched.push(member);
  }

  for (const block of chunk(touched, CHUNK_SIZE)) {
    await memberRepository.save(block);
  }

  logStep('Vínculos a comités', created, planned - created);
}
