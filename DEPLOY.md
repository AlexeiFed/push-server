# 🚀 Деплой Push-Server на бесплатные платформы

## 📋 Обзор

Этот сервер объединяет все функции для работы с push-уведомлениями:
- ✅ Создание пользователей
- ✅ Удаление пользователей  
- ✅ Принудительный выход
- ✅ Отправка тревожных уведомлений
- ✅ Статистика

## 🎯 Бесплатные платформы

### 1. **Railway** (Рекомендую)
**Преимущества:**
- 500 часов бесплатно в месяц
- Автоматический деплой из GitHub
- SSL сертификаты
- Простая настройка

**Шаги деплоя:**
1. Загрузите код на GitHub
2. Зайдите на [railway.app](https://railway.app)
3. Создайте аккаунт через GitHub
4. Нажмите "New Project" → "Deploy from GitHub repo"
5. Выберите ваш репозиторий
6. Настройте переменные окружения

### 2. **Render**
**Преимущества:**
- Бесплатный план с ограничениями
- Автоматический деплой
- SSL сертификаты

**Шаги деплоя:**
1. Загрузите код на GitHub
2. Зайдите на [render.com](https://render.com)
3. Создайте аккаунт
4. Нажмите "New" → "Web Service"
5. Подключите GitHub репозиторий
6. Настройте переменные окружения

### 3. **Heroku**
**Преимущества:**
- 550-1000 часов бесплатно
- Отличная документация

**Шаги деплоя:**
1. Установите Heroku CLI
2. Создайте приложение: `heroku create your-app-name`
3. Настройте переменные окружения
4. Деплой: `git push heroku main`

## 🔧 Настройка переменных окружения

### Обязательные переменные:
```env
VAPID_PUBLIC_KEY=BFFDT7LnaaTPEXHnWao1Lx15gQjE4tzMuxtw9wKEd8h4FS2MJny8_oGoaY49UKpFhNF-yjEYhQ61JXRAbTjo51Q
VAPID_PRIVATE_KEY=GqWQ6E7gmeJCp9xAylXC9D8YMk3zY8j46JdGaBrgxdk
PORT=3000
```

### Firebase переменные:
Добавьте содержимое `serviceAccountKey.json` как переменную окружения:
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

## 🔄 Обновление frontend

После деплоя обновите URL в frontend:

### auth.ts:
```typescript
// Замените все URL на ваш домен
const response = await fetch('https://your-app.railway.app/createUser', {
const response = await fetch('https://your-app.railway.app/deleteUser/${uid}', {
```

### notifications.ts:
```typescript
const response = await fetch('https://your-app.railway.app/sendForceLogoutNotification', {
```

## 📊 API Endpoints

После деплоя будут доступны:

- `GET /status` - статус сервера
- `GET /stats` - статистика
- `POST /createUser` - создание пользователя
- `DELETE /deleteUser/:uid` - удаление пользователя
- `POST /sendForceLogoutNotification` - принудительный выход
- `POST /send-alarm` - тревожные уведомления

## 🧪 Тестирование

После деплоя проверьте:

1. **Статус сервера:**
```bash
curl https://your-app.railway.app/status
```

2. **Статистика:**
```bash
curl https://your-app.railway.app/stats
```

3. **Создание пользователя:**
```bash
curl -X POST https://your-app.railway.app/createUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"inspector","name":"Test User"}'
```

## ⚠️ Важные моменты

1. **Безопасность:** Не публикуйте приватные ключи в репозитории
2. **Лимиты:** Следите за лимитами бесплатных планов
3. **Мониторинг:** Настройте логирование для отслеживания ошибок
4. **Backup:** Регулярно делайте резервные копии данных

## 🎉 Результат

После успешного деплоя ваш сервер будет работать 24/7 и обрабатывать:
- ✅ Push-уведомления
- ✅ Создание/удаление пользователей
- ✅ Принудительный выход
- ✅ Статистику и мониторинг 