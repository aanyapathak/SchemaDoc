import type { FunctionalDependency, CandidateKey } from './types';

/**
 * Computes the attribute closure X+ of attribute set X under functional dependencies F.
 */
export function computeClosure(
  attributes: string[],
  fds: FunctionalDependency[]
): string[] {
  let closure = new Set<string>(attributes);
  let changed = true;

  const activeFDs = fds.filter((fd) => fd.isActive !== false);

  while (changed) {
    changed = false;
    for (const fd of activeFDs) {
      const lhsIsSubset = fd.lhs.every((attr) => closure.has(attr));
      if (lhsIsSubset) {
        for (const rhsAttr of fd.rhs) {
          if (!closure.has(rhsAttr)) {
            closure.add(rhsAttr);
            changed = true;
          }
        }
      }
    }
  }

  return Array.from(closure);
}

function getPowerSet<T>(array: T[]): T[][] {
  const result: T[][] = [[]];
  for (const item of array) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i], item]);
    }
  }
  return result;
}

export function findCandidateKeys(
  allAttributes: string[],
  fds: FunctionalDependency[]
): CandidateKey[] {
  if (allAttributes.length === 0) return [];

  const activeFDs = fds.filter((fd) => fd.isActive !== false);
  const powerSet = getPowerSet(allAttributes);

  powerSet.sort((a, b) => a.length - b.length);

  const candidateKeys: string[][] = [];

  for (const subset of powerSet) {
    if (subset.length === 0) continue;

    const containsExistingKey = candidateKeys.some((ck) =>
      ck.every((attr) => subset.includes(attr))
    );

    if (containsExistingKey) continue;

    const closure = computeClosure(subset, activeFDs);
    if (closure.length === allAttributes.length) {
      candidateKeys.push(subset);
    }
  }

  if (candidateKeys.length === 0) {
    candidateKeys.push([...allAttributes]);
  }

  return candidateKeys.map((ck, idx) => ({
    attributes: ck,
    isPrimary: idx === 0,
  }));
}

export function classifyAttributes(
  allAttributes: string[],
  candidateKeys: CandidateKey[]
): { primeAttributes: string[]; nonPrimeAttributes: string[] } {
  const primeSet = new Set<string>();

  candidateKeys.forEach((ck) => {
    ck.attributes.forEach((attr) => primeSet.add(attr));
  });

  const primeAttributes = allAttributes.filter((attr) => primeSet.has(attr));
  const nonPrimeAttributes = allAttributes.filter((attr) => !primeSet.has(attr));

  return { primeAttributes, nonPrimeAttributes };
}

export function isSuperKey(
  subset: string[],
  allAttributes: string[],
  fds: FunctionalDependency[]
): boolean {
  const closure = computeClosure(subset, fds);
  return allAttributes.every((attr) => closure.includes(attr));
}
