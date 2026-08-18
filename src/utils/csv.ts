// RFC4180に準拠したシンプルなCSVパーサ。
// ダブルクォートで囲まれたフィールド内のカンマ・改行・エスケープされた""をそのまま扱える
// （オープンデータのCSVは「営業時間」等のフィールドに改行を含むことがあるため、単純な行分割では壊れる）。
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // 改行はこの後の\nまたは単独の\rで処理するため無視
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // 末尾に改行が無いファイルのための後始末
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
};
