import type { FunctionalDependency, TableRow } from './types';

export function discoverFunctionalDependencies(
  attributes: string[],
  rows: TableRow[]
): FunctionalDependency[] {
  if (rows.length === 0 || attributes.length === 0) return [];

  // An FD used in exact normalization must hold across every imported row.
  const sampleRows = rows;

  const discovered: FunctionalDependency[] = [];
  // For uploaded tables with many columns, limit candidate LHS size to avoid quadratic/cubic blowup
  const maxLhsSize = attributes.length > 12 ? 1 : Math.min(2, attributes.length - 1);

  const lhsCandidates: string[][] = [];
  
  for (const attr of attributes) {
    lhsCandidates.push([attr]);
  }
  
  if (maxLhsSize >= 2) {
    for (let i = 0; i < attributes.length; i++) {
      for (let j = i + 1; j < attributes.length; j++) {
        lhsCandidates.push([attributes[i], attributes[j]]);
      }
    }
  }

  for (const targetAttr of attributes) {
    for (const lhs of lhsCandidates) {
      if (lhs.includes(targetAttr)) continue;

      const existsSimplerLhs = discovered.some(
        (fd) =>
          fd.rhs.includes(targetAttr) &&
          fd.confidence === 1.0 &&
          fd.lhs.every((attr) => lhs.includes(attr))
      );

      if (existsSimplerLhs) continue;

      const { confidence, violations } = checkFDConfidence(lhs, targetAttr, sampleRows);

      if (confidence > 0.8) {
        const existing = discovered.find(
          (fd) =>
            fd.lhs.length === lhs.length &&
            fd.lhs.every((attr) => lhs.includes(attr)) &&
            fd.confidence === confidence
        );

        if (existing) {
          if (!existing.rhs.includes(targetAttr)) {
            existing.rhs.push(targetAttr);
          }
        } else {
          discovered.push({
            id: `fd_${lhs.join('_')}_to_${targetAttr}`,
            lhs,
            rhs: [targetAttr],
            confidence,
            violationsCount: violations,
            isActive: confidence === 1,
          });
        }
      }
    }
  }

  return discovered;
}

export function checkFDConfidence(
  lhs: string[],
  rhsAttr: string,
  rows: TableRow[]
): { confidence: number; violations: number } {
  if (rows.length === 0) return { confidence: 1, violations: 0 };

  const groups = new Map<string, Set<any>>();
  const groupRowCounts = new Map<string, number>();

  for (const row of rows) {
    const key = JSON.stringify(lhs.map(attr => [typeof row[attr], row[attr] ?? null]));
    const val = JSON.stringify([typeof row[rhsAttr], row[rhsAttr] ?? null]);

    if (!groups.has(key)) {
      groups.set(key, new Set());
      groupRowCounts.set(key, 0);
    }

    groups.get(key)!.add(val);
    groupRowCounts.set(key, groupRowCounts.get(key)! + 1);
  }

  let totalViolatingRows = 0;

  groups.forEach((values, key) => {
    if (values.size > 1) {
      totalViolatingRows += groupRowCounts.get(key)!;
    }
  });

  const validRows = rows.length - totalViolatingRows;
  const confidence = Math.max(0, validRows / rows.length);

  return {
    confidence,
    violations: totalViolatingRows,
  };
}
