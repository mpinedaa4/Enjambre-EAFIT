// Catálogo de datos de demostración. Todo lo que hay aquí es ficticio y está
// pensado para llenar la aplicación con un volumen realista: varios grupos,
// cada uno con sus comités, sus estados de miembro y sus hojas de permanencia.
//
// Reglas que este catálogo respeta (las valida la API, ver
// `activities.service.ts`):
//   - Los pesos de una hoja (las actividades generales de un grupo, o las de
//     un comité) no pueden sumar más de 100.
//   - Aquí las generales suman 60 y las de cada comité 40, de modo que un
//     integrante de un comité puede llegar a 100 puntos en total.

export interface ActivityTemplate {
  name: string;
  description: string;
  weight: number;
}

export interface CommitteeTemplate {
  name: string;
  activities: ActivityTemplate[];
}

export interface MemberStatusTemplate {
  name: string;
  target: number;
}

export interface GroupTemplate {
  name: string;
  /** Usuario de junta (rol BOARD) del grupo. El primero sale del `.env`. */
  boardUsername: string;
  /** Peso relativo del grupo al repartir integrantes (más alto = más gente). */
  share: number;
  generalActivities: ActivityTemplate[];
  committees: CommitteeTemplate[];
}

// Los mismos estados que el frontend propone al crear un grupo
// (`constants/membershipStatuses.ts`). `target` es el puntaje de permanencia
// exigido (0-100).
export const MEMBER_STATUSES: MemberStatusTemplate[] = [
  { name: 'Activo', target: 70 },
  { name: 'Período de prueba', target: 80 },
  { name: 'Licencia', target: 0 },
  { name: 'Honorario', target: 30 },
  { name: 'Miembro de junta', target: 0 },
];

// Con qué frecuencia se asigna cada estado a un integrante (pesos relativos).
export const STATUS_WEIGHTS: Record<string, number> = {
  Activo: 60,
  'Período de prueba': 16,
  Licencia: 8,
  Honorario: 10,
  'Miembro de junta': 6,
};

// Hoja general que comparten todos los grupos: 60 puntos repartidos.
const GENERAL_ACTIVITIES: ActivityTemplate[] = [
  {
    name: 'Asistencia a asambleas',
    description: 'Asistencia a las asambleas generales del grupo.',
    weight: 20,
  },
  {
    name: 'Participación en eventos',
    description: 'Participación en los eventos organizados por el grupo.',
    weight: 15,
  },
  {
    name: 'Jornada de inducción',
    description:
      'Acompañamiento a la jornada de inducción de nuevos integrantes.',
    weight: 10,
  },
  {
    name: 'Representación institucional',
    description:
      'Representación del grupo ante la universidad y otras organizaciones.',
    weight: 15,
  },
];

function committee(
  name: string,
  activities: ActivityTemplate[],
): CommitteeTemplate {
  return { name, activities };
}

export const GROUPS: GroupTemplate[] = [
  {
    name: 'SPIE',
    boardUsername: 'junta.spie',
    share: 30,
    generalActivities: GENERAL_ACTIVITIES,
    committees: [
      committee('Comité de Comunicaciones', [
        {
          name: 'Publicaciones en redes',
          description: 'Publicaciones realizadas para las redes del grupo.',
          weight: 20,
        },
        {
          name: 'Cubrimiento de eventos',
          description: 'Registro fotográfico y cubrimiento de los eventos.',
          weight: 10,
        },
        {
          name: 'Boletín del semestre',
          description: 'Redacción y envío del boletín informativo.',
          weight: 10,
        },
      ]),
      committee('Comité de Finanzas', [
        {
          name: 'Informe de presupuesto',
          description: 'Entrega del informe de presupuesto del semestre.',
          weight: 20,
        },
        {
          name: 'Gestión de patrocinios',
          description: 'Contacto y seguimiento a empresas patrocinadoras.',
          weight: 10,
        },
        {
          name: 'Conciliación de gastos',
          description: 'Conciliación de los gastos de cada evento.',
          weight: 10,
        },
      ]),
      committee('Comité Académico', [
        {
          name: 'Talleres académicos',
          description: 'Diseño y dictado de talleres para los integrantes.',
          weight: 20,
        },
        {
          name: 'Acompañamiento a semilleros',
          description: 'Apoyo a los semilleros de investigación aliados.',
          weight: 10,
        },
        {
          name: 'Banco de material',
          description: 'Curaduría del material de estudio compartido.',
          weight: 10,
        },
      ]),
      committee('Comité de Proyectos', [
        {
          name: 'Avance del proyecto',
          description: 'Avance del proyecto asignado para el semestre.',
          weight: 25,
        },
        {
          name: 'Documentación técnica',
          description: 'Documentación técnica del proyecto.',
          weight: 15,
        },
      ]),
    ],
  },
  {
    name: 'Organización Estudiantil (OE)',
    boardUsername: 'junta.oe',
    share: 25,
    generalActivities: GENERAL_ACTIVITIES,
    committees: [
      committee('Comité de Logística', [
        {
          name: 'Montaje de eventos',
          description: 'Montaje y desmontaje de los espacios de cada evento.',
          weight: 20,
        },
        {
          name: 'Inventario de recursos',
          description: 'Control del inventario de recursos del grupo.',
          weight: 10,
        },
        {
          name: 'Plan de proveedores',
          description: 'Cotización y selección de proveedores.',
          weight: 10,
        },
      ]),
      committee('Comité de Bienestar', [
        {
          name: 'Actividades de integración',
          description: 'Organización de las actividades de integración.',
          weight: 20,
        },
        {
          name: 'Acompañamiento a nuevos',
          description: 'Acompañamiento a los integrantes recién vinculados.',
          weight: 20,
        },
      ]),
      committee('Comité de Comunicaciones', [
        {
          name: 'Publicaciones en redes',
          description: 'Publicaciones realizadas para las redes del grupo.',
          weight: 20,
        },
        {
          name: 'Diseño de piezas gráficas',
          description: 'Diseño de las piezas gráficas de cada convocatoria.',
          weight: 20,
        },
      ]),
    ],
  },
  {
    name: 'Capítulo IEEE EAFIT',
    boardUsername: 'junta.ieee',
    share: 20,
    generalActivities: GENERAL_ACTIVITIES,
    committees: [
      committee('Comité de Robótica', [
        {
          name: 'Prototipo del semestre',
          description: 'Construcción del prototipo propuesto para el semestre.',
          weight: 25,
        },
        {
          name: 'Participación en competencias',
          description: 'Participación en competencias internas y externas.',
          weight: 15,
        },
      ]),
      committee('Comité de Membresía', [
        {
          name: 'Campaña de afiliación',
          description: 'Campaña de afiliación de nuevos miembros.',
          weight: 20,
        },
        {
          name: 'Seguimiento a membresías',
          description: 'Seguimiento a la renovación de las membresías.',
          weight: 20,
        },
      ]),
      committee('Comité de Eventos', [
        {
          name: 'Organización de charlas',
          description: 'Organización de las charlas técnicas del semestre.',
          weight: 20,
        },
        {
          name: 'Gestión de conferencistas',
          description: 'Contacto y acompañamiento a los conferencistas.',
          weight: 10,
        },
        {
          name: 'Informe posterior al evento',
          description: 'Informe de resultados de cada evento realizado.',
          weight: 10,
        },
      ]),
    ],
  },
  {
    name: 'Grupo de Innovación y Emprendimiento',
    boardUsername: 'junta.innovacion',
    share: 15,
    generalActivities: GENERAL_ACTIVITIES,
    committees: [
      committee('Comité de Mentoría', [
        {
          name: 'Sesiones de mentoría',
          description: 'Sesiones de mentoría dictadas a los emprendedores.',
          weight: 25,
        },
        {
          name: 'Reporte de mentorados',
          description: 'Reporte de avance de los equipos acompañados.',
          weight: 15,
        },
      ]),
      committee('Comité de Comunicaciones', [
        {
          name: 'Publicaciones en redes',
          description: 'Publicaciones realizadas para las redes del grupo.',
          weight: 20,
        },
        {
          name: 'Convocatoria de retos',
          description: 'Difusión de las convocatorias de retos de innovación.',
          weight: 20,
        },
      ]),
    ],
  },
  {
    name: 'Semillero de Ciencia de Datos',
    boardUsername: 'junta.datos',
    share: 10,
    generalActivities: GENERAL_ACTIVITIES,
    committees: [
      committee('Comité de Investigación', [
        {
          name: 'Avance de la investigación',
          description: 'Avance de la línea de investigación asignada.',
          weight: 25,
        },
        {
          name: 'Revisión bibliográfica',
          description: 'Revisión y fichaje de la bibliografía del proyecto.',
          weight: 15,
        },
      ]),
      committee('Comité de Divulgación', [
        {
          name: 'Publicación de resultados',
          description:
            'Publicación de los resultados en los canales del grupo.',
          weight: 20,
        },
        {
          name: 'Charlas de divulgación',
          description:
            'Charlas abiertas para divulgar el trabajo del semillero.',
          weight: 20,
        },
      ]),
    ],
  },
];

export const FIRST_NAMES = [
  'Juan',
  'María',
  'Santiago',
  'Valentina',
  'Sebastián',
  'Camila',
  'Andrés',
  'Laura',
  'Mateo',
  'Isabella',
  'Tomás',
  'Sofía',
  'Daniel',
  'Mariana',
  'Emmanuel',
  'Antonia',
  'Samuel',
  'Salomé',
  'Nicolás',
  'Gabriela',
  'Alejandro',
  'Manuela',
  'David',
  'Juliana',
  'Felipe',
  'Catalina',
  'Martín',
  'Paulina',
  'Esteban',
  'Verónica',
  'Simón',
  'Luciana',
  'Jerónimo',
  'Alejandra',
  'Pablo',
  'Daniela',
  'Emilio',
  'Sara',
  'Joaquín',
  'Elena',
];

export const LAST_NAMES = [
  'Pérez',
  'Gómez',
  'Rodríguez',
  'Martínez',
  'López',
  'Restrepo',
  'Arango',
  'Jaramillo',
  'Vélez',
  'Zapata',
  'Ochoa',
  'Cardona',
  'Mejía',
  'Betancur',
  'Quintero',
  'Henao',
  'Giraldo',
  'Álvarez',
  'Montoya',
  'Ramírez',
  'Agudelo',
  'Castaño',
  'Osorio',
  'Salazar',
  'Escobar',
  'Toro',
  'Muñoz',
  'Correa',
  'Gallego',
  'Patiño',
  'Hoyos',
  'Duque',
  'Marín',
  'Posada',
  'Vanegas',
  'Bedoya',
  'Uribe',
  'Londoño',
  'Franco',
  'Acevedo',
];

export const PROGRAMS = [
  'Ingeniería de Sistemas',
  'Ingeniería de Producción',
  'Ingeniería de Diseño de Producto',
  'Ingeniería Mecánica',
  'Ingeniería Civil',
  'Ingeniería Matemática',
  'Ingeniería de Procesos',
  'Ingeniería Agronómica',
  'Administración de Negocios',
  'Negocios Internacionales',
  'Economía',
  'Contaduría Pública',
  'Finanzas',
  'Mercadeo',
  'Derecho',
  'Ciencias Políticas',
  'Comunicación Social',
  'Psicología',
  'Música',
  'Biología',
  'Geología',
  'Diseño Interactivo',
  'Literatura',
];

// Mismos valores que valida la API (`utils/validation.util.ts`) y muestra el
// frontend (`constants/documentTypes.ts`).
export const DOCUMENT_TYPES = [
  'Cédula de ciudadanía',
  'Tarjeta de identidad',
  'Cédula de extranjería',
  'Pasaporte',
];
