import { AppDataSource } from '../data-source.js';
import { MemberStatus } from '../../groups/entities/member-status.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import type { SeedPlan } from './data/plan.js';
import { logStep } from './data/report.util.js';

// Todo grupo necesita al menos un estado: sin estados no se le pueden agregar
// integrantes. El `target` es el puntaje de permanencia exigido (0-100).
export async function seedMemberStatuses(plan: SeedPlan): Promise<void> {
  const statusRepository = AppDataSource.getRepository(MemberStatus);
  const groupRepository = AppDataSource.getRepository(Group);

  const groups = await groupRepository.find();

  if (groups.length === 0) {
    throw new Error('No hay grupos para crear estados de miembro.');
  }

  const existing = await statusRepository.find();
  const existingKeys = new Set(
    existing.map(
      (status) => `${status.group?.id ?? status.groupId}:${status.name}`,
    ),
  );

  const missing: MemberStatus[] = [];

  for (const group of groups) {
    for (const template of plan.statuses) {
      if (existingKeys.has(`${group.id}:${template.name}`)) {
        continue;
      }

      missing.push(
        statusRepository.create({
          name: template.name,
          target: template.target,
          group,
        }),
      );
    }
  }

  if (missing.length > 0) {
    await statusRepository.save(missing);
  }

  const total = groups.length * plan.statuses.length;

  logStep('Estados de miembro', missing.length, total - missing.length);
}
