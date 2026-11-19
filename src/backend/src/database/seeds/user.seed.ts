import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source.js';
import { User } from '../../users/entities/user.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import { USER_ROLES } from '../../auth/roles.js';
import type { SeedPlan } from './data/plan.js';
import { logStep } from './data/report.util.js';

// Se crea un usuario ADMIN (Desarrollo Estudiantil) y un usuario BOARD por
// grupo. El primer grupo del catálogo usa las credenciales del `.env`
// (`BOARD_USERNAME`); los demás usan el nombre de usuario del catálogo con la
// misma contraseña `BOARD_PASSWORD`.
export async function seedUsers(plan: SeedPlan): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);
  const groupRepository = AppDataSource.getRepository(Group);

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const boardUsername = process.env.BOARD_USERNAME;
  const boardPassword = process.env.BOARD_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error('Faltan las credenciales del usuario ADMIN en el .env.');
  }

  if (!boardUsername || !boardPassword) {
    throw new Error('Faltan las credenciales del usuario BOARD en el .env.');
  }

  const users: {
    username: string;
    password: string;
    role: string;
    group: Group | null;
  }[] = [
    {
      username: adminUsername,
      password: adminPassword,
      role: USER_ROLES.ADMIN,
      group: null,
    },
  ];

  for (const [index, template] of plan.groups.entries()) {
    const group = await groupRepository.findOne({
      where: { name: template.name },
    });

    if (!group) {
      throw new Error(`No existe el grupo ${template.name}.`);
    }

    users.push({
      username: index === 0 ? boardUsername : template.boardUsername,
      password: boardPassword,
      role: USER_ROLES.BOARD,
      group,
    });
  }

  const existing = await userRepository.find();
  const existingUsernames = new Set(existing.map((user) => user.username));

  let created = 0;

  for (const data of users) {
    if (existingUsernames.has(data.username)) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await userRepository.save(
      userRepository.create({
        username: data.username,
        password: hashedPassword,
        role: data.role,
        group: data.group,
      }),
    );

    created += 1;
  }

  logStep('Usuarios', created, users.length - created);
}
