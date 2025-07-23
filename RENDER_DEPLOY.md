# 🚀 Деплой Push Server на Render

## 📋 Обзор
Render - отличная платформа для размещения Node.js приложений с бесплатным планом.

## 🎯 Преимущества Render
- ✅ 750 часов бесплатно в месяц
- ✅ Автоматический деплой из GitHub
- ✅ SSL сертификаты включены
- ✅ Простая настройка переменных окружения
- ✅ Health checks
- ✅ Автоматические перезапуски

## 🚀 Пошаговый деплой

### 1. Подготовка GitHub репозитория

```bash
# Создайте новый репозиторий на GitHub
# Скопируйте все файлы из push-server в репозиторий

git init
git add .
git commit -m "Push server ready for Render deployment"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 2. Регистрация на Render

1. **Зайдите на [render.com](https://render.com)**
2. **Создайте аккаунт** через GitHub
3. **Подтвердите email**

### 3. Создание Web Service

1. **Нажмите "New"** → "Web Service"
2. **Подключите GitHub репозиторий**
3. **Выберите репозиторий** с push-server
4. **Настройте параметры:**

```
Name: push-server
Environment: Node
Region: Frankfurt (EU Central)
Branch: main
Root Directory: (оставьте пустым)
Build Command: npm install
Start Command: npm start
```

### 4. Настройка переменных окружения

В разделе "Environment" добавьте:

```env
NODE_ENV=production
PORT=10000
VAPID_PUBLIC_KEY=BFFDT7LnaaTPEXHnWao1Lx15gQjE4tzMuxtw9wKEd8h4FS2MJny8_oGoaY49UKpFhNF-yjEYhQ61JXRAbTjo51Q
VAPID_PRIVATE_KEY=GqWQ6E7gmeJCp9xAylXC9D8YMk3zY8j46JdGaBrgxdk
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"vityaz-security-agency",...}
```

### 5. Получение Firebase Service Account

1. Откройте `serviceAccountKey.json`
2. Скопируйте весь JSON
3. Вставьте в переменную `FIREBASE_SERVICE_ACCOUNT`

### 6. Деплой

1. **Нажмите "Create Web Service"**
2. **Дождитесь автоматического деплоя** (5-10 минут)
3. **Получите URL** вида: `https://your-app-name.onrender.com`

## 📊 API Endpoints

После деплоя будут доступны:

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/status` | Статус сервера |
| GET | `/stats` | Статистика подписок |
| POST | `/createUser` | Создание пользователя |
| DELETE | `/deleteUser/:uid` | Удаление пользователя |
| POST | `/sendForceLogoutNotification` | Принудительный выход |
| POST | `/send-alarm` | Тревожные уведомления |

## 🧪 Тестирование после деплоя

### 1. Проверка статуса
```bash
curl https://your-app-name.onrender.com/status
```

### 2. Проверка статистики
```bash
curl https://your-app-name.onrender.com/stats
```

### 3. Тест создания пользователя
```bash
curl -X POST https://your-app-name.onrender.com/createUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"inspector","name":"Test User"}'
```

### 4. Тест принудительного выхода
```bash
curl -X POST https://your-app-name.onrender.com/sendForceLogoutNotification \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user_id","message":"Выход из системы"}'
```

## 🔄 Обновление frontend

После получения URL от Render обновите в frontend:

### auth.ts:
```typescript
// Замените на ваш URL
const response = await fetch('https://your-app-name.onrender.com/createUser', {
const response = await fetch('https://your-app-name.onrender.com/deleteUser/${uid}', {
```

### notifications.ts:
```typescript
const response = await fetch('https://your-app-name.onrender.com/sendForceLogoutNotification', {
```

## 📈 Мониторинг

### Логи в Render Dashboard
- Перейдите в ваш сервис на Render
- Вкладка "Logs" - просмотр логов в реальном времени
- Вкладка "Metrics" - статистика запросов

### Health Checks
Render автоматически проверяет `/status` endpoint каждые 30 секунд

## ⚠️ Ограничения бесплатного плана

- **750 часов/месяц** (≈31 день)
- **Авто-спящий режим** после 15 минут неактивности
- **512MB RAM**
- **Shared CPU**

## 🔧 Устранение проблем

### Проблема: Сервер не запускается
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения настроены
3. Проверьте, что `npm start` работает локально

### Проблема: Push-уведомления не отправляются
1. Проверьте VAPID ключи
2. Убедитесь, что Firebase настроен правильно
3. Проверьте логи сервера

### Проблема: Авто-спящий режим
- Это нормально для бесплатного плана
- Первый запрос после сна может занять 30-60 секунд
- Для продакшена рекомендуется платный план

## 💰 Стоимость

### Бесплатный план:
- ✅ 750 часов/месяц
- ✅ SSL сертификаты
- ✅ Автоматический деплой
- ✅ Health checks

### Платный план (если нужен):
- **$7/месяц** - всегда активный сервер
- **$25/месяц** - выделенные ресурсы

## 🎉 Результат

После успешного деплоя:
- ✅ Сервер работает на Render
- ✅ Push-уведомления отправляются
- ✅ Пользователи создаются/удаляются
- ✅ Принудительный выход работает
- ✅ Статистика доступна
- ✅ Автоматические перезапуски при сбоях

## 📞 Поддержка

При проблемах:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные настроены
3. Проверьте статус: `GET /status`
4. Обратитесь в поддержку Render при необходимости 