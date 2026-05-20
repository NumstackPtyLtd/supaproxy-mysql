# Changelog

## [1.0.0] - 2026-05-20

### Added
- `createMysqlInfra(pool)` factory returning all 11 repository implementations as a `DatabaseAdapter`
- `runMigrations(pool)` with 30 versioned schema migrations
- `createPool(options)` connection pool factory
- Repository implementations: Organisation, Workspace, Conversation, AuditLog, Model, PromptTemplate, GuardrailEvent, GuardrailPolicy, Integration, EntryPoint, KnowledgeChunk
- Companion row mapper files for all repositories
- CLAUDE.md with architecture rules and contribution guide
- README with "Build your own adapter" guide
