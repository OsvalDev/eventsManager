---
trigger: always_on
---

# SQL Safety & Database Governance Directives

This rule establishes non-negotiable safety directives for all AI coding assistants and human software engineers interacting with database connections, SQL queries, or data transformations in **Carnival Job Runner**.

---

## 1. Strict Read-Only Paradigm (ETL Extractor Only)

> **CRITICAL INVARIANT**: `carnival-job-runner` is an **extraction worker only**.

- **NEVER** write, generate, or execute mutating SQL statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`, `MERGE`, or `EXEC` on write stored procedures) against enterprise databases (`CTRLINVENT`, Dynamics AX, `SeguimientoPedidos`, etc.).
- All data persistence must take place via **HTTP REST APIs**, never by directly modifying SQL Server tables.

---

## 2. Forbidden `SELECT *` (Explicit Column Projection)

- **NEVER** use wildcard selection (`SELECT *`) in production tasks.
- Every query must explicitly enumerate the required columns:
  ```sql
  -- FORBIDDEN:
  SELECT * FROM CCVW_INVENMAYV3

  -- REQUIRED:
  SELECT [ESTILO], [DESCRIPCION], [COLOR], [TALLA], [COPA], [CALIDAD], [DISPONIBLE], [RESERVA]
  FROM CCVW_INVENMAYV3
  ```
- **Rationale**: Wildcard selection causes excessive memory buffer allocation, unindexed table scans, and network saturation when handling views with hundreds of columns.

---

## 3. Parameter Chunking Limit (1,000 IDs Maximum)

- Microsoft SQL Server imposes a hard ceiling of **2,100 parameters** per query execution.
- When generating dynamic queries with `IN (@id0, @id1, ...)`, you **MUST** chunk arrays to a maximum of 1,000 parameters:
  ```typescript
  const PARAMETER_CHUNK_SIZE = 1000;
  const batches = chunkArray(ids, PARAMETER_CHUNK_SIZE);
  ```
- **NEVER** concatenate unparameterized string literals into dynamic SQL. Always bind parameters using `request.input('paramName', value)`.

---

## 4. Connection Pool Disposal Invariant

- Connection pools must **NEVER** be left unmanaged or open indefinitely.
- Every call to `createConnectionPool()` **MUST** be paired with a `finally` block:
  ```typescript
  let pool: mssql.ConnectionPool | undefined;
  try {
    pool = await createConnectionPool('CTRLINVENT');
    // Execute query...
  } finally {
    if (pool) {
      await pool.close();
    }
  }
  ```

---

## 5. Execution Timeout Discipline

- All connection configurations in `src/config/database.ts` must maintain:
  - `connectionTimeout`: 30,000 ms (30s)
  - `requestTimeout`: 120,000 ms (120s)
- Never set timeout values to `0` (infinite). If an ERP query takes longer than 90 seconds, the query must fail, log the timeout, and alert operators rather than holding open shared table locks.
