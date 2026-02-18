# Исправление Failed Migration в Production

## Проблема

Миграция `20240218000000_add_unique_constraint_and_update_status` была запущена и завершилась с ошибкой. Prisma не может применить новые миграции, пока failed migration не будет разрешена.

## Решение

### Вариант 1: Автоматическое разрешение (через Railway Shell)

1. Откройте Railway Dashboard → ваш проект → вкладка **Deployments**
2. Найдите последний деплоймент и откройте его
3. Перейдите во вкладку **Shell**
4. Выполните команду:

```bash
npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status
```

5. Затем выполните:

```bash
npx prisma migrate deploy
```

### Вариант 2: Ручное разрешение через SQL

Если автоматическое разрешение не работает, выполните SQL вручную:

1. Подключитесь к вашей PostgreSQL базе данных в Railway
2. Проверьте, существует ли constraint:

```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'Job' 
AND constraint_name = 'Job_tenantId_url_key';
```

3. Если constraint **НЕ существует**, выполните SQL из миграции:

```sql
-- Удалить дубликаты
DO $$
DECLARE
    duplicate_record RECORD;
BEGIN
    FOR duplicate_record IN
        SELECT "tenantId", url, MIN(id) as keep_id, array_agg(id) as all_ids
        FROM "Job"
        GROUP BY "tenantId", url
        HAVING COUNT(*) > 1
    LOOP
        DELETE FROM "Job"
        WHERE "tenantId" = duplicate_record."tenantId"
          AND "url" = duplicate_record.url
          AND "id" != duplicate_record.keep_id;
    END LOOP;
END $$;

-- Добавить unique constraint
ALTER TABLE "Job" ADD CONSTRAINT "Job_tenantId_url_key" UNIQUE ("tenantId", "url");
```

4. После выполнения SQL, пометьте миграцию как примененную:

```bash
npx prisma migrate resolve --applied 20240218000000_add_unique_constraint_and_update_status
```

5. Затем выполните:

```bash
npx prisma migrate deploy
```

### Вариант 3: Если constraint уже существует

Если constraint уже существует в базе данных, но миграция помечена как failed:

```bash
npx prisma migrate resolve --applied 20240218000000_add_unique_constraint_and_update_status
npx prisma migrate deploy
```

## Проверка после исправления

После разрешения failed migration проверьте статус:

```bash
npx prisma migrate status
```

Должно показать, что все миграции применены успешно.

## Автоматическое исправление

Entrypoint скрипт (`docker-entrypoint.sh`) теперь автоматически пытается разрешить failed migrations при запуске контейнера. Если это не сработает, используйте один из вариантов выше.
