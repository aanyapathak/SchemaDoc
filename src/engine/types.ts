export type NormalForm = 'UNNORMALIZED' | '1NF' | '2NF' | '3NF' | 'BCNF';

export interface Column {
  name: string;
  type: string; // e.g. 'VARCHAR', 'INT', 'DECIMAL', 'DATE'
  isAtomic?: boolean;
}

export type TableRow = Record<string, any>;

export interface FunctionalDependency {
  id: string;
  lhs: string[]; // Determinant attributes X
  rhs: string[]; // Dependent attributes Y
  confidence: number; // 0 to 1 (1 = 100% holds in sample)
  isUserDefined?: boolean;
  violationsCount?: number;
  isActive?: boolean;
}

export interface CandidateKey {
  attributes: string[];
  isPrimary?: boolean;
}

export interface NFViolation {
  level: '1NF' | '2NF' | '3NF' | 'BCNF';
  fd?: FunctionalDependency;
  failingKey?: string[];
  affectedAttributes: string[];
  reason: string;
  mathProof: string[]; // Step-by-step Unit 2 textbook proof steps
  recommendation: string;
}

export interface NormalizationAnalysis {
  maxNormalForm: NormalForm;
  is1NF: boolean;
  is2NF: boolean;
  is3NF: boolean;
  isBCNF: boolean;
  candidateKeys: CandidateKey[];
  primeAttributes: string[];
  nonPrimeAttributes: string[];
  violations: NFViolation[];
  explanations: string[];
}

export interface DecomposedTable {
  id: string;
  name: string;
  attributes: string[];
  primaryKey: string[];
  foreignKeys: {
    column: string[];
    referencedTable: string;
    referencedColumn: string[];
  }[];
  reason: string;
  data: TableRow[];
}

export interface BenchmarkPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  columns: Column[];
  fds: Omit<FunctionalDependency, 'id'>[];
  sampleData: TableRow[];
  expectedNormalForm: NormalForm;
}

export type SQLDialect = 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
