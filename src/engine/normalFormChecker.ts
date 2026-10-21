import type {
  Column,
  FunctionalDependency,
  NFViolation,
  NormalizationAnalysis,
  TableRow,
} from './types';
import {
  findCandidateKeys,
  classifyAttributes,
  computeClosure,
  isSuperKey,
  visitSubsets,
  contains,
} from './closure';

export function check1NF(
  columns: Column[],
  rows: TableRow[]
): { is1NF: boolean; violations: NFViolation[] } {
  const violations: NFViolation[] = [];
  const nonAtomicColumns: string[] = [];

  for (const col of columns) {
    let hasNonAtomicCell = false;

    for (const row of rows) {
      const val = row[col.name];
      if (Array.isArray(val)) {
        hasNonAtomicCell = true;
        break;
      }
      if (val !== null && typeof val === 'object') { hasNonAtomicCell = true; break; }
    }

    if (hasNonAtomicCell || col.isAtomic === false) {
      nonAtomicColumns.push(col.name);
    }
  }

  if (nonAtomicColumns.length > 0) {
    violations.push({
      level: '1NF',
      affectedAttributes: nonAtomicColumns,
      reason: `Column(s) ${nonAtomicColumns.map((c) => `'${c}'`).join(', ')} contain multi-valued or non-atomic data.`,
      mathProof: [
        `1NF Requirement: All domain values must be atomic.`,
        `Detected non-atomic entries in attribute(s): { ${nonAtomicColumns.join(', ')} }.`,
        `Proof: Attribute value contains repeating groups in single relation cells.`,
      ],
      recommendation: `Split multi-valued cells into individual rows or separate lookup tables to restore First Normal Form.`,
    });
  }

  return {
    is1NF: violations.length === 0,
    violations,
  };
}

export function analyzeNormalForm(
  attributes: string[],
  columns: Column[],
  fds: FunctionalDependency[],
  rows: TableRow[],
  mvds: import('./types').MultivaluedDependency[] = [],
  jds: import('./types').JoinDependency[] = []
): NormalizationAnalysis {
  const activeFDs = fds.filter((fd) => fd.isActive !== false);
  const activeMVDs = mvds.filter((mvd) => mvd.isActive !== false);
  const activeJDs = jds.filter((jd) => jd.isActive !== false);

  const { is1NF, violations: nf1Violations } = check1NF(columns, rows);

  const candidateKeys = findCandidateKeys(attributes, activeFDs);
  const { primeAttributes, nonPrimeAttributes } = classifyAttributes(
    attributes,
    candidateKeys
  );

  const violations: import('./types').NFViolation[] = [...nf1Violations];
  const explanations: string[] = [];

  let is2NF = is1NF;
  let is3NF = is1NF;
  let isBCNF = is1NF;
  let is4NF: boolean | null = null;
  let is5NF: boolean | null = null;

  const ckStrings = candidateKeys
    .map((ck) => `{ ${ck.attributes.join(', ')} }`)
    .join(', ');

  explanations.push(`Candidate Key(s) derived: ${ckStrings}`);
  explanations.push(
    `Prime Attributes (belonging to a candidate key): { ${
      primeAttributes.join(', ') || 'None'
    } }`
  );
  explanations.push(
    `Non-Prime Attributes: { ${nonPrimeAttributes.join(', ') || 'None'} }`
  );

  if (!is1NF) {
    return {
      maxNormalForm: 'UNNORMALIZED',
      is1NF: false,
      is2NF: false,
      is3NF: false,
      isBCNF: false,
      is4NF: false,
      is5NF: false,
      candidateKeys,
      primeAttributes,
      nonPrimeAttributes,
      violations,
      explanations,
    };
  }

  // 2NF depends on F+, not just the dependencies explicitly entered.
  const partialFDs: FunctionalDependency[] = [];
  const seenPartial = new Set<string>();
  for (const key of candidateKeys) visitSubsets(key.attributes, lhs => {
    if (lhs.length === key.attributes.length) return;
    const rhs = computeClosure(lhs, activeFDs).filter(a => nonPrimeAttributes.includes(a));
    const id = JSON.stringify([lhs, rhs]);
    if (rhs.length && !seenPartial.has(id)) {
      seenPartial.add(id); partialFDs.push({ id, lhs, rhs, confidence: 1 });
    }
  });
  for (const fd of partialFDs) {
    for (const rhsAttr of fd.rhs) {
      if (fd.lhs.includes(rhsAttr)) continue;

      const isRhsNonPrime = nonPrimeAttributes.includes(rhsAttr);

      if (isRhsNonPrime) {
        for (const ck of candidateKeys) {
          const isLhsSubsetOfCk = fd.lhs.every((attr) =>
            ck.attributes.includes(attr)
          );
          const isLhsProperSubset =
            isLhsSubsetOfCk && fd.lhs.length < ck.attributes.length;

          if (isLhsProperSubset) {
            is2NF = false;
            violations.push({
              level: '2NF',
              fd,
              failingKey: ck.attributes,
              affectedAttributes: [rhsAttr],
              reason: `Partial Dependency Detected! Non-prime attribute '${rhsAttr}' is functionally dependent on { ${fd.lhs.join(
                ', '
              )} }, which is only a partial subset of Candidate Key { ${ck.attributes.join(
                ', '
              )} }.`,
              mathProof: [
                `Candidate Key K = { ${ck.attributes.join(', ')} }`,
                `Determinant X = { ${fd.lhs.join(', ')} } ⊂ K (Proper Subset of K)`,
                `Dependent Attribute A = '${rhsAttr}' ∉ Prime Attributes`,
                `FD: { ${fd.lhs.join(', ')} } → '${rhsAttr}' holds in relation.`,
                `Conclusion: A is partially dependent on Candidate Key K. Table violates 2NF!`,
              ],
              recommendation: `Extract { ${fd.lhs.join(
                ', '
              )}, ${rhsAttr} } into a separate relation to eliminate partial dependency.`,
            });
          }
        }
      }
    }
  }

  for (const fd of activeFDs) {
    for (const rhsAttr of fd.rhs) {
      if (fd.lhs.includes(rhsAttr)) continue;

      const lhsIsSuper = isSuperKey(fd.lhs, attributes, activeFDs);
      const rhsIsPrime = primeAttributes.includes(rhsAttr);

      if (!lhsIsSuper && !rhsIsPrime) {
        is3NF = false;
        const alreadyFlagged = violations.some(
          (v) => v.level === '2NF' && v.fd?.id === fd.id
        );

        if (!alreadyFlagged) {
          const lhsClosure = computeClosure(fd.lhs, activeFDs);
          violations.push({
            level: '3NF',
            fd,
            affectedAttributes: [rhsAttr],
            reason: `Transitive Dependency Detected! FD { ${fd.lhs.join(
              ', '
            )} } → '${rhsAttr}' holds, but { ${fd.lhs.join(
              ', '
            )} } is NOT a Superkey and '${rhsAttr}' is NOT a Prime Attribute.`,
            mathProof: [
              `FD: { ${fd.lhs.join(', ')} } → '${rhsAttr}'`,
              `LHS Closure: { ${fd.lhs.join(
                ', '
              )} }+ = { ${lhsClosure.join(', ')} } ≠ R (Not a Superkey)`,
              `RHS: '${rhsAttr}' ∉ Prime Attributes`,
              `Transitive Chain: Primary Key → { ${fd.lhs.join(
                ', '
              )} } → '${rhsAttr}'`,
              `Conclusion: Transitive dependency exists. Table violates 3NF!`,
            ],
            recommendation: `Decompose table by creating R_new({ ${fd.lhs.join(
              ', '
            )}, ${rhsAttr} }) with primary key { ${fd.lhs.join(', ')} }.`,
          });
        }
      }
    }
  }

  for (const fd of activeFDs) {
    if (fd.rhs.every(a => fd.lhs.includes(a))) continue;
    const lhsIsSuper = isSuperKey(fd.lhs, attributes, activeFDs);
    if (!lhsIsSuper) {
      isBCNF = false;
      const alreadyIn3NF = violations.some(
        (v) => (v.level === '2NF' || v.level === '3NF') && v.fd?.id === fd.id
      );

      if (!alreadyIn3NF) {
        const lhsClosure = computeClosure(fd.lhs, activeFDs);
        violations.push({
          level: 'BCNF',
          fd,
          affectedAttributes: fd.rhs,
          reason: `BCNF Violation! FD { ${fd.lhs.join(
            ', '
          )} } → { ${fd.rhs.join(
            ', '
          )} } holds, but determinant { ${fd.lhs.join(
            ', '
          )} } is NOT a Superkey.`,
          mathProof: [
            `FD: { ${fd.lhs.join(', ')} } → { ${fd.rhs.join(', ')} }`,
            `LHS Closure: { ${fd.lhs.join(
              ', '
            )} }+ = { ${lhsClosure.join(', ')} } ≠ R`,
            `BCNF Rule: For every non-trivial X → Y, X MUST be a Superkey.`,
            `Conclusion: Determinant { ${fd.lhs.join(
              ', '
            )} } is not a superkey, violating BCNF!`,
          ],
          recommendation: `Split relation into R1({ ${fd.lhs.join(
            ', '
          )}, ${fd.rhs.join(', ')} }) and R2(R - Y).`,
        });
      }
    }
  }

  // 4NF Check
  for (const mvd of activeMVDs) {
    if (isTrivialMVD(mvd.lhs, mvd.rhs, attributes)) continue;
    const lhsIsSuper = isSuperKey(mvd.lhs, attributes, activeFDs);
    if (!lhsIsSuper) {
      is4NF = false;
      violations.push({
        level: '4NF',
        mvd,
        affectedAttributes: mvd.rhs,
        reason: `4NF Violation! MVD { ${mvd.lhs.join(', ')} } ↠ { ${mvd.rhs.join(', ')} } holds, but { ${mvd.lhs.join(', ')} } is NOT a Superkey.`,
        mathProof: [
          `MVD: { ${mvd.lhs.join(', ')} } ↠ { ${mvd.rhs.join(', ')} }`,
          `4NF Rule: For every non-trivial MVD X ↠ Y, X MUST be a Superkey.`,
          `Conclusion: Determinant { ${mvd.lhs.join(', ')} } is not a superkey, violating 4NF!`,
        ],
        recommendation: `Split relation into R1({ ${mvd.lhs.join(', ')}, ${mvd.rhs.join(', ')} }) and R2(R - Y).`,
      });
    }
  }

  // 5NF Check
  for (const jd of activeJDs) {
    if (jd.relations.some(rel => contains(rel, attributes))) continue;
    let impliedBySuperkeys = true;
    for (const rel of jd.relations) {
      if (!isSuperKey(rel, attributes, activeFDs)) {
        impliedBySuperkeys = false;
        break;
      }
    }
    
    if (!impliedBySuperkeys) {
      is5NF = false;
      violations.push({
        level: '5NF',
        jd,
        affectedAttributes: [],
        reason: `5NF Violation! Join Dependency holds but not all components are Superkeys.`,
        mathProof: [
          `JD: ⋈(${jd.relations.map(r => '{' + r.join(', ') + '}').join(', ')})`,
          `5NF Rule: For every non-trivial JD, every component relation MUST be a Superkey.`,
          `Conclusion: Not all components are superkeys, violating 5NF!`,
        ],
        recommendation: `Decompose table into the projections defined by the Join Dependency.`,
      });
    }
  }

  is3NF = is3NF && is2NF;
  isBCNF = isBCNF && is3NF;
  if (!isBCNF) is4NF = false;
  if (is4NF === false) is5NF = false;
  explanations.push('4NF and 5NF are not certified without a complete higher-order dependency analysis.');
  let maxNormalForm: import('./types').NormalForm = '1NF';
  if (!is1NF) maxNormalForm = 'UNNORMALIZED';
  else if (isBCNF) maxNormalForm = 'BCNF';
  else if (is3NF) maxNormalForm = '3NF';
  else if (is2NF) maxNormalForm = '2NF';

  return {
    maxNormalForm,
    is1NF,
    is2NF,
    is3NF,
    isBCNF,
    is4NF,
    is5NF,
    candidateKeys,
    primeAttributes,
    nonPrimeAttributes,
    violations,
    explanations,
  };
}

export function isTrivialMVD(lhs: string[], rhs: string[], attributes: string[]): boolean {
  return contains(lhs, rhs) || contains([...new Set([...lhs, ...rhs])], attributes);
}
