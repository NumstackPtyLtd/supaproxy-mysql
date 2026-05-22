# Changelog

## [2.0.0] - 2026-05-22

### Changed
- Use domain enums (`WorkspaceStatus`, `ConversationStatus`, `StatsStatus`) instead of removed `STATUS_*` constants
- `createMysqlInfra()` now returns `conversationQueryRepo` (same instance as `conversationRepo`)
- Peer dependency bumped to `@supaproxy/core >=2.0.0`

### Breaking
- Requires `@supaproxy/core >=2.0.0`

## [1.0.0] - 2026-05-20

### Added
- `createMysqlInfra(pool)` factory returning all 11 repository implementations as a `DatabaseAdapter`
- `runMigrations(pool)` with 30 versioned schema migrations
- `createPool(options)` connection pool factory
- Repository implementations: Organisation, Workspace, Conversation, AuditLog, Model, PromptTemplate, GuardrailEvent, GuardrailPolicy, Integration, EntryPoint, KnowledgeChunk
- Companion row mapper files for all repositories
- CLAUDE.md with architecture rules and contribution guide
- README with "Build your own adapter" guide
