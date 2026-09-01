import type { DecomposedTable, TableRow } from './types';

export function projectDataToTables(
  _originalAttributes: string[],
  tables: DecomposedTable[],
  originalRows: TableRow[]
): DecomposedTable[] {
  if (originalRows.length === 0) return tables;

  return tables.map((table) => {
    const seenTuples = new Set<string>();
    const projectedRows: TableRow[] = [];

    for (const row of originalRows) {
      const projectedRow: TableRow = {};
      let hasValue = false;

      for (const attr of table.attributes) {
        if (attr in row) {
          projectedRow[attr] = row[attr];
          if (row[attr] !== undefined && row[attr] !== null) {
            hasValue = true;
          }
        }
      }

      if (!hasValue) continue;

      const tupleKey = table.attributes
        .map((attr) => `${attr}:${String(projectedRow[attr] ?? '')}`)
        .join('||');

      if (!seenTuples.has(tupleKey)) {
        seenTuples.add(tupleKey);
        projectedRows.push(projectedRow);
      }
    }

    return {
      ...table,
      data: projectedRows,
    };
  });
}
