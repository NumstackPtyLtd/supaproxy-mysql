# @supaproxy/mysql

Central governance hub: [supaproxy](https://github.com/NumstackPtyLtd/supaproxy)

MySQL database adapter for SupaProxy. Implements the `DatabaseAdapter` interface from `@supaproxy/core`.

## Structure

```
src/
  index.ts                  Public exports, createMysqlInfra() factory
  pool.ts                   Connection pool factory
  migrations.ts             30 versioned schema migrations
  repositories/
    MysqlOrganisationRepository.ts
    MysqlWorkspaceRepository.ts
    MysqlConversationRepository.ts
    MysqlAuditLogRepository.ts
    MysqlModelRepository.ts
    MysqlPromptTemplateRepository.ts
    MysqlGuardrailEventRepository.ts
    MysqlGuardrailPolicyRepository.ts
    MysqlIntegrationRepository.ts
    MysqlEntryPointRepository.ts
    MysqlKnowledgeChunkRepository.ts
    WorkspaceRowMappers.ts          Row types + mapper functions
    ConversationRowMappers.ts       Row types + mapper functions
    GuardrailPolicyRowMappers.ts    Row types + mapper functions
```

## Architecture

This package is a **reference implementation** of the `DatabaseAdapter` interface. Community adapter packages (`@supaproxy/postgres`, `@supaproxy/sqlite`, etc.) should follow the same structure.

### Pattern: Repository + Row Mapper

Each repository file follows this pattern:

1. Import the domain interface from `@supaproxy/core`
2. Import constants from `@supaproxy/core/defaults` (if needed)
3. Define MySQL row types (extending `RowDataPacket`)
4. Implement the interface with MySQL queries
5. Map rows to domain types

For complex repositories (Workspace, Conversation, GuardrailPolicy), row types and mapper functions live in separate `*RowMappers.ts` files.

### Import map

| What you need | Import from |
|---|---|
| Domain repository interfaces | `@supaproxy/core/domain/{domain}` |
| Application port interfaces | `@supaproxy/core/ports/{port}` |
| DatabaseAdapter contract | `@supaproxy/core/ports/database` |
| Status constants, limits | `@supaproxy/core/defaults` |

## Rules

- All changes go through PRs. Never push directly to main.
- Every repository must implement its interface completely. TypeScript enforces this.
- Row types are internal to this package. They never leak into the public API.
- Mapper files are co-located with their repository in `repositories/`.
- Migrations are append-only. Never modify an existing migration.
- The `createMysqlInfra()` return type is `DatabaseAdapter` (from core), not a package-specific type.

## Adding a new repository

When core adds a new repository interface:

1. Add the repository to the `DatabaseAdapter` interface in core
2. Create `Mysql{Name}Repository.ts` implementing the interface
3. Add it to `createMysqlInfra()` in `index.ts`
4. Add required migrations
5. Re-export from `index.ts`

## Dev

```bash
pnpm install
pnpm lint     # Type-check
pnpm build    # Compile to dist/
pnpm test     # Run tests
```
