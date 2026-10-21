# Schema Doctor

Schema Doctor is an advanced, 100% client-side relational database management systems (DBMS) tool designed to diagnose unnormalized database tables, discover functional dependencies, compute candidate primary keys via attribute closure ($X^+$), audit normal form violations, and decompose relations into **1NF, 2NF, 3NF, BCNF, 4NF, and 5NF** with guaranteed lossless joins and dependency preservation.

It features a premium, hyper-minimalist cinematic UI designed for developers and database administrators, running entirely in the browser with no backend—ensuring complete data privacy.

---

## Key Features

### 1. Cinematic & Professional UI/UX
- **Scroll Storytelling**: A highly professional, hyper-minimalist black (`#0a0a0a`) and white aesthetic featuring smooth `framer-motion` scroll reveals and transitions.
- **Client-Side Privacy & Security**: No backend, no databases, and no tracking. All parsing, data discovery, and normalization logic is executed entirely in your browser. 
- **Auto-Wipe Inactivity Timer**: For maximum privacy, user data is strictly held in React state and is automatically wiped after 10 minutes of inactivity.

### 2. Table Ingestion & Input Processing
- **CSV & Tabular Data Ingestion**: Supports uploading `.csv` files or pasting raw CSV/JSON tabular data with quote handling and line break normalization. Handles datasets cleanly with virtualized preview rendering.
- **Benchmark Presets**: Includes pre-loaded academic DBMS benchmark relations (University Student Enrollment, E-Commerce Orders, Hospital Appointments, Library Book Rentals).

### 3. Relational Theory Engine
- **Attribute Closure ($X^+$) Calculator**: Computes attribute set closure under active functional dependencies using Armstrong's Axioms.
- **Candidate Key Derivation**: Derives minimal superkeys and candidate primary keys using size-bounded BFS with superset pruning.
- **Functional Dependency Mining**: Automatically discovers non-trivial functional dependencies ($X \rightarrow Y$) from sample rows.

### 4. Advanced Normalization Techniques (Up to 5NF)
- **Interactive Technique Selection**: Users select their target normal form before decomposition:
  - **1NF**: Enforces attribute atomicity and designates primary keys.
  - **2NF**: Identifies and extracts partial functional dependencies into separate sub-relations.
  - **3NF**: Employs **Bernstein's 3NF Synthesis Algorithm** on the Minimal Canonical Cover ($F_c$) to eliminate transitive dependencies while guaranteeing lossless join and dependency preservation.
  - **BCNF**: Decomposes based on Boyce-Codd violations.
  - **4NF & MVDs**: Features a manual Multivalued Dependency (MVD) editor to construct $X \twoheadrightarrow Y$ relationships and accurately decompose tables into 4NF.
  - **5NF**: Handles complex Join Dependencies (JDs).
- **CSV Archive Export**: Generates a `.zip` archive containing separate CSV files for each normalized table.
- **Multi-Dialect SQL Generator**: Generates ANSI SQL DDL (`CREATE TABLE`) and DML (`INSERT INTO`) scripts for PostgreSQL, MySQL, SQLite, and SQL Server.

### 5. Working Explanation & Academic Proofs
- Dedicated reference tab providing formal, textbook-grade step-by-step mathematical explanations, closure traces, and decomposition proofs.

---

## Local Setup & Deployment

Schema Doctor is a static Single Page Application built with React, Vite, and TypeScript. 

### Prerequisites
- Node.js (v18.0 or higher)
- npm

### Installation
```bash
git clone https://github.com/Vatsal0729/SchemaDoc.git
cd SchemaDoc
npm install
npm run dev
```

### Deployment (Vercel / Netlify)
The project includes a `vercel.json` and a `public/_redirects` file, pre-configured for SPA routing. You can simply import this repository into Vercel or Netlify and it will deploy out of the box with zero configuration needed.

---

## Project Structure

```text
SchemaDoc/
├── public/                # Static assets (including _redirects)
├── src/
│   ├── components/        # UI components (Navbar, MVDEditor)
│   ├── engine/            # Relational Database Theory Engine
│   │   ├── closure.ts             # Attribute closure X+ & candidate key finder
│   │   ├── fdFinder.ts            # Functional dependency miner
│   │   ├── normalFormChecker.ts   # Normal form diagnostic rules
│   │   ├── decomposer.ts          # Normal form decomposition algorithms
│   │   ├── sqlGenerator.ts        # Multi-dialect SQL script generator
│   │   └── presets.ts             # Benchmark DBMS datasets
│   ├── hooks/             # Custom React hooks (e.g., useInactivityTimer)
│   ├── pages/             # Page Routes (LandingPage.tsx, ToolPage.tsx)
│   ├── App.tsx            # Main Application Router Shell
│   ├── index.css          # Styling definitions & global Tailwind CSS
│   └── main.tsx           # Entrypoint script
├── vercel.json            # Vercel SPA routing configuration
├── package.json           # Project dependencies
└── vite.config.ts         # Vite build settings
```
