# ⚡ Быстрый старт на Render

## 🎯 Что нужно сделать за 10 минут

### 1. Подготовка GitHub (2 минуты)
```bash
# Создайте новый репозиторий на GitHub
# Скопируйте все файлы из push-server в репозиторий
git init
git add .
git commit -m "Push server ready for Render"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 2. Регистрация на Render (1 минута)
- Зайдите на [render.com](https://render.com)
- Создайте аккаунт через GitHub
- Подтвердите email

### 3. Создание Web Service (2 минуты)
- Нажмите "New" → "Web Service"
- Выберите ваш GitHub репозиторий
- Настройте:
  - **Name:** push-server
  - **Environment:** Node
  - **Region:** Frankfurt (EU Central)
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`

### 4. Переменные окружения (3 минуты)
В разделе "Environment" добавьте:

```env
NODE_ENV=production
PORT=10000
VAPID_PUBLIC_KEY=BFFDT7LnaaTPEXHnWao1Lx15gQjE4tzMuxtw9wKEd8h4FS2MJny8_oGoaY49UKpFhNF-yjEYhQ61JXRAbTjo51Q
VAPID_PRIVATE_KEY=GqWQ6E7gmeJCp9xAylXC9D8YMk3zY8j46JdGaBrgxdk
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"vityaz-security-agency",...}
```

**Для FIREBASE_SERVICE_ACCOUNT:**
1. Откройте `serviceAccountKey.json`
2. Скопируйте весь JSON
3. Вставьте в переменную

### 5. Деплой (2 минуты)
- Нажмите "Create Web Service"
- Дождитесь деплоя (5-10 минут)
- Получите URL: `https://your-app-name.onrender.com`

## 🧪 Быстрое тестирование

```bash
# Проверка статуса
curl https://your-app-name.onrender.com/status

# Тест создания пользователя
curl -X POST https://your-app-name.onrender.com/createUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"inspector","name":"Test"}'
```

## 🔄 Обновление frontend

После получения URL обновите в коде:

**auth.ts:**
```typescript
const response = await fetch('https://your-app-name.onrender.com/createUser', {
const response = await fetch('https://your-app-name.onrender.com/deleteUser/${uid}', {
```

**notifications.ts:**
```typescript
const response = await fetch('https://your-app-name.onrender.com/sendForceLogoutNotification', {
```

## ✅ Готово!

Ваш push-server теперь работает на Render:
- ✅ 24/7 доступность
- ✅ SSL сертификаты
- ✅ Автоматические перезапуски
- ✅ Мониторинг и логи
- ✅ Бесплатный план (750 часов/месяц)

## 📞 Если что-то пошло не так

1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные настроены
3. Проверьте статус: `GET /status`
4. Смотрите подробную инструкцию: `RENDER_DEPLOY.md`

---

**Время выполнения: ~10 минут** ⚡ 