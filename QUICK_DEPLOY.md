# ⚡ Быстрый деплой Push Server на Railway

## 🎯 Цель
Разместить сервер push-уведомлений на Railway для работы 24/7 бесплатно.

## 📋 Что делает сервер
- ✅ Создание пользователей через Firebase Admin SDK
- ✅ Удаление пользователей из Firebase Auth  
- ✅ Отправка push-уведомлений
- ✅ Принудительный выход пользователей
- ✅ Тревожные уведомления
- ✅ Статистика и мониторинг

## 🚀 Пошаговый деплой

### 1. Подготовка GitHub репозитория
```bash
# Создайте новый репозиторий на GitHub
# Скопируйте все файлы из push-server в репозиторий
git add .
git commit -m "Push server ready for deployment"
git push origin main
```

### 2. Деплой на Railway
1. **Зайдите на [railway.app](https://railway.app)**
2. **Создайте аккаунт** через GitHub
3. **Нажмите "New Project"** → "Deploy from GitHub repo"
4. **Выберите ваш репозиторий**
5. **Дождитесь автоматического деплоя**

### 3. Настройка переменных окружения
В Railway Dashboard → Variables добавьте:

```env
VAPID_PUBLIC_KEY=BFFDT7LnaaTPEXHnWao1Lx15gQjE4tzMuxtw9wKEd8h4FS2MJny8_oGoaY49UKpFhNF-yjEYhQ61JXRAbTjo51Q
VAPID_PRIVATE_KEY=GqWQ6E7gmeJCp9xAylXC9D8YMk3zY8j46JdGaBrgxdk
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"vityaz-security-agency",...}
PORT=3000
```

### 4. Получение Firebase Service Account
1. Откройте `serviceAccountKey.json`
2. Скопируйте весь JSON
3. Вставьте в переменную `FIREBASE_SERVICE_ACCOUNT`

### 5. Проверка деплоя
После деплоя проверьте:
```bash
# Статус сервера
curl https://your-app.railway.app/status

# Статистика
curl https://your-app.railway.app/stats
```

## 🔄 Обновление frontend

После получения URL от Railway обновите в frontend:

### auth.ts:
```typescript
// Замените на ваш URL
const response = await fetch('https://your-app.railway.app/createUser', {
const response = await fetch('https://your-app.railway.app/deleteUser/${uid}', {
```

### notifications.ts:
```typescript
const response = await fetch('https://your-app.railway.app/sendForceLogoutNotification', {
```

## 📊 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/status` | Статус сервера |
| GET | `/stats` | Статистика |
| POST | `/createUser` | Создание пользователя |
| DELETE | `/deleteUser/:uid` | Удаление пользователя |
| POST | `/sendForceLogoutNotification` | Принудительный выход |
| POST | `/send-alarm` | Тревожные уведомления |

## 🧪 Тестирование

```bash
# Создание пользователя
curl -X POST https://your-app.railway.app/createUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"inspector","name":"Test"}'

# Удаление пользователя
curl -X DELETE https://your-app.railway.app/deleteUser/user_uid

# Принудительный выход
curl -X POST https://your-app.railway.app/sendForceLogoutNotification \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_uid","message":"Выход из системы"}'
```

## ⚠️ Важные моменты

1. **Безопасность:** Не публикуйте приватные ключи
2. **Лимиты:** Railway дает 500 часов бесплатно в месяц
3. **Мониторинг:** Следите за логами в Railway Dashboard
4. **Backup:** Регулярно делайте резервные копии

## 🎉 Результат

После успешного деплоя:
- ✅ Сервер работает 24/7
- ✅ Push-уведомления отправляются
- ✅ Пользователи создаются/удаляются
- ✅ Принудительный выход работает
- ✅ Статистика доступна

## 📞 Поддержка

При проблемах:
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные настроены
3. Проверьте статус: `GET /status` 