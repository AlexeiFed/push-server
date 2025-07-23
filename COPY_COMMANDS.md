# 📋 Готовые команды для копирования

## 🚀 Подготовка GitHub репозитория

```bash
# 1. Создайте новый репозиторий на GitHub
# 2. Скопируйте эти команды и выполните:

git init
git add .
git commit -m "Push server ready for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 🧪 Тестирование после деплоя

### Проверка статуса сервера
```bash
curl https://YOUR_APP_NAME.onrender.com/status
```

### Проверка статистики
```bash
curl https://YOUR_APP_NAME.onrender.com/stats
```

### Тест создания пользователя
```bash
curl -X POST https://YOUR_APP_NAME.onrender.com/createUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"inspector","name":"Test User"}'
```

### Тест удаления пользователя
```bash
curl -X DELETE https://YOUR_APP_NAME.onrender.com/deleteUser/TEST_USER_ID
```

### Тест принудительного выхода
```bash
curl -X POST https://YOUR_APP_NAME.onrender.com/sendForceLogoutNotification \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user_id","message":"Выход из системы"}'
```

### Тест тревожного уведомления
```bash
curl -X POST https://YOUR_APP_NAME.onrender.com/send-alarm \
  -H "Content-Type: application/json" \
  -d '{"message":"Тревога!","objectId":"test_object"}'
```

## 🔄 Обновление frontend кода

### auth.ts - создание пользователя
```typescript
const response = await fetch('https://YOUR_APP_NAME.onrender.com/createUser', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email,
    password,
    role,
    name
  })
});
```

### auth.ts - удаление пользователя
```typescript
const response = await fetch(`https://YOUR_APP_NAME.onrender.com/deleteUser/${uid}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  }
});
```

### notifications.ts - принудительный выход
```typescript
const response = await fetch('https://YOUR_APP_NAME.onrender.com/sendForceLogoutNotification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: uid,
    message: 'Выход из системы'
  })
});
```

## 📊 Переменные окружения для Render

```env
NODE_ENV=production
PORT=10000
VAPID_PUBLIC_KEY=BFFDT7LnaaTPEXHnWao1Lx15gQjE4tzMuxtw9wKEd8h4FS2MJny8_oGoaY49UKpFhNF-yjEYhQ61JXRAbTjo51Q
VAPID_PRIVATE_KEY=GqWQ6E7gmeJCp9xAylXC9D8YMk3zY8j46JdGaBrgxdk
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"vityaz-security-agency","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@vityaz-security-agency.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...%40vityaz-security-agency.iam.gserviceaccount.com"}
```

## 🔧 Настройки Render

### Build Command
```
npm install
```

### Start Command
```
npm start
```

### Health Check Path
```
/status
```

## 📝 Замена переменных

Замените в командах:
- `YOUR_USERNAME` - ваше имя пользователя GitHub
- `YOUR_REPO_NAME` - название вашего репозитория
- `YOUR_APP_NAME` - название приложения на Render
- `TEST_USER_ID` - ID тестового пользователя
- `FIREBASE_SERVICE_ACCOUNT` - содержимое serviceAccountKey.json

## ⚠️ Важные замечания

1. **FIREBASE_SERVICE_ACCOUNT** - скопируйте весь JSON из файла `serviceAccountKey.json`
2. **VAPID ключи** - используйте ваши реальные ключи
3. **URL** - замените на ваш реальный URL от Render
4. **Тестирование** - выполняйте команды после успешного деплоя

## 📞 Поддержка

При проблемах:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные настроены
3. Проверьте статус: `GET /status`
4. Смотрите подробную инструкцию: `RENDER_DEPLOY.md` 