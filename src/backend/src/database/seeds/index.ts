import { AppDataSource } from '../data-source.js';

import { buildSeedPlan, SEED_CONFIG } from './data/plan.js';
import { seedGroups } from './group.seed.js';
import { seedUsers } from './user.seed.js';
import { seedMemberStatuses } from './member-status.seed.js';
import { seedMembers } from './member.seed.js';
import { seedGroupMembers } from './group-member.seed.js';
import { seedCommittees } from './committee.seed.js';
import { seedActivities } from './activity.seed.js';
import { seedPermanences } from './permanence.seed.js';

import { Activity } from '../../activities/entities/activity.entity.js';
import { Committee } from '../../committees/entities/committee.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import { GroupMember } from '../../groups/entities/group-member.entity.js';
import { Member } from '../../members/entities/member.entity.js';
import { MemberStatus } from '../../groups/entities/member-status.entity.js';
import { Permanence } from '../../permanences/entities/permanence.entity.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * ¿Se pidió empezar de cero? Con `--fresh` (o `SEED_FRESH=1`) se borran todas
 * las tablas y se vuelven a crear antes de sembrar. Es la forma recomendada de
 * re-seedear: no hace falta borrar `database.sqlite` a mano.
 */
function wantsFresh(): boolean {
  const flags = process.argv.slice(2);
  const fromEnv = (process.env.SEED_FRESH ?? '').toLowerCase();

  return (
    flags.includes('--fresh') ||
    flags.includes('--reset') ||
    fromEnv === '1' ||
    fromEnv === 'true'
  );
}

async function printTotals(): Promise<void> {
  const entities = [
    ['Grupos', Group],
    ['Usuarios', User],
    ['Estados de miembro', MemberStatus],
    ['Comités', Committee],
    ['Integrantes', Member],
    ['Vínculos a grupos', GroupMember],
    ['Actividades', Activity],
    ['Puntajes', Permanence],
  ] as const;

  console.log('\nTotales en la base de datos:');

  for (const [label, entity] of entities) {
    const total = await AppDataSource.getRepository(entity).count();

    console.log(`  ${label.padEnd(24, '.')} ${total}`);
  }
}

async function seed(): Promise<void> {
  const startedAt = Date.now();

  try {
    const fresh = wantsFresh();
    const plan = buildSeedPlan();

    console.log('Connecting to database...');

    await AppDataSource.initialize();

    console.log('Database connected.\n');

    if (fresh) {
      console.log('Modo --fresh: borrando y recreando el esquema...\n');

      await AppDataSource.dropDatabase();
      await AppDataSource.synchronize();
    }

    console.log(
      `Sembrando ${plan.members.length} integrantes en ${plan.groups.length} grupos ` +
        `(semilla ${SEED_CONFIG.randomSeed}).\n`,
    );

    await seedGroups(plan);
    await seedUsers(plan);
    await seedMemberStatuses(plan);
    await seedMembers(plan);
    await seedGroupMembers(plan);
    await seedCommittees(plan);
    await seedActivities(plan);
    await seedPermanences(plan);

    await printTotals();

    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

    console.log(`\nSeed completed successfully in ${seconds}s.`);
  } catch (error) {
    console.error('\nSeed failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void seed();
