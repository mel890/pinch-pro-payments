export function formatAUD(cents: number | null | undefined): string {
  const n = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
