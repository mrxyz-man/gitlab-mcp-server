# Architecture Overview

Текущий стиль: Clean Architecture / Ports & Adapters.

Основные слои:
- `domain/` — контракты и модели без инфраструктурных зависимостей.
- `application/` — use-cases и orchestration бизнес-операций.
- `infrastructure/` — HTTP/OAuth/token-store/runtime-lock и GitLab API адаптеры.
- `interface/` — MCP tool handlers и transport-уровень.
- `shared/` — конфиг, ошибки, утилиты.

Ключевые инварианты:
- домен не зависит от MCP/HTTP/GitLab SDK;
- внешние вызовы проходят через адаптеры;
- контракты tool-ов стабильны и явно версионируемы.

Ссылки:
- `.ai/architecture/module-structure.md`
- `.ai/architecture/auth-strategy.md`
- `.ai/architecture/issue-tools-v0.md`
