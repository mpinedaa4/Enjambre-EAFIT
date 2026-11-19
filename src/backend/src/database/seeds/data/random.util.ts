// Generador pseudoaleatorio determinista (mulberry32). Con la misma semilla
// siempre produce la misma secuencia, así `npm run seed` es reproducible: dos
// bases sembradas con la misma semilla quedan idénticas.
export interface Random {
  /** Número en [0, 1). */
  next(): number;
  /** Entero en [min, max] (ambos incluidos). */
  int(min: number, max: number): number;
  /** Un elemento cualquiera de la lista. */
  pick<T>(items: readonly T[]): T;
  /** `true` con la probabilidad dada (0-1). */
  chance(probability: number): boolean;
  /** `count` elementos distintos de la lista (o todos, si pide de más). */
  sample<T>(items: readonly T[], count: number): T[];
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = state;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1));

  const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)];

  const chance = (probability: number): boolean => next() < probability;

  const sample = <T>(items: readonly T[], count: number): T[] => {
    const pool = [...items];
    const taken: T[] = [];

    while (taken.length < count && pool.length > 0) {
      taken.push(pool.splice(int(0, pool.length - 1), 1)[0]);
    }

    return taken;
  };

  return { next, int, pick, chance, sample };
}

/** Quita tildes y deja solo minúsculas y dígitos (para armar correos). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
