const XLSX = require('./node_modules/xlsx');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'datos', 'resultados_estudiantes_7404_MATEMÁTICA_3_A_diagnostico_2026.xls');
const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

let output = `File: ${path.basename(file)}\nSheet: ${wb.SheetNames[0]}\nTotal rows: ${data.length}\nRange: ${ws['!ref']}\n\n`;

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  output += `--- ROW ${i} ---\n`;
  for (let j = 0; j < row.length; j++) {
    if (row[j] !== '') {
      output += `  [${j}]: ${JSON.stringify(row[j])}\n`;
    }
  }
}

if (ws['!merges']) {
  output += `\n--- MERGES (${ws['!merges'].length}) ---\n`;
  for (const m of ws['!merges']) {
    output += `  ${XLSX.utils.encode_range(m)}\n`;
  }
}

fs.writeFileSync(path.join(__dirname, 'excel_structure.txt'), output);
console.log('Done!');
