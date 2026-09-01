import type {
  Column,
  FunctionalDependency,
  NFViolation,
  NormalizationAnalysis,
  NormalForm,
  TableRow,
} from './types';
import {
  findCandidateKeys,
  classifyAttributes,
  computeClosure,
  isSuperKey,
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
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (
          (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
          (trimmed.includes(',') && trimmed.split(',').length > 1 && !trimmed.startsWith('{'))
        ) {
          hasNonAtomicCell = true;
          break;
        }
      }
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
  rows: TableRow[]
): NormalizationAnalysis {
  const activeFDs = fds.filter((fd) => fd.isActive !== false);

  const { is1NF, violations: nf1Violations } = check1NF(columns, rows);

  const candidateKeys = findCandidateKeys(attributes, activeFDs);
  const { primeAttributes, nonPrimeAttributes } = classifyAttributes(
    attributes,
    candidateKeys
  );

  const violations: NFViolation[] = [...nf1Violations];
  const explanations: string[] = [];

  let is2NF = is1NF;
  let is3NF = is1NF;
  let isBCNF = is1NF;

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
      candidateKeys,
      primeAttributes,
      nonPrimeAttributes,
      violations,
      explanations,
    };
  }

  for (const fd of activeFDs) {
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

  let maxNormalForm: NormalForm = '1NF';
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
    candidateKeys,
    primeAttributes,
    nonPrimeAttributes,
    violations,
    explanations,
  };
}
