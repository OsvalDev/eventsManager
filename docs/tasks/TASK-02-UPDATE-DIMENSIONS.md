---
id: "TASK-02"
title: "Product Dimensions & Sizing Synchronization"
type: "task"
status: "standby"
schedule: "0 6 * * 1-5" # Monday to Friday at 6:00 AM
code_files:
  - "src/tasks/updateDimensions/index.ts"
  - "src/tasks/updateDimensions/cli.ts"
  - "src/tasks/updateDimensions/types.ts"
upstream:
  - "docs/arch/ARCH-01-SCHEDULER.md"
  - "docs/arch/ARCH-02-DATABASE.md"
  - "docs/arch/ARCH-03-LOGGING.md"
downstream:
  - "endpoint:STYLES_API_BASE_URL/style/sizes"
  - "endpoint:STYLES_API_BASE_URL/style/colors"
---

# TASK-02: Product Dimensions & Sizing Synchronization

## 1. Overview & Business Context
The `updateDimensions` task parses product identification strings from Dynamics AX (`ECORESPRODUCT`) to extract master dimension attributes (valid style sizes, cups, and color combinations). This populates dropdown filters and catalog matrices in customer-facing interfaces.

---

## 2. Scheduling & Execution
- **Cron Schedule**: `0 6 * * 1-5` (Mon–Fri at 6:00 AM)
- **Status**: Standby (disabled in [src/scheduler/schedules.ts](file:///home/osvaldev/Documents/carnival/job-runner/src/scheduler/schedules.ts))
- **On-Demand CLI**: `npm run task:dimensions`
- **Direct Entrypoint**: `tsx src/tasks/updateDimensions/cli.ts`

---

## 3. Extraction & Transformation Pipeline

```mermaid
flowchart TD
    DB[("MSSQL: ECORESPRODUCT<br/>WHERE DISPLAYPRODUCTNUMBER LIKE '%ALTA%'")] --> Extract["Extract DISPLAYPRODUCTNUMBER"]
    Extract --> Parse["Tokenize by ' : '<br/>[style, cup, size, color, suffix]"]
    
    Parse --> DeduplicateSizes["Deduplicate Sizes<br/>Key: style | size | cup"]
    Parse --> DeduplicateColors["Deduplicate Colors<br/>Key: style | color<br/>(Pad numeric colors to 3 digits)"]
    
    subgraph Parallel_Push ["Concurrent POST (Promise.all)"]
        DeduplicateSizes ==>|POST { sizes }| API_SIZES["POST /style/sizes"]
        DeduplicateColors ==>|POST { colors }| API_COLORS["POST /style/colors"]
    end

    API_SIZES --> Log["Append audit report to logs/updateDimensions.log"]
    API_COLORS --> Log
```

---

## 4. Extract Contract (Source Database)

- **Target Database**: `CTRLINVENT`
- **Source Table**: `ECORESPRODUCT`
- **SQL Query**:
  ```sql
  SELECT DISPLAYPRODUCTNUMBER
  FROM ECORESPRODUCT
  WHERE DISPLAYPRODUCTNUMBER LIKE '%ALTA%'
    AND DISPLAYPRODUCTNUMBER NOT LIKE '%# : #%'
    AND DISPLAYPRODUCTNUMBER NOT LIKE '[qQwWzZ]%';
  ```

---

## 5. Transform Invariants & Normalization

Expected source format: `"20038 : C : 32 : 226 : ALTA"`

1. **Tokenization**:
   String is split on ` : ` into:
   - Index 0: `style` (e.g. `'20038'`)
   - Index 1: `cup` (e.g. `'C'`)
   - Index 2: `size` (e.g. `'32'`)
   - Index 3: `color` (e.g. `'226'`)
2. **Numeric Color Padding**:
   If `color` consists exclusively of digits, it is zero-padded to 3 digits using `/^\d+$/.test(color) ? color.padStart(3, '0') : color` (e.g. `'7'` -> `'007'`).
3. **Unique Deduplication**:
   - Distinct sizes are keyed by `${style}|${size}|${cup}`.
   - Distinct colors are keyed by `${style}|${color}`.

---

## 6. Load Contract (Target API)

Two HTTP requests are executed concurrently via `Promise.all`:

### 1. Style Sizes Endpoint
- **URL**: `POST ${ENV.API.STYLES_BASE_URL}/style/sizes`
- **Payload Schema**:
  ```json
  {
    "sizes": [
      {
        "style": "20038",
        "size": "32",
        "cup": "C"
      }
    ]
  }
  ```

### 2. Style Colors Endpoint
- **URL**: `POST ${ENV.API.STYLES_BASE_URL}/style/colors`
- **Payload Schema**:
  ```json
  {
    "colors": [
      {
        "style": "20038",
        "color": "226"
      }
    ]
  }
  ```

---

## 7. Invariants & Error Handling
- The MSSQL connection pool is safely closed in a `finally` block.
- Both endpoints must return HTTP 200 to register a complete success.
- Total processing time and count of items pushed are recorded in `logs/updateDimensions.log`.
