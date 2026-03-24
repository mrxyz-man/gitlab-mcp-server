# Coding Style

Источник истины: `.ai/agent/rules/common-rules.md`, `.ai/agent/rules/developer-rules.md`, `.ai/agent/anti-patterns-blacklist.md`.

Обязательные принципы:
- small focused changes;
- explicit contracts и типизация;
- без смешивания domain logic и transport/infrastructure;
- без скрытого подавления ошибок;
- без секретов в коде/логах/тестах.

Практика:
- TypeScript strict;
- функции с одной ответственностью;
- clear naming;
- комментарии только для `why`.

Commit-policy:
- следовать `.ai/agent/commit-rule.md` (Conventional Commits).
