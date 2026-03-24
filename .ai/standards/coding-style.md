# Coding Style

Источник истины: `.ai/system/policy/rules/common-rules.md`, `.ai/system/policy/rules/developer-rules.md`, `.ai/system/policy/anti-patterns-blacklist.md`.

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
- следовать `.ai/system/policy/commit-rule.md` (Conventional Commits).
