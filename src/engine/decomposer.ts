import type {
  DecomposedTable,
  FunctionalDependency,
  TableRow,
} from './types';
import { findCandidateKeys, computeClosure } from './closure';
import { projectDataToTables } from './dataMigrator';

export function computeCanonicalCover(
  fds: FunctionalDependency[]
): FunctionalDependency[] {
  const activeFDs = fds.filter((fd) => fd.isActive !== false);

  const singletonFDs: FunctionalDependency[] = [];
  for (const fd of activeFDs) {
    for (const rhsAttr of fd.rhs) {
      singletonFDs.push({
        id: `fc_${fd.lhs.join('_')}_to_${rhsAttr}`,
        lhs: [...fd.lhs],
        rhs: [rhsAttr],
        confidence: fd.confidence,
      });
    }
  }

  for (const fd of singletonFDs) {
    if (fd.lhs.length > 1) {
      for (let i = 0; i < fd.lhs.length; i++) {
        const reducedLhs = fd.lhs.filter((_, idx) => idx !== i);
        const closure = computeClosure(reducedLhs, singletonFDs);
        if (closure.includes(fd.rhs[0])) {
          fd.lhs = reducedLhs;
        }
      }
    }
  }

  const minimalFDs: FunctionalDependency[] = [];
  for (let i = 0; i < singletonFDs.length; i++) {
    const candidateFD = singletonFDs[i];
    const otherFDs = singletonFDs.filter((_, idx) => idx !== i);
    const closure = computeClosure(candidateFD.lhs, otherFDs);

    if (!closure.includes(candidateFD.rhs[0])) {
      minimalFDs.push(candidateFD);
    }
  }

  const groupedMap = new Map<string, string[]>();
  for (const fd of minimalFDs) {
    const key = fd.lhs.sort().join(',');
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key)!.push(...fd.rhs);
  }

  const resultCover: FunctionalDependency[] = [];
  groupedMap.forEach((rhsAttrs, lhsKey) => {
    const lhs = lhsKey.split(',');
    const uniqueRhs = Array.from(new Set(rhsAttrs));
    resultCover.push({
      id: `canonical_${lhs.join('_')}`,
      lhs,
      rhs: uniqueRhs,
      confidence: 1.0,
    });
  });

  return resultCover;
}

export function decomposeTo3NF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  const candidateKeys = findCandidateKeys(allAttributes, fds);
  const canonicalCover = computeCanonicalCover(fds);

  const rawRelations: { name: string; attributes: string[]; primaryKey: string[]; reason: string }[] = [];

  canonicalCover.forEach((fd, idx) => {
    const attrs = Array.from(new Set([...fd.lhs, ...fd.rhs]));
    const mainAttr = fd.lhs[0] || 'Entity';
    const tableName = `tbl_${cleanTableName(mainAttr)}_${idx + 1}`;

    rawRelations.push({
      name: tableName,
      attributes: attrs,
      primaryKey: fd.lhs,
      reason: `Created from Functional Dependency { ${fd.lhs.join(', ')} } → { ${fd.rhs.join(', ')} }`,
    });
  });

  const primaryCandidateKey = candidateKeys[0]?.attributes || allAttributes;
  const hasCandidateKeyRelation = rawRelations.some((rel) =>
    primaryCandidateKey.every((attr) => rel.attributes.includes(attr))
  );

  if (!hasCandidateKeyRelation && primaryCandidateKey.length > 0) {
    rawRelations.push({
      name: `tbl_main_key_${rawRelations.length + 1}`,
      attributes: primaryCandidateKey,
      primaryKey: primaryCandidateKey,
      reason: `Lossless Join Guarantee: Retains original primary candidate key { ${primaryCandidateKey.join(', ')} }`,
    });
  }

  const prunedRelations = rawRelations.filter((rel1, idx1) => {
    const isSubsetOfOther = rawRelations.some((rel2, idx2) => {
      if (idx1 === idx2) return false;
      return rel1.attributes.every((attr) => rel2.attributes.includes(attr));
    });
    return !isSubsetOfOther;
  });

  const tables: DecomposedTable[] = prunedRelations.map((rel, idx) => {
    const foreignKeys: DecomposedTable['foreignKeys'] = [];

    prunedRelations.forEach((otherRel, otherIdx) => {
      if (idx === otherIdx) return;
      const isPkSubset = otherRel.primaryKey.every((pkAttr) =>
        rel.attributes.includes(pkAttr)
      );
      if (isPkSubset && otherRel.primaryKey.length > 0) {
        foreignKeys.push({
          column: otherRel.primaryKey,
          referencedTable: otherRel.name,
          referencedColumn: otherRel.primaryKey,
        });
      }
    });

    return {
      id: `tbl_${idx + 1}`,
      name: rel.name,
      attributes: rel.attributes,
      primaryKey: rel.primaryKey,
      foreignKeys,
      reason: rel.reason,
      data: [],
    };
  });

  return projectDataToTables(allAttributes, tables, rows);
}

function cleanTableName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^id_|(_id)$/g, '');
}
