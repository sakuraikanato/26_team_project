export function parse_date(date: string) {
  const [year, month] = date.split("-");
  return new Date(`${year}-${month}-01T00:00:00+01:00`)
}