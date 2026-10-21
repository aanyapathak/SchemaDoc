import type { FunctionalDependency, CandidateKey } from './types';
export const SEARCH_BUDGET = 100_000;
export class SearchLimitError extends Error {
  constructor() {
    super(
      'Exact analysis exceeded its search budget. Reduce the number of attributes or add confirmed dependencies. No partial result was used.',
    );
  }
}
export const contains = (superset: string[], subset: string[]) =>
  subset.every((a) => superset.includes(a));
export const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && contains(a, b);
export function computeClosure(
  attributes: string[],
  fds: FunctionalDependency[],
): string[] {
  const closure = new Set(attributes);
  const active = fds.filter((fd) => fd.isActive !== false);
  let changed = true;
  while (changed) {
    changed = false;
    for (const fd of active)
      if (fd.lhs.every((a) => closure.has(a))) {
        for (const a of fd.rhs)
          if (!closure.has(a)) {
            closure.add(a);
            changed = true;
          }
      }
  }
  return [...closure];
}
export function visitSubsets(
  attributes: string[],
  visit: (subset: string[]) => void,
) {
  let visited = 0;
  function choose(start: number, current: string[], size: number) {
    if (current.length === size) {
      if (++visited > SEARCH_BUDGET) throw new SearchLimitError();
      visit([...current]);
      return;
    }
    for (let i = start; i <= attributes.length - (size - current.length); i++) {
      current.push(attributes[i]);
      choose(i + 1, current, size);
      current.pop();
    }
  }
  for (let size = 0; size <= attributes.length; size++) choose(0, [], size);
}
export function findCandidateKeys(
  allAttributes: string[],
  fds: FunctionalDependency[],
): CandidateKey[] {
  if (!allAttributes.length) return [];
  const attrs = [...new Set(allAttributes)];
  const active = fds.filter((fd) => fd.isActive !== false);
  const rhs = new Set(active.flatMap((fd) => fd.rhs));
  const core = attrs.filter((a) => !rhs.has(a));
  const optional = attrs.filter((a) => !core.includes(a));
  const keys: string[][] = [];
  let visited = 0;
  function choose(start: number, current: string[], remaining: number) {
    if (++visited > SEARCH_BUDGET) throw new SearchLimitError();
    if (keys.some((k) => contains(current, k))) return;
    if (!remaining) {
      if (isSuperKey(current, attrs, active)) keys.push([...current]);
      return;
    }
    for (let i = start; i <= optional.length - remaining; i++) {
      current.push(optional[i]);
      choose(i + 1, current, remaining - 1);
      current.pop();
    }
  }
  for (let size = 0; size <= optional.length; size++)
    choose(0, [...core], size);
  return keys.map((attributes, i) => ({ attributes, isPrimary: i === 0 }));
}
export function classifyAttributes(
  allAttributes: string[],
  candidateKeys: CandidateKey[],
) {
  const prime = new Set(candidateKeys.flatMap((k) => k.attributes));
  return {
    primeAttributes: allAttributes.filter((a) => prime.has(a)),
    nonPrimeAttributes: allAttributes.filter((a) => !prime.has(a)),
  };
}
export function isSuperKey(
  subset: string[],
  attributes: string[],
  fds: FunctionalDependency[],
) {
  return contains(computeClosure(subset, fds), attributes);
}
/** Project F+; implications through removed attributes still apply. */
export function projectFDs(
  attributes: string[],
  fds: FunctionalDependency[],
): FunctionalDependency[] {
  const projected: FunctionalDependency[] = [];
  visitSubsets(attributes, (lhs) => {
    const rhs = computeClosure(lhs, fds).filter(
      (a) => attributes.includes(a) && !lhs.includes(a),
    );
    if (rhs.length)
      projected.push({
        id: `projection_${projected.length}`,
        lhs,
        rhs,
        confidence: 1,
        isActive: true,
      });
  });
  return projected;
}
