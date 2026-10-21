import type { Column, DecomposedTable, SQLDialect, TableRow } from './types';

function inferSqlType(attr: string, columns: Column[], rows: TableRow[], dialect: SQLDialect): string {
  const colDef = columns.find((c) => c.name === attr);
  if (colDef?.type) {
    let t = colDef.type.toUpperCase();
    if (t === 'INT' || t === 'INTEGER') return dialect === 'postgresql' ? 'INTEGER' : 'INT';
    if (t === 'VARCHAR' || t === 'TEXT') return 'VARCHAR(255)';
    if (t === 'DECIMAL' || t === 'NUMERIC') return 'DECIMAL(10, 2)';
    if (t === 'DATE') return 'DATE';
  }

  for (const row of rows) {
    const val = row[attr];
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'INT' : 'DECIMAL(10, 2)';
    }
    if (val instanceof Date) return 'DATE';
  }

  return 'VARCHAR(255)';
}

export function generateSQLScript(
  tables: DecomposedTable[],
  columns: Column[],
  originalRows: TableRow[],
  dialect: SQLDialect = 'postgresql'
): string {
  const lines: string[] = [];

  lines.push(`-- ============================================================`);
  lines.push(`-- SCHEMA DOCTOR: AUTOMATED DBMS NORMALIZATION SCRIPT`);
  lines.push(`-- Target Dialect: ${dialect.toUpperCase()}`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Total Normalized Tables: ${tables.length}`);
  lines.push(`-- ============================================================\n`);

  if (dialect === 'postgresql') {
    lines.push(`-- Enable CASCADE drop for clean rerun`);
    tables.forEach((t) => lines.push(`DROP TABLE IF EXISTS ${t.name} CASCADE;`));
    lines.push(`\n`);
  } else if (dialect === 'mysql' || dialect === 'sqlite') {
    tables.forEach((t) => lines.push(`DROP TABLE IF EXISTS ${t.name};`));
    lines.push(`\n`);
  }

  tables.forEach((t) => {
    lines.push(`-- Table: ${t.name}`);
    lines.push(`-- Reason: ${t.reason}`);
    lines.push(`CREATE TABLE ${t.name} (`);

    const colDefs: string[] = [];

    t.attributes.forEach((attr) => {
      const type = inferSqlType(attr, columns, originalRows, dialect);
      const isPk = t.primaryKey.includes(attr);
      const nullable = isPk ? 'NOT NULL' : 'NULL';
      colDefs.push(`  ${attr} ${type} ${nullable}`);
    });

    if (t.primaryKey.length > 0) {
      colDefs.push(`  PRIMARY KEY (${t.primaryKey.join(', ')})`);
    }

    t.foreignKeys.forEach((fk) => {
      colDefs.push(
        `  FOREIGN KEY (${fk.column.join(', ')}) REFERENCES ${
          fk.referencedTable
        } (${fk.referencedColumn.join(', ')}) ON DELETE CASCADE ON UPDATE CASCADE`
      );
    });

    lines.push(colDefs.join(',\n'));
    lines.push(`);\n`);
  });

  lines.push(`-- ============================================================`);
  lines.push(`-- MIGRATED DATA INSERTS`);
  lines.push(`-- ============================================================\n`);

  tables.forEach((t) => {
    if (t.data.length === 0) return;

    lines.push(`-- Inserts for ${t.name} (${t.data.length} tuples)`);
    t.data.forEach((row) => {
      const attrs = t.attributes;
      const vals = attrs.map((attr) => {
        const val = row[attr];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return String(val);
        const strVal = String(val).replace(/'/g, "''");
        return `'${strVal}'`;
      });

      lines.push(
        `INSERT INTO ${t.name} (${attrs.join(', ')}) VALUES (${vals.join(', ')});`
      );
    });
    lines.push(`\n`);
  });

  return lines.join('\n');
}
