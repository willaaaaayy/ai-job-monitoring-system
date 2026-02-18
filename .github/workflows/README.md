# GitHub Actions CI/CD Workflows

Этот проект использует GitHub Actions для автоматизации CI/CD процессов.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Запускается при каждом push и pull request в ветки `main` и `develop`.

#### Jobs:

- **lint-backend**: Проверяет код backend на ошибки ESLint и TypeScript
- **test-backend**: Запускает тесты backend на Node.js 18.x и 20.x
- **build-backend**: Собирает TypeScript код backend
- **lint-frontend**: Проверяет код frontend на ошибки ESLint
- **build-frontend**: Собирает Next.js приложение
- **security-scan**: Проверяет зависимости на уязвимости
- **ci-success**: Финальный job, который выполняется только если все предыдущие успешны

### 2. CD Pipeline (`.github/workflows/cd.yml`)

Запускается только при push в ветку `main` или при ручном запуске через `workflow_dispatch`.

#### Jobs:

- **deploy-backend**: Деплоит backend на Railway
- **deploy-frontend**: Деплоит frontend на Vercel
- **cd-success**: Финальный job для отображения статуса деплоя

## Настройка Secrets

Для работы CD pipeline необходимо настроить следующие secrets в GitHub:

### Railway (Backend)

1. Перейдите в Railway Dashboard → Settings → Tokens
2. Создайте новый token
3. Добавьте в GitHub: Settings → Secrets and variables → Actions → New repository secret
   - **Name**: `RAILWAY_TOKEN`
   - **Value**: ваш Railway token

### Vercel (Frontend)

1. Перейдите в Vercel Dashboard → Settings → Tokens
2. Создайте новый token
3. Найдите ваш Project ID и Org ID в настройках проекта
4. Добавьте в GitHub:
   - **VERCEL_TOKEN**: ваш Vercel token
   - **VERCEL_ORG_ID**: ваш Organization ID
   - **VERCEL_PROJECT_ID**: ваш Project ID

## Локальная разработка

### Запуск проверок локально

```bash
# Backend
npm run lint          # Проверка ESLint
npm run type-check    # Проверка TypeScript типов
npm test              # Запуск тестов
npm run build         # Сборка проекта

# Frontend
cd frontend
npm run lint          # Проверка ESLint
npm run build         # Сборка Next.js
```

## Troubleshooting

### CI не проходит

1. Проверьте логи в GitHub Actions
2. Запустите проверки локально: `npm run lint && npm run type-check && npm test`
3. Убедитесь, что все зависимости установлены: `npm ci`

### CD не деплоит

1. Проверьте, что secrets настроены правильно
2. Убедитесь, что вы в ветке `main`
3. Проверьте логи деплоя в GitHub Actions
4. Для Railway: можно деплоить вручную через Railway Dashboard
5. Для Vercel: можно деплоить вручную через Vercel Dashboard или CLI

## Отключение автоматического деплоя

Если вы хотите отключить автоматический деплой:

1. Удалите или закомментируйте секреты в GitHub
2. Или удалите файл `.github/workflows/cd.yml`
3. Деплой можно будет выполнять вручную через соответствующие dashboards
