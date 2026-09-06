export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const semester = now.getMonth() < 6 ? 1 : 2;

  return `${year}-${semester}`;
}