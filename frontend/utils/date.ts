export function formatDate(date: string) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(date));
}

export function toInputDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

