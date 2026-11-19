import { AppDataSource } from '../data-source.js';
import { GroupMember } from '../../groups/entities/group-member.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import { Member } from '../../members/entities/member.entity.js';
import { MemberStatus } from '../../groups/entities/member-status.entity.js';
import type { SeedPlan } from './data/plan.js';
import { CHUNK_SIZE, chunk, logStep } from './data/report.util.js';

// Todos los integrantes sembrados quedan vinculados a un grupo: un integrante
// sin grupo no aparece en la interfaz pero sí ocupa su ID EPIK, correo y
// documento. Algunos pertenecen a dos grupos (lo permite el modelo:
// `group_member` es UNIQUE(member, group), no UNIQUE(member)).
export async function seedGroupMembers(plan: SeedPlan): Promise<void> {
  const repository = AppDataSource.getRepository(GroupMember);
  const groupRepository = AppDataSource.getRepository(Group);
  const memberRepository = AppDataSource.getRepository(Member);
  const statusRepository = AppDataSource.getRepository(MemberStatus);

  const groupsByName = new Map(
    (await groupRepository.find()).map((group) => [group.name, group]),
  );
  const membersByIdEpik = new Map(
    (await memberRepository.find()).map((member) => [member.idEpik, member]),
  );
  const statusesByKey = new Map(
    (await statusRepository.find()).map((status) => [
      `${status.group?.id ?? status.groupId}:${status.name}`,
      status,
    ]),
  );

  const existingKeys = new Set(
    (await repository.find()).map(
      (groupMember) =>
        `${groupMember.member?.id ?? groupMember.memberId}:${groupMember.group?.id ?? groupMember.groupId}`,
    ),
  );

  const missing: GroupMember[] = [];

  for (const membership of plan.memberships) {
    const group = groupsByName.get(membership.groupName);
    const member = membersByIdEpik.get(membership.idEpik);

    if (!group || !member) {
      throw new Error(
        `No se encontraron las entidades necesarias para vincular ${membership.idEpik} a "${membership.groupName}".`,
      );
    }

    if (existingKeys.has(`${member.id}:${group.id}`)) {
      continue;
    }

    const status = statusesByKey.get(`${group.id}:${membership.statusName}`);

    if (!status) {
      throw new Error(
        `No existe el estado "${membership.statusName}" en "${group.name}".`,
      );
    }

    missing.push(repository.create({ member, group, memberStatus: status }));
  }

  for (const block of chunk(missing, CHUNK_SIZE)) {
    await repository.save(block);
  }

  logStep(
    'Vínculos a grupos',
    missing.length,
    plan.memberships.length - missing.length,
  );
}
