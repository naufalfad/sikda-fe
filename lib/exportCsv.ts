/**
 * Helper utilitas untuk mengekspor data tabel ke format CSV (Kompatibel penuh dengan Microsoft Excel)
 * Menggunakan UTF-8 BOM (\uFEFF) agar simbol dan karakter khusus terbaca otomatis tanpa distorsi.
 */
export function exportTableToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  
  // Header row
  csvRows.push(headers.map(escapeCell).join(','));

  // Data rows
  rows.forEach(row => {
    csvRows.push(row.map(escapeCell).join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

