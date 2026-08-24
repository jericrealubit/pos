function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvEscape).join(",")]
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(","))
  }
  return lines.join("\r\n")
}
