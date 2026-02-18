# Инструкция по применению миграции Prisma

## Миграция: add_unique_constraint_and_update_status

Эта миграция добавляет unique constraint на `(tenantId, url)` в таблице `Job` для предотвращения дубликатов.

### Шаги применения:

1. **Проверьте текущее состояние миграций:**
   ```bash
   npx prisma migrate status
   ```

2. **Если миграция не применена, выполните одно из:**

   **Вариант A: Автоматическое применение (рекомендуется)**
   ```bash
   npx prisma migrate deploy
   ```

   **Вариант B: Ручное применение SQL**
   ```bash
   # Подключитесь к вашей БД и выполните SQL из файла:
   # prisma/migrations/20240218000000_add_unique_constraint_and_update_status/migration.sql
   ```

3. **Проверьте результат:**
   ```bash
   npx prisma migrate status
   ```

### Важно:

- Миграция сначала удаляет существующие дубликаты (оставляет первый по id)
- Затем добавляет unique constraint
- Убедитесь, что у вас есть backup БД перед применением

### Если миграция уже применена:

Если constraint уже существует в БД, но Prisma не видит миграцию как примененную:

```bash
npx prisma migrate resolve --applied 20240218000000_add_unique_constraint_and_update_status
```
