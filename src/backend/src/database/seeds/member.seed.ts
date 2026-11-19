import { AppDataSource } from '../data-source.js';
import { Member } from '../../members/entities/member.entity.js';
import type { SeedPlan } from './data/plan.js';
import { CHUNK_SIZE, chunk, logStep } from './data/report.util.js';

// Datos ficticios generados por `data/plan.ts`. El ID EPIK, el documento, el
// correo y el celular son únicos por construcción, igual que los exige la
// entidad. `documentType` usa los mismos valores que valida la API
// (ver utils/validation.util.ts).
export async function seedMembers(plan: SeedPlan): Promise<void> {
  const repository = AppDataSource.getRepository(Member);

  const existing = await repository.find();
  const existingIdEpiks = new Set(existing.map((member) => member.idEpik));

  const missing = plan.members
    .filter((data) => !existingIdEpiks.has(data.idEpik))
    .map((data) => repository.create(data));

  for (const block of chunk(missing, CHUNK_SIZE)) {
    await repository.save(block);
  }

  logStep('Integrantes', missing.length, plan.members.length - missing.length);
}
