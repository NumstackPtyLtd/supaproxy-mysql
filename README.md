# @supaproxy/mysql

MySQL database adapter for [SupaProxy](https://github.com/NumstackPtyLtd/supaproxy-core). Implements the `DatabaseAdapter` interface with MySQL-backed repositories, schema migrations, and a connection pool factory.

This is the **default** adapter. For other databases, see [Building a custom adapter](#building-a-custom-adapter) below.

## Installation

```bash
pnpm add @supaproxy/mysql
```

## Usage

```typescript
import { createMysqlInfra, runMigrations, createPool } from '@supaproxy/mysql'

const pool = createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'secret',
  database: 'supaproxy',
})

await runMigrations(pool)

const infra = createMysqlInfra(pool)
// infra.orgRepo, infra.workspaceRepo, infra.conversationRepo, ...

const container = createContainer(infra, { pool, ...options })
```

## What this package contains

| Directory | Contents |
|---|---|
| `src/repositories/` | 11 repository implementations + 3 row mapper files |
| `src/migrations.ts` | 30 versioned schema migrations |
| `src/pool.ts` | Connection pool factory |
| `src/index.ts` | `createMysqlInfra()` factory + re-exports |

### Repositories

| Repository | Implements | Domain |
|---|---|---|
| `MysqlOrganisationRepository` | `OrganisationRepository` | Orgs, users, teams, settings |
| `MysqlWorkspaceRepository` | `WorkspaceRepository` | Workspaces, connections, tools, consumers |
| `MysqlConversationRepository` | `ConversationRepository` | Conversations, messages, stats, dashboard |
| `MysqlAuditLogRepository` | `AuditLogRepository` | Query audit trail |
| `MysqlModelRepository` | `ModelRepository` | AI model listing |
| `MysqlPromptTemplateRepository` | `PromptTemplateRepository` | Prompt versioning |
| `MysqlGuardrailEventRepository` | `GuardrailEventRepository` | Guardrail event logging |
| `MysqlGuardrailPolicyRepository` | `GuardrailPolicyRepository` | Policy enforcement |
| `MysqlIntegrationRepository` | `IntegrationRepository` | Consumer integrations |
| `MysqlEntryPointRepository` | `EntryPointRepository` | Channel routing |
| `MysqlKnowledgeChunkRepository` | `KnowledgeChunkRepository` | RAG chunk storage |

---

## Building a custom adapter

Use this package as a reference to build `@supaproxy/postgres`, `@supaproxy/sqlite`, or any other database adapter.

### 1. Scaffold your package

```bash
mkdir supaproxy-postgres && cd supaproxy-postgres
pnpm init
pnpm add -D @supaproxy/core typescript
```

Your `package.json` should peer-depend on `@supaproxy/core`:

```json
{
  "peerDependencies": {
    "@supaproxy/core": ">=1.0.0"
  }
}
```

### 2. Import the contract

```typescript
import type { DatabaseAdapter } from '@supaproxy/core/ports/database'
```

This interface defines exactly 11 repository fields. TypeScript will error if you miss any.

### 3. Import the domain interfaces

Each repository has a corresponding interface in core:

```typescript
import type { OrganisationRepository } from '@supaproxy/core/domain/organisation'
import type { WorkspaceRepository } from '@supaproxy/core/domain/workspace'
import type { ConversationRepository } from '@supaproxy/core/domain/conversation'
import type { AuditLogRepository } from '@supaproxy/core/domain/audit'
import type { GuardrailEventRepository } from '@supaproxy/core/domain/guardrail'
import type { GuardrailPolicyRepository } from '@supaproxy/core/domain/guardrail-policy'
import type { IntegrationRepository, EntryPointRepository } from '@supaproxy/core/domain/integration'
import type { KnowledgeChunkRepository } from '@supaproxy/core/domain/knowledge'
import type { PromptTemplateRepository } from '@supaproxy/core/domain/prompt'
import type { ModelRepository } from '@supaproxy/core/ports/model'
```

Some repositories also use constants from `@supaproxy/core/defaults` (e.g. `STATUS_ACTIVE`, `DEFAULT_PAGINATION_LIMIT`).

### 4. Implement each repository

For each interface, create a class that implements it. The interface defines the method signatures and return types. Your job is the SQL.

Example pattern for a PostgreSQL adapter:

```typescript
import type { Pool } from 'pg'
import type { OrganisationRepository, OrgData } from '@supaproxy/core/domain/organisation'

export class PgOrganisationRepository implements OrganisationRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<OrgData | null> {
    const { rows } = await this.pool.query(
      'SELECT id, name, slug, created_at FROM organisations WHERE id = $1', [id]
    )
    return rows[0] || null
  }

  // ... implement every method from OrganisationRepository
}
```

### 5. Export a factory function

```typescript
export function createPostgresInfra(pool: Pool): DatabaseAdapter {
  return {
    orgRepo: new PgOrganisationRepository(pool),
    workspaceRepo: new PgWorkspaceRepository(pool),
    conversationRepo: new PgConversationRepository(pool),
    auditRepo: new PgAuditLogRepository(pool),
    modelRepo: new PgModelRepository(pool),
    promptTemplateRepo: new PgPromptTemplateRepository(pool),
    guardrailEventRepo: new PgGuardrailEventRepository(pool),
    guardrailPolicyRepo: new PgGuardrailPolicyRepository(pool),
    integrationRepo: new PgIntegrationRepository(pool),
    entryPointRepo: new PgEntryPointRepository(pool),
    knowledgeChunkRepo: new PgKnowledgeChunkRepository(pool),
  }
}
```

The `: DatabaseAdapter` return type ensures TypeScript catches any missing or mistyped repos at compile time.

### 6. Write migrations

Export a `runMigrations(pool)` function that creates all required tables. See `src/migrations.ts` in this package for the full schema. The table structures and column names must match what the repository implementations expect.

### 7. Wire into SupaProxy

```typescript
import { createPostgresInfra, runMigrations } from '@supaproxy/postgres'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
await runMigrations(pool)
const infra = createPostgresInfra(pool)
const container = createContainer(infra, { pool, ...options })
```

### Tips

- Start with `MysqlAuditLogRepository` (smallest, single method) to get the pattern right.
- Copy the test suite from this package and adapt the SQL assertions.
- The row mapper pattern (separate files for complex repos) keeps repositories focused on SQL, not data transformation.
- Use `@supaproxy/core/defaults` for status constants so your queries match the domain model.
