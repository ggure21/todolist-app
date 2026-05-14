export function decodeTokenUserId(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return (payload as { userId?: string }).userId ?? '';
  } catch {
    return '';
  }
}
