# Pre-Deployment Checklist

## 🔴 Критичные проверки перед деплоем

### ✅ 1. Sentry импорт исправлен
**Статус:** ✅ ИСПРАВЛЕНО
- Файл: `src/app.ts:2`
- Добавлен: `import * as Sentry from '@sentry/node';`
- Sentry handlers работают корректно

### ⚠️ 2. Prisma миграции применены
**Статус:** ⚠️ ТРЕБУЕТ ПРОВЕРКИ
- Миграция `20240218000000_add_unique_constraint_and_update_status` помечена как примененная
- **Действие:** Проверить в production БД наличие constraint:
  ```sql
  SELECT constraint_name 
  FROM information_schema.table_constraints 
  WHERE table_name = 'Job' 
  AND constraint_name = 'Job_tenantId_url_key';
  ```
- Если constraint отсутствует, выполнить SQL из `prisma/migrations/20240218000000_add_unique_constraint_and_update_status/migration.sql`

### ✅ 3. CSRF исправлен
**Статус:** ✅ ИСПРАВЛЕНО
- Файл: `src/middlewares/csrf.middleware.ts`
- Реализована proper token validation с Redis session storage
- Используется timing-safe comparison
- Токены хранятся в Redis с TTL 1 час
- **Альтернатива:** Если используете JWT-only + same-site cookies, можно временно отключить CSRF для API endpoints

### ✅ 4. NODE_ENV=production
**Статус:** ✅ НАСТРОЕНО
- Конфигурация: `src/infrastructure/config.ts`
- По умолчанию: `development`
- **В production:** Убедитесь, что `NODE_ENV=production` установлен в:
  - Railway environment variables
  - Docker Compose (уже настроено: `NODE_ENV: production`)
  - `.env` файле (для локального тестирования)

### ✅ 5. Логи в JSON
**Статус:** ✅ НАСТРОЕНО
- Файл: `src/infrastructure/logger.ts`
- Формат: JSON для всех логов (console и file)
- Structured logging включен
- Correlation IDs работают

## Дополнительные проверки

### Environment Variables
Убедитесь, что все переменные окружения установлены в production:

**Обязательные:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Минимум 32 символа
- `N8N_WEBHOOK_URL` - URL n8n webhook

**Опциональные (для полной функциональности):**
- `STRIPE_SECRET_KEY` - Для billing
- `STRIPE_WEBHOOK_SECRET` - Для Stripe webhooks
- `STRIPE_PRICE_ID_PRO` - Price ID для Pro плана
- `STRIPE_PRICE_ID_ENTERPRISE` - Price ID для Enterprise плана
- `CORS_ORIGIN` - Frontend URL(s)
- `SENTRY_DSN` - Для error tracking
- `FRONTEND_URL` - Frontend URL для redirects

### Database
- [ ] Все миграции применены
- [ ] Unique constraint `Job_tenantId_url_key` существует
- [ ] Индексы созданы
- [ ] Foreign keys настроены

### Security
- [ ] `JWT_SECRET` достаточно длинный (min 32 chars)
- [ ] `CORS_ORIGIN` не содержит `*` в production
- [ ] HTTPS включен (Railway/Vercel предоставляют автоматически)
- [ ] Secure cookies настроены (для production)

### Monitoring
- [ ] Sentry DSN настроен
- [ ] Prometheus metrics endpoint доступен (`/metrics`)
- [ ] Health check endpoint работает (`/health`)
- [ ] Logs настроены правильно

### Testing
- [ ] Тесты проходят: `npm test`
- [ ] Integration тесты работают
- [ ] Manual testing проведен

## Команды для проверки перед деплоем

```bash
# 1. Проверить миграции
npx prisma migrate status

# 2. Запустить тесты
npm test

# 3. Проверить build
npm run build

# 4. Проверить линтер
npm run lint  # если настроен

# 5. Проверить health endpoint локально
curl http://localhost:3000/health

# 6. Проверить metrics endpoint
curl http://localhost:3000/metrics
```

## После деплоя

1. Проверить health endpoint: `GET https://your-backend.up.railway.app/health`
2. Проверить metrics endpoint: `GET https://your-backend.up.railway.app/metrics`
3. Проверить Swagger docs: `GET https://your-backend.up.railway.app/docs`
4. Проверить логи в Railway dashboard
5. Проверить Sentry для ошибок
6. Протестировать authentication flow
7. Протестировать job fetching и scoring
