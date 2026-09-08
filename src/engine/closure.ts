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


export function findCandidateKeys(
  allAttributes: string[],
  fds: FunctionalDependency[]
): CandidateKey[] {
  if (allAttributes.length === 0) return [];

  const activeFDs = fds.filter((fd) => fd.isActive !== false);

  // If there are no FDs or trivial case, candidate key is all attributes
  if (activeFDs.length === 0) {
    return [{ attributes: [...allAttributes], isPrimary: true }];
  }

  // Fast-path: Check essential attributes (never appear on RHS of any FD)
  const rhsAttributes = new Set<string>();
  activeFDs.forEach((fd) => fd.rhs.forEach((attr) => rhsAttributes.add(attr)));
  const coreAttributes = allAttributes.filter((attr) => !rhsAttributes.has(attr));

  // If closure of core attributes is all attributes, core is the unique minimal candidate key!
  if (coreAttributes.length > 0) {
    const coreClosure = computeClosure(coreAttributes, activeFDs);
    if (coreClosure.length === allAttributes.length) {
      return [{ attributes: coreAttributes, isPrimary: true }];
    }
  }

  // Search by increasing subset size (1, 2, 3...) with early exit and pruning
  const candidateKeys: string[][] = [];
  const maxKeySize = Math.min(allAttributes.length, 5);

  function searchSubsets(current: string[], startIndex: number, targetSize: number) {
    if (candidateKeys.length >= 5) return; // Limit candidate keys to prevent freeze

    if (current.length === targetSize) {
      // Check if superset of an existing key
      const isSuperKeyOfFound = candidateKeys.some((k) =>
        k.every((attr) => current.includes(attr))
      );
      if (!isSuperKeyOfFound) {
        const closure = computeClosure(current, activeFDs);
        if (closure.length === allAttributes.length) {
          candidateKeys.push([...current]);
        }
      }
      return;
    }

    for (let i = startIndex; i < allAttributes.length; i++) {
      current.push(allAttributes[i]);
      searchSubsets(current, i + 1, targetSize);
      current.pop();
    }
  }

  // Start with core attributes if available
  for (let size = Math.max(1, coreAttributes.length); size <= maxKeySize; size++) {
    searchSubsets([], 0, size);
    if (candidateKeys.length > 0) break; // In practice, minimal keys will be found at smallest size
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
