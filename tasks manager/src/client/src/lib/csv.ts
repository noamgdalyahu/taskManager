/** Turns rows into CSV text. Every cell is quoted, so commas, quotes and Hebrew text survive a round trip. */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
}

/** Hands the CSV to the browser as a download. A BOM first, so Excel reads it as UTF-8. */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const blob = new Blob(['\ufeff', toCsv(header, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
