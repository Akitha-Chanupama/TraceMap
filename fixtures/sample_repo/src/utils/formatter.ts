export function formatDate(date: Date): string {
  return date.toISOString();
}

export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

