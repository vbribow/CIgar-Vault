const MIN_DOCUMENTED_YEAR = 1800;

export function recentYearOptions(
  existing?: string | number | null,
  currentYear = new Date().getFullYear(),
  priorYears = 15,
) {
  const years = Array.from({ length: priorYears + 1 }, (_, index) => currentYear - index);
  const savedYear = typeof existing === "number" ? existing : Number(String(existing ?? "").trim());

  if (
    Number.isInteger(savedYear)
    && savedYear >= MIN_DOCUMENTED_YEAR
    && savedYear <= currentYear
    && !years.includes(savedYear)
  ) {
    years.push(savedYear);
  }

  return years.sort((left, right) => right - left);
}
