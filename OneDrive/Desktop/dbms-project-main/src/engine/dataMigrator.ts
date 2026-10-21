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

      for (const attr of table.attributes) {
        if (attr in row) {
          projectedRow[attr] = row[attr];
        }
      }

      // Preserve all-null tuples and encode complete, typed tuples without delimiter collisions.

      const tupleKey = table.attributes
        .map(attr => [typeof projectedRow[attr], projectedRow[attr] ?? null]);
      const encodedTuple = JSON.stringify(tupleKey);

      if (!seenTuples.has(encodedTuple)) {
        seenTuples.add(encodedTuple);
        projectedRows.push(projectedRow);
      }
    }

    return {
      ...table,
      data: projectedRows,
    };
  });
}
