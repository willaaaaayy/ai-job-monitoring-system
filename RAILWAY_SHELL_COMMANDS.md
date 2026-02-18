# Команды для Railway Shell

## ⚠️ Важно: Используйте Railway Shell через веб-интерфейс

Railway CLI (`railway run`) не всегда работает корректно с путями. **Рекомендуется использовать Railway Shell через веб-интерфейс.**

## Как открыть Railway Shell

1. Откройте [Railway Dashboard](https://railway.app)
2. Выберите ваш проект
3. Перейдите в **Deployments** → выберите последний деплоймент
4. Нажмите на вкладку **Shell** (или кнопку "Open Shell")

## Команды для выполнения в Railway Shell

### 1. Проверка текущей директории и файлов

```bash
# Проверить где вы находитесь
pwd

# Посмотреть файлы в текущей директории
ls -la

# Найти schema файл
find . -name "schema.prisma"

# Перейти в рабочую директорию (обычно /app)
cd /app
```

### 2. Проверка статуса миграций

```bash
cd /app
npx prisma migrate status
```

### 3. Разрешение failed migration

```bash
cd /app

# Разрешить failed migration как rolled back
npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status

# Проверить статус
npx prisma migrate status

# Применить миграции
npx prisma migrate deploy
```

### 4. Если не находит schema файл

```bash
# Найти schema файл
find . -name "schema.prisma"

# Использовать найденный путь
npx prisma migrate resolve --rolled-back 20240218000000_add_unique_constraint_and_update_status --schema=/путь/к/prisma/schema.prisma
```

### 5. Проверка подключения к базе данных

```bash
cd /app

# Проверить переменные окружения
echo $DATABASE_URL

# Проверить подключение через Prisma
npx prisma db execute --stdin <<< "SELECT 1"
```

## Альтернатива: Railway CLI (может не работать)

Если все же хотите попробовать Railway CLI:

```bash
# Вариант 1: С переходом в директорию
railway run sh -c "cd /app && npx prisma migrate status"

# Вариант 2: С явным путем к schema
railway run npx prisma migrate status --schema=./prisma/schema.prisma

# Вариант 3: Через bash с переменными окружения
railway run bash -c "cd \$(pwd) && npx prisma migrate status"
```

**Но лучше использовать Railway Shell через веб-интерфейс - это гарантированно работает!**
