export function formatDate(value?: string | null) {
  if (!value) return '—';
  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (onlyDate) return `${onlyDate[3]}/${onlyDate[2]}/${onlyDate[1]}`;
  try {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

export function truncate(value: string, length = 110) {
  if (!value) return '—';
  return value.length > length ? `${value.slice(0, length)}…` : value;
}
