import type {
  DecomposedTable,
  FunctionalDependency,
  TableRow,
} from './types';
import { findCandidateKeys, computeClosure, classifyAttributes } from './closure';
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

export function decomposeTo1NF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  const candidateKeys = findCandidateKeys(allAttributes, fds);
  const primaryCandidateKey = candidateKeys[0]?.attributes || allAttributes;
  
  const tables: DecomposedTable[] = [{
    id: 'tbl_1',
    name: 'tbl_1nf_main',
    attributes: allAttributes,
    primaryKey: primaryCandidateKey,
    foreignKeys: [],
    reason: `1NF Form: Contains all attributes with primary candidate key { ${primaryCandidateKey.join(', ')} }.`,
    data: []
  }];
  
  return projectDataToTables(allAttributes, tables, rows);
}

export function decomposeTo2NF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  const candidateKeys = findCandidateKeys(allAttributes, fds);
  const primaryCandidateKey = candidateKeys[0]?.attributes || allAttributes;
  
  const { nonPrimeAttributes } = classifyAttributes(allAttributes, candidateKeys);
  
  const partialDependencies = new Map<string, Set<string>>();
  const canonicalCover = computeCanonicalCover(fds);
  
  for (const fd of canonicalCover) {
     const isProperSubset = fd.lhs.length < primaryCandidateKey.length && fd.lhs.every(attr => primaryCandidateKey.includes(attr));
     if (isProperSubset) {
         const nonPrimeRhs = fd.rhs.filter(attr => nonPrimeAttributes.includes(attr));
         if (nonPrimeRhs.length > 0) {
            const key = fd.lhs.sort().join(',');
            if (!partialDependencies.has(key)) {
                partialDependencies.set(key, new Set());
            }
            nonPrimeRhs.forEach(attr => partialDependencies.get(key)!.add(attr));
         }
     }
  }
  
  if (partialDependencies.size === 0) {
     return decomposeTo1NF(allAttributes, fds, rows);
  }
  
  const rawRelations: { name: string; attributes: string[]; primaryKey: string[]; reason: string }[] = [];
  let mainTableAttributes = new Set(allAttributes);
  
  let tblIdx = 1;
  partialDependencies.forEach((rhsSet, lhsKey) => {
      const lhs = lhsKey.split(',');
      const rhs = Array.from(rhsSet);
      
      const mainAttr = lhs[0] || 'Entity';
      const tableName = `tbl_${cleanTableName(mainAttr)}_partial_${tblIdx++}`;
      
      rawRelations.push({
          name: tableName,
          attributes: [...lhs, ...rhs],
          primaryKey: lhs,
          reason: `Extracted to remove partial dependency: { ${lhs.join(', ')} } → { ${rhs.join(', ')} }`
      });
      
      rhs.forEach(attr => mainTableAttributes.delete(attr));
  });
  
  rawRelations.push({
      name: `tbl_2nf_main`,
      attributes: Array.from(mainTableAttributes),
      primaryKey: primaryCandidateKey,
      reason: `Main table retaining full primary key { ${primaryCandidateKey.join(', ')} } and fully dependent attributes.`
  });
  
  const tables: DecomposedTable[] = rawRelations.map((rel, idx) => {
      const foreignKeys: DecomposedTable['foreignKeys'] = [];
      if (rel.name === 'tbl_2nf_main') {
         rawRelations.forEach((otherRel) => {
             if (otherRel.name !== 'tbl_2nf_main') {
                 foreignKeys.push({
                     column: otherRel.primaryKey,
                     referencedTable: otherRel.name,
                     referencedColumn: otherRel.primaryKey
                 });
             }
         });
      }
      
      return {
          id: `tbl_${idx + 1}`,
          name: rel.name,
          attributes: rel.attributes,
          primaryKey: rel.primaryKey,
          foreignKeys,
          reason: rel.reason,
          data: []
      };
  });
  
  return projectDataToTables(allAttributes, tables, rows);
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

export function decomposeToBCNF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  // A simple BCNF top-down decomposition algorithm
  // Actually, BCNF is often achieved by 3NF synthesis + checking for BCNF violations
  // For simplicity, we just use 3NF decomposer and pretend it's BCNF if it meets the criteria,
  // or we can implement a real recursive BCNF decomposer.
  // Real recursive:
  let relations = [{ attributes: allAttributes }];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < relations.length; i++) {
      const rel = relations[i];
      // find a BCNF violation
      const activeFDs = fds.filter(fd => fd.lhs.every(a => rel.attributes.includes(a)) && fd.rhs.every(a => rel.attributes.includes(a)));
      const candidateKeys = findCandidateKeys(rel.attributes, activeFDs);
      
      let violation = null;
      for (const fd of activeFDs) {
         const isSuper = candidateKeys.some(ck => ck.attributes.every(a => fd.lhs.includes(a)));
         if (!isSuper && fd.rhs.some(a => !fd.lhs.includes(a))) {
            violation = fd;
            break;
         }
      }
      
      if (violation) {
         const attrs1 = Array.from(new Set([...violation.lhs, ...violation.rhs]));
         const attrs2 = rel.attributes.filter(a => !violation.rhs.includes(a) || violation.lhs.includes(a));
         relations.splice(i, 1, { attributes: attrs1 }, { attributes: attrs2 });
         changed = true;
         break;
      }
    }
  }

  const tables: DecomposedTable[] = relations.map((rel, idx) => ({
    id: `tbl_bcnf_${idx + 1}`,
    name: `tbl_bcnf_${idx + 1}`,
    attributes: rel.attributes,
    primaryKey: findCandidateKeys(rel.attributes, fds.filter(fd => fd.lhs.every(a => rel.attributes.includes(a))))[0]?.attributes || rel.attributes,
    foreignKeys: [],
    reason: `BCNF Decomposition`,
    data: []
  }));

  return projectDataToTables(allAttributes, tables, rows);
}

export function decomposeTo4NF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  mvds: import('./types').MultivaluedDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  // First get BCNF, then apply 4NF
  let bcnfTables = decomposeToBCNF(allAttributes, fds, rows);
  let relations = bcnfTables.map(t => ({ attributes: t.attributes }));
  let changed = true;
  
  while (changed) {
    changed = false;
    for (let i = 0; i < relations.length; i++) {
      const rel = relations[i];
      const activeFDs = fds.filter(fd => fd.lhs.every(a => rel.attributes.includes(a)) && fd.rhs.every(a => rel.attributes.includes(a)));
      const candidateKeys = findCandidateKeys(rel.attributes, activeFDs);
      
      let violation = null;
      for (const mvd of mvds) {
         if (mvd.lhs.every(a => rel.attributes.includes(a)) && mvd.rhs.every(a => rel.attributes.includes(a))) {
            const isSuper = candidateKeys.some(ck => ck.attributes.every(a => mvd.lhs.includes(a)));
            if (!isSuper) {
               violation = mvd;
               break;
            }
         }
      }
      
      if (violation) {
         const attrs1 = Array.from(new Set([...violation.lhs, ...violation.rhs]));
         const attrs2 = rel.attributes.filter(a => !violation.rhs.includes(a) || violation.lhs.includes(a));
         relations.splice(i, 1, { attributes: attrs1 }, { attributes: attrs2 });
         changed = true;
         break;
      }
    }
  }

  const tables: DecomposedTable[] = relations.map((rel, idx) => ({
    id: `tbl_4nf_${idx + 1}`,
    name: `tbl_4nf_${idx + 1}`,
    attributes: rel.attributes,
    primaryKey: rel.attributes, // Usually all attributes in 4NF MVD decomposition form the key
    foreignKeys: [],
    reason: `4NF Decomposition`,
    data: []
  }));

  return projectDataToTables(allAttributes, tables, rows);
}

export function decomposeTo5NF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  mvds: import('./types').MultivaluedDependency[],
  jds: import('./types').JoinDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  // 5NF is complex, usually we just project onto the JD components if it violates
  // Since 5NF decomposes based on JDs directly:
  if (jds.length > 0) {
     const jd = jds[0]; // Take the first active JD for simplicity in this tool
     const tables: DecomposedTable[] = jd.relations.map((rel, idx) => ({
        id: `tbl_5nf_${idx + 1}`,
        name: `tbl_5nf_${idx + 1}`,
        attributes: rel,
        primaryKey: rel,
        foreignKeys: [],
        reason: `5NF Decomposition via Join Dependency`,
        data: []
     }));
     return projectDataToTables(allAttributes, tables, rows);
  }
  return decomposeTo4NF(allAttributes, fds, mvds, rows);
}

function cleanTableName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^id_|(_id)$/g, '');
}
