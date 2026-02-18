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

### ⭐ Рекомендуемый способ: Через Railway Shell (веб-интерфейс)

Railway CLI не всегда работает корректно с путями. Используйте Railway Shell через веб-интерфейс:

1. Откройте [Railway Dashboard](https://railway.app)
2. Выберите ваш проект
3. Перейдите в **Deployments** → выберите последний деплоймент
4. Нажмите на вкладку **Shell** (или кнопку "Open Shell")
5. В открывшемся терминале выполните:

```bash
# Проверить текущую директорию
pwd

# Проверить наличие файлов
ls -la

# Если вы не в /app, перейти туда (или используйте путь, который показал pwd)
cd /app

# Разрешить failed migration
npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status

# Проверить статус
npx prisma migrate status

# Применить миграции
npx prisma migrate deploy
```

**Если команда не находит schema файл**, проверьте путь:

```bash
# Найти schema файл
find . -name "schema.prisma"

# Использовать найденный путь
npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status --schema=/путь/к/schema.prisma
```

### Альтернатива: Railway CLI (может не работать)

Railway CLI запускает команды не в контексте контейнера. Если все же хотите попробовать:

```bash
# Сначала найдите рабочую директорию через Shell
railway shell
# Затем выполните команды внутри shell
```

**Или попробуйте с переменной окружения:**

```bash
railway run bash -c "cd \$(pwd) && npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status"
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
