// Utilidades de salida y de guardado por lotes. Con cientos de filas no sirve
// imprimir una línea por registro: cada seeder reporta un resumen.

export function logStep(
  label: string,
  created: number,
  existing: number,
): void {
  const detail =
    existing > 0
      ? `${created} nuevos · ${existing} ya existían`
      : `${created} nuevos`;

  console.log(`  ${label.padEnd(24, '.')} ${detail}`);
}

/** Parte una lista en bloques, para no mandar miles de filas en un INSERT. */
export function chunk<T>(items: T[], size: number): T[][] {
  const blocks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    blocks.push(items.slice(index, index + size));
  }

  return blocks;
}

export const CHUNK_SIZE = 200;
