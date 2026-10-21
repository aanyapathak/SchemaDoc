import type {
  DecomposedTable,
  FunctionalDependency,
  TableRow,
} from './types';
import { findCandidateKeys, computeClosure, classifyAttributes, contains, sameSet, projectFDs, visitSubsets, isSuperKey } from './closure';
import type { MultivaluedDependency } from './types';
import { isTrivialMVD } from './normalFormChecker';
import { projectDataToTables } from './dataMigrator';

export function computeCanonicalCover(
  fds: FunctionalDependency[],
): FunctionalDependency[] {
  let cover: FunctionalDependency[] = [];
  const signature = (lhs: string[], rhs: string[]) =>
    JSON.stringify([[...lhs].sort(), rhs]);
  const seen = new Set<string>();
  for (const f of fds.filter((f) => f.isActive !== false))
    for (const a of new Set(f.rhs)) {
      const lhs = [...new Set(f.lhs)].sort();
      const key = signature(lhs, [a]);
      if (lhs.includes(a) || seen.has(key)) continue;
      seen.add(key);
      cover.push({ ...f, lhs, rhs: [a], id: `cover_${cover.length}` });
    }
  for (const f of cover) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const a of [...f.lhs]) {
        const reduced = f.lhs.filter((x) => x !== a);
        if (computeClosure(reduced, cover).includes(f.rhs[0])) {
          f.lhs = reduced;
          changed = true;
          break;
        }
      }
    }
  }
  for (let i = 0; i < cover.length;) {
    if (
      contains(
        computeClosure(
          cover[i].lhs,
          cover.filter((_, j) => j !== i),
        ),
        cover[i].rhs,
      )
    )
      cover.splice(i, 1);
    else i++;
  }
  const groups = new Map<string, FunctionalDependency>();
  for (const f of cover) {
    const key = JSON.stringify(f.lhs);
    const existing = groups.get(key);
    if (existing) existing.rhs = [...new Set([...existing.rhs, ...f.rhs])];
    else groups.set(key, { ...f, lhs: [...f.lhs], rhs: [...f.rhs] });
  }
  cover = [...groups.values()];
  return cover;
}

export function decomposeTo1NF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  assertAtomic(rows);
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
  all: string[],
  fds: FunctionalDependency[],
  rows: TableRow[],
) {
  const pending = [all];
  const complete: string[][] = [];
  while (pending.length) {
    const rel = pending.pop()!;
    const projected = projectFDs(rel, fds);
    const keys = findCandidateKeys(rel, projected);
    const { nonPrimeAttributes } = classifyAttributes(rel, keys);
    let split: { lhs: string[]; rhs: string[] } | undefined;
    for (const key of keys) {
      visitSubsets(key.attributes, (lhs) => {
        if (split || lhs.length === key.attributes.length) return;
        const rhs = computeClosure(lhs, projected).filter((a) =>
          nonPrimeAttributes.includes(a),
        );
        if (rhs.length) split = { lhs, rhs };
      });
      if (split) break;
    }
    if (!split) complete.push(rel);
    else {
      const { lhs, rhs } = split;
      pending.push(
        [...new Set([...lhs, ...rhs])],
        rel.filter((a) => !rhs.includes(a)),
      );
    }
  }
  return materialize('tbl_2nf', all,
    complete,
    fds,
    rows,
    'Removed partial dependencies on every candidate key using projected closures.',
  );
}

export function decomposeTo3NF(
  allAttributes: string[],
  fds: FunctionalDependency[],
  rows: TableRow[]
): DecomposedTable[] {
  assertAtomic(rows);
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
      if (sameSet(rel1.attributes, rel2.attributes)) return idx2 < idx1;
      return rel1.attributes.every((attr) => rel2.attributes.includes(attr));
    });
    return !isSubsetOfOther;
  });

  for (const rel of prunedRelations) {
    rel.primaryKey = findCandidateKeys(rel.attributes, projectFDs(rel.attributes, fds))[0]?.attributes ?? rel.attributes;
  }
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
  all: string[],
  fds: FunctionalDependency[],
  rows: TableRow[],
) {
  const pending = [all];
  const complete: string[][] = [];
  while (pending.length) {
    const rel = pending.pop()!;
    const projected = projectFDs(rel, fds);
    const violation = projected.find((f) => !isSuperKey(f.lhs, rel, projected));
    if (!violation) {
      complete.push(rel);
      continue;
    }
    const closure = computeClosure(violation.lhs, projected).filter((a) =>
      rel.includes(a),
    );
    const remainder = [
      ...new Set([
        ...violation.lhs,
        ...rel.filter((a) => !closure.includes(a)),
      ]),
    ];
    if (closure.length >= rel.length || remainder.length >= rel.length)
      throw new Error('BCNF split made no progress.');
    pending.push(closure, remainder);
  }
  return materialize('tbl_bcnf', all,
    complete,
    fds,
    rows,
    'Recursive BCNF decomposition under projected dependencies. Lossless under the confirmed FDs; dependency preservation is checked separately.',
  );
}

export function decomposeTo4NF(
  all: string[],
  fds: FunctionalDependency[],
  mvds: MultivaluedDependency[],
  rows: TableRow[],
) {
  // MVD implication under arbitrary projection is not inferred here. Apply declared
  // MVDs while their full original schema is available, then normalize FD projections.
  const pending = [all];
  const complete: string[][] = [];
  while (pending.length) {
    const rel = pending.pop()!;
    const projected = projectFDs(rel, fds);
    const mvd = mvds.find(
      (m) =>
        m.isActive !== false &&
        contains(rel, [...m.lhs, ...m.rhs]) &&
        !isTrivialMVD(m.lhs, m.rhs, rel) &&
        !isSuperKey(m.lhs, rel, projected),
    );
    if (!mvd) {
      complete.push(rel);
      continue;
    }
    const left = [...new Set([...mvd.lhs, ...mvd.rhs])];
    const right = rel.filter(
      (a) => !mvd.rhs.includes(a) || mvd.lhs.includes(a),
    );
    if (left.length >= rel.length || right.length >= rel.length)
      throw new Error('MVD split made no progress.');
    pending.push(left, right);
  }
  const bcnfRelations = complete.flatMap((r) =>
    decomposeToBCNF(r, projectFDs(r, fds), []).map((t) => t.attributes),
  );
  return materialize('tbl_4nf', all,
    bcnfRelations,
    fds,
    rows,
    'Decomposed using declared MVDs and projected FDs. Full 4NF certification requires higher-order dependency implication, which is not implemented.',
  );
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
  const activeJDs = jds.filter(jd => jd.isActive !== false);
  if (activeJDs.length > 0) {
     const jd = activeJDs[0];
     if (jd.relations.length < 2 || jd.relations.some(rel => !rel.length || !contains(allAttributes, rel)) || !contains(jd.relations.flat(), allAttributes)) throw new Error('Join dependency projections must cover the schema and reference existing attributes.'); // Take the first active JD for simplicity in this tool
     const tables: DecomposedTable[] = jd.relations.map((rel, idx) => ({
        id: `tbl_5nf_${idx + 1}`,
        name: `tbl_5nf_${idx + 1}`,
        attributes: rel,
        primaryKey: findCandidateKeys(rel, projectFDs(rel, fds))[0]?.attributes ?? rel,
        foreignKeys: [],
        reason: `Projection using a declared join dependency; general 5NF is not certified`,
        data: []
     }));
     return projectDataToTables(allAttributes, tables, rows);
  }
  void mvds;
  throw new Error('5NF cannot be inferred from functional dependencies alone. A declared join dependency is required.');
}

function cleanTableName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^id_|(_id)$/g, '');
}

function assertAtomic(rows: TableRow[]) {
  if (rows.some(row => Object.values(row).some(value => value !== null && typeof value === 'object'))) {
    throw new Error('Collection-valued data needs explicit atomic values or separate relations before normalization.');
  }
}

function materialize(prefix: string, all: string[], relations: string[][], fds: FunctionalDependency[], rows: TableRow[], reason: string): DecomposedTable[] {
  assertAtomic(rows);
  const unique = relations.filter((r, i) => !relations.slice(0, i).some(p => sameSet(p, r)));
  const schemas = unique.filter(r => !unique.some(p => p.length > r.length && contains(p, r)));
  const tables: DecomposedTable[] = schemas.map((attributes, i) => ({
    id: prefix + '_' + (i + 1), name: prefix + '_' + (i + 1), attributes,
    primaryKey: findCandidateKeys(attributes, projectFDs(attributes, fds))[0]?.attributes ?? attributes,
    foreignKeys: [], reason, data: [],
  }));
  if (prefix === 'tbl_2nf') for (const table of tables) for (const other of tables) {
    if (table !== other && other.primaryKey.length && contains(table.attributes, other.primaryKey)) table.foreignKeys.push({ column: other.primaryKey, referencedTable: other.name, referencedColumn: other.primaryKey });
  }
  return projectDataToTables(all, tables, rows);
}
