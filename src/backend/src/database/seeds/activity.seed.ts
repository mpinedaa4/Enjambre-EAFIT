import { AppDataSource } from '../data-source.js';
import { Activity } from '../../activities/entities/activity.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import { Committee } from '../../committees/entities/committee.entity.js';
import { getCurrentPeriod } from '../../utils/period.util.js';
import { MAX_PERCENTAGE } from '../../utils/validation.util.js';
import type { ActivityTemplate } from './data/catalog.js';
import type { SeedPlan } from './data/plan.js';
import { CHUNK_SIZE, chunk, logStep } from './data/report.util.js';

// Una "hoja" son las actividades generales de un grupo (sin comité) o las de
// un comité. Los pesos de cada hoja no pueden sumar más de 100: lo valida la
// API y aquí se comprueba antes de insertar, para que el catálogo no se
// desconfigure sin que nadie se dé cuenta.
export async function seedActivities(plan: SeedPlan): Promise<void> {
  const repository = AppDataSource.getRepository(Activity);
  const groupRepository = AppDataSource.getRepository(Group);
  const committeeRepository = AppDataSource.getRepository(Committee);

  const groupsByName = new Map(
    (await groupRepository.find()).map((group) => [group.name, group]),
  );
  const committeesByKey = new Map(
    (await committeeRepository.find()).map((committee) => [
      `${committee.group?.id ?? committee.groupId}:${committee.name}`,
      committee,
    ]),
  );

  const existingKeys = new Set(
    (await repository.find()).map((activity) => activityKey(activity)),
  );

  const period = getCurrentPeriod();
  const missing: Activity[] = [];
  let planned = 0;

  for (const template of plan.groups) {
    const group = groupsByName.get(template.name);

    if (!group) {
      throw new Error(`No existe el grupo ${template.name}.`);
    }

    const sheets: {
      committee: Committee | null;
      activities: ActivityTemplate[];
    }[] = [{ committee: null, activities: template.generalActivities }];

    for (const committeeTemplate of template.committees) {
      const committee = committeesByKey.get(
        `${group.id}:${committeeTemplate.name}`,
      );

      if (!committee) {
        throw new Error(
          `No existe el comité "${committeeTemplate.name}" en "${group.name}".`,
        );
      }

      sheets.push({ committee, activities: committeeTemplate.activities });
    }

    for (const sheet of sheets) {
      ensureSheetFits(
        template.name,
        sheet.committee?.name ?? null,
        sheet.activities,
      );

      for (const activity of sheet.activities) {
        planned += 1;

        const key = `${group.id}:${sheet.committee?.id ?? 'general'}:${activity.name}`;

        if (existingKeys.has(key)) {
          continue;
        }

        missing.push(
          repository.create({
            name: activity.name,
            description: activity.description,
            weight: activity.weight,
            period,
            group,
            committee: sheet.committee,
          }),
        );
      }
    }
  }

  for (const block of chunk(missing, CHUNK_SIZE)) {
    await repository.save(block);
  }

  logStep('Actividades', missing.length, planned - missing.length);
}

function activityKey(activity: Activity): string {
  const groupId = activity.group?.id ?? activity.groupId;
  const committeeId = activity.committee?.id ?? activity.committeeId ?? null;

  return `${groupId}:${committeeId ?? 'general'}:${activity.name}`;
}

function ensureSheetFits(
  groupName: string,
  committeeName: string | null,
  activities: { weight: number }[],
): void {
  const total = activities.reduce((sum, activity) => sum + activity.weight, 0);

  if (total > MAX_PERCENTAGE) {
    const sheet = committeeName ?? 'hoja general';

    throw new Error(
      `Los pesos de "${sheet}" de "${groupName}" suman ${total}%, más del ${MAX_PERCENTAGE}% permitido.`,
    );
  }
}
