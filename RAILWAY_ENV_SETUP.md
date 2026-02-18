# Railway Environment Variables Setup

## Обязательные переменные окружения

Добавьте следующие переменные в Railway Dashboard → Variables → "+ New Variable":

### 1. DATABASE_URL
```
postgresql://postgres:idZzlYRxECNDcxhbEamsvGsyyIDNpPki@maglev.proxy.rlwy.net:11277/railway
```

### 2. REDIS_URL
```
redis://default:AiaCUvybpHjJJNdYGqvZTIPzLMKJeEUL@maglev.proxy.rlwy.net:49933
```

### 3. JWT_SECRET
```
a7f3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```
*(Сгенерированный безопасный секрет - минимум 32 символа)*

### 4. N8N_WEBHOOK_URL
```
https://williiiiiss.app.n8n.cloud/webhook/job-scoring
```

### 5. NODE_ENV
```
production
```

## Опциональные переменные (можно добавить позже)

### JWT_EXPIRES_IN
```
24h
```

### RATE_LIMIT_WINDOW_MS
```
900000
```

### RATE_LIMIT_MAX
```
100
```

### QUEUE_CONCURRENCY
```
5
```

### CORS_ORIGIN
```
https://your-frontend-domain.vercel.app
```
*(Замените на ваш реальный frontend URL)*

### FRONTEND_URL
```
https://your-frontend-domain.vercel.app
```
*(Замените на ваш реальный frontend URL)*

## Инструкция по добавлению

1. Откройте Railway Dashboard
2. Выберите ваш проект `ai-job-monitoring-system`
3. Перейдите на вкладку **Variables**
4. Нажмите **"+ New Variable"** для каждой переменной выше
5. Введите имя переменной и значение
6. После добавления всех переменных Railway автоматически перезапустит контейнер

## После добавления переменных

После успешного деплоя выполните миграции базы данных:

1. В Railway Dashboard откройте ваш сервис
2. Перейдите на вкладку **Deployments**
3. Откройте последний deployment
4. Нажмите на **"..."** → **"View Logs"** или используйте **"Shell"**
5. Выполните команду:
   ```bash
   npx prisma migrate deploy
   ```

Или используйте Railway CLI:
```bash
railway run npx prisma migrate deploy
```

## Проверка работоспособности

После деплоя проверьте:

1. **Health Check**: Откройте `https://your-backend.railway.app/health`
   - Должен вернуться JSON с `status: "ok"`

2. **Логи**: Проверьте логи в Railway Dashboard
   - Не должно быть ошибок подключения к БД или Redis

3. **API**: Попробуйте зарегистрировать пользователя через API

## Важно

⚠️ **Не коммитьте эти значения в Git!** Они уже добавлены в `.gitignore` и не должны попасть в репозиторий.
