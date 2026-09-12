# Schema Doctor



Schema Doctor is an automated relational database management systems (DBMS) tool designed to diagnose unnormalized database tables, discover functional dependencies, compute candidate primary keys via attribute closure ($X^+$), audit normal form violations (1NF, 2NF, 3NF, BCNF), and decompose relations into user-selectable normal forms (**1NF, 2NF, or 3NF**) with guaranteed lossless joins and dependency preservation.

---

## Key Features

### 1. Table Ingestion & Input Processing
- **CSV & Tabular Data Ingestion**: Supports uploading `.csv` files or pasting raw CSV/JSON tabular data with quote handling and line break normalization.
- **Benchmark Presets**: Includes pre-loaded academic DBMS benchmark relations (University Student Enrollment, E-Commerce Orders, Hospital Appointments, Library Book Rentals).
- **Collapsible Table View**: Clean, formal dark-theme interface with expandable accordions to preview uploaded records cleanly.

### 2. Relational Theory Engine
- **Attribute Closure ($X^+$) Calculator**: Computes attribute set closure under active functional dependencies using Armstrong's Axioms.
- **Candidate Key Derivation**: Derives minimal superkeys and candidate primary keys using size-bounded BFS with superset pruning.
- **Functional Dependency Mining**: Discovers non-trivial functional dependencies ($X \rightarrow Y$) from sample rows.
- **Normal Form Evaluator**: Diagnoses 1NF, 2NF, 3NF, and BCNF compliance with step-by-step mathematical proofs.

### 3. Selectable Normalization Decompositions (1NF, 2NF, 3NF)
- **Interactive Technique Selection**: Users select their target normal form before decomposition:
  - **1NF**: Enforces attribute atomicity and designates primary keys.
  - **2NF**: Identifies and extracts partial functional dependencies into separate sub-relations.
  - **3NF**: Employs **Bernstein's 3NF Synthesis Algorithm** on the Minimal Canonical Cover ($F_c$) to eliminate transitive dependencies while guaranteeing lossless join and dependency preservation.
- **Normalized Table Accordions**: Inspect each generated relation, primary keys, foreign key constraints, and projected tuples.
- **CSV Archive Export**: Generates a `.zip` archive containing separate CSV files for each normalized table.
- **Multi-Dialect SQL Generator**: Generates ANSI SQL DDL (`CREATE TABLE`) and DML (`INSERT INTO`) scripts for PostgreSQL, MySQL, SQLite, and SQL Server.

### 4. Working Explanation & Academic Proofs
- Dedicated reference tab providing formal, textbook-grade step-by-step mathematical explanations, closure traces, and decomposition proofs.

---

## Installation & Local Setup

### Prerequisites
- Node.js (v18.0 or higher)
- npm



## Project Structure

```text
SchemaDoc/
├── src/
│   ├── components/            # UI components (Upload, Table Dropdowns, SQL Export)
│   ├── engine/                # Relational Database Theory Engine
│   │   ├── closure.ts             # Attribute closure X+ & candidate key finder
│   │   ├── fdFinder.ts            # Functional dependency miner
│   │   ├── normalFormChecker.ts    # 1NF, 2NF, 3NF, BCNF diagnostic rules
│   │   ├── decomposer.ts          # Bernstein's 3NF synthesis algorithm
│   │   ├── sqlGenerator.ts        # Multi-dialect SQL script generator
│   │   └── presets.ts             # Benchmark DBMS datasets
│   ├── App.tsx                # Application container
│   ├── index.css              # Styling definitions
│   └── main.tsx               # Entrypoint script
├── Dockerfile                 # Production Docker configuration
├── package.json               # Project dependencies
├── vite.config.ts             # Vite build settings
└── README.md                  # Documentation
```

