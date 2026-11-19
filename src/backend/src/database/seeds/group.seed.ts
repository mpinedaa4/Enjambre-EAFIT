import { AppDataSource } from '../data-source.js';
import { Group } from '../../groups/entities/group.entity.js';
import type { SeedPlan } from './data/plan.js';
import { logStep } from './data/report.util.js';

export async function seedGroups(plan: SeedPlan): Promise<Group[]> {
  const repository = AppDataSource.getRepository(Group);

  const existing = await repository.find();
  const existingNames = new Set(existing.map((group) => group.name));

  const missing = plan.groups
    .filter((template) => !existingNames.has(template.name))
    .map((template) => repository.create({ name: template.name }));

  if (missing.length > 0) {
    await repository.save(missing);
  }

  logStep('Grupos', missing.length, plan.groups.length - missing.length);

  return await repository.find();
}
