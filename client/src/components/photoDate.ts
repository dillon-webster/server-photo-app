import { format } from "date-fns";

export function timestampToDateInput(timestamp: number) {
  return format(new Date(timestamp), "yyyy-MM-dd");
}

export function dateInputToTimestamp(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error("Invalid date");
  }

  return date.getTime();
}
