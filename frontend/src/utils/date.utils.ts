export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function isValidFutureDate(dateString: string): boolean {
  if (!dateString) return false;
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoPattern.test(dateString)) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '종료예정일 없음';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '종료예정일 없음';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
