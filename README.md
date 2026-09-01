# Schema Doctor (SchemaDoc)

> Automated Relational Database Normalization and Functional Dependency Analysis Engine

Schema Doctor is a web-based database management systems (DBMS) tool designed to diagnose unnormalized database tables, infer functional dependencies, compute candidate primary keys via attribute closure (X+), detect normal form violations (1NF, 2NF, 3NF, BCNF), and decompose relations into 3NF schema definitions without data loss.

---

## Key Features

### 1. Table File Upload & Input Processing
- **CSV & Tabular Data Ingestion**: Supports uploading `.csv` table files or pasting raw CSV and JSON tuple data.
- **Benchmark Datasets**: Includes pre-loaded academic DBMS dataset relations (University Student Enrollment, E-Commerce Orders, Hospital Appointments, Library Book Rentals).
- **Collapsible Table View**: Displays input data tables inside collapsible dropdown accordions optimized for large datasets.

### 2. Relational Database Theory Engine
- **Attribute Closure (X+) Calculator**: Computes attribute set closure under active functional dependencies.
- **Candidate Primary Key Derivation**: Derives all minimal superkeys and candidate primary keys.
- **Functional Dependency Mining**: Automatically discovers non-trivial functional dependencies (X -> Y) from tuple instances.
- **Normal Form Evaluator**: Evaluates 1NF, 2NF, 3NF, and BCNF compliance with single-line violation summaries.

### 3. Lossless 3NF Decomposition & Export
- **3NF Synthesis Algorithm**: Applies Bernstein's 3NF Synthesis algorithm to compute minimal cover, form target sub-relations, and map foreign key references.
- **Normalized Table Accordions**: Displays each decomposed relation, primary key definitions, and projected data tuples in collapsible dropdowns.
- **CSV Archive Export**: Generates downloadable ZIP archives containing separate CSV files for each normalized table.
- **Multi-Dialect SQL Script Generator**: Generates ANSI SQL `CREATE TABLE` DDL and `INSERT INTO` DML scripts for PostgreSQL, MySQL, SQLite, and MS SQL Server.

### 4. Working Explanation & Academic Proofs
- Dedicated tab providing formal step-by-step academic explanations of candidate key closures, detected redundancies, and decomposition logic.

---

## Installation & Local Setup

### Prerequisites
- Node.js (v18.0 or higher)
- npm

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/aanyapathak/SchemaDoc.git
   cd SchemaDoc
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the application in your browser:
   ```text
   http://localhost:5173/
   ```

---

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

---

## Docker Deployment

Build and containerize the production web application using Docker:

```bash
# Build Docker image
docker build -t schemadoc .

# Run container on port 8080
docker run -d -p 8080:80 schemadoc
```

---

## License

This project is released under the [MIT License](LICENSE).

Developed by [Aanya Pathak](https://github.com/aanyapathak) for Database Management Systems coursework.
