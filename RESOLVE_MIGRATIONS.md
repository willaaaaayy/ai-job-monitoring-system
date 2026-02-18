# Разрешение Failed Migrations

## Текущая ситуация

В вашей системе есть разные failed migrations в разных базах данных:

### Локальная база данных (localhost:5433)
- **Failed migration:** `20260217185655_add_multi_tenant_support`

### Production база данных (Railway)
- **Failed migration:** `20240218000000_add_unique_constraint_and_update_status`

## Решение для локальной базы данных

Выполните в терминале:

```bash
# Разрешить failed migration как rolled back
npx prisma migrate resolve --rolled-back 20260217185655_add_multi_tenant_support

# Или если миграция была частично применена, разрешить как applied
npx prisma migrate resolve --applied 20260217185655_add_multi_tenant_support

# Проверить статус
npx prisma migrate status

# Применить миграции
npx prisma migrate deploy
```

## Решение для Production базы данных (Railway)

### Вариант 1: Через Railway Shell

1. Откройте Railway Dashboard → ваш проект → Deployments → последний деплоймент → **Shell**
2. **Важно:** Убедитесь, что вы находитесь в рабочей директории приложения (`/app`)
3. Выполните команды:

```bash
# Перейти в рабочую директорию (если не там)
cd /app

# Разрешить failed migration
npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status

# Проверить статус
npx prisma migrate status

# Применить миграции
npx prisma migrate deploy
```

**Если команда не находит schema файл**, используйте явный путь:

```bash
npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status --schema=/app/prisma/schema.prisma
npx prisma migrate status --schema=/app/prisma/schema.prisma
npx prisma migrate deploy --schema=/app/prisma/schema.prisma
```

### Вариант 2: Через Railway CLI

Если у вас установлен Railway CLI:

```bash
railway run npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status
railway run npx prisma migrate deploy
```

## Автоматическое разрешение

Entrypoint скрипт (`docker-entrypoint.sh`) теперь автоматически пытается разрешить failed migrations при запуске контейнера. Если это не сработает автоматически, используйте один из вариантов выше.

## Проверка после исправления

После разрешения failed migrations проверьте статус:

```bash
# Локально
npx prisma migrate status

# В Railway Shell
npx prisma migrate status
```

Должно показать, что все миграции применены успешно.
