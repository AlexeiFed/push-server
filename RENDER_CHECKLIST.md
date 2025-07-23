# ✅ Чек-лист деплоя на Render

## 📋 Подготовка кода

### ✅ Созданные файлы:
- [x] `fixed-unified-server.js` - исправленный сервер
- [x] `render.yaml` - конфигурация Render
- [x] `package.json` - обновлен для Render
- [x] `RENDER_DEPLOY.md` - подробная инструкция
- [x] `README-RENDER.md` - README для Render
- [x] `render.env.example` - пример переменных окружения
- [x] `deploy-render.sh` - скрипт деплоя
- [x] `.gitignore` - обновлен для Render

### ✅ Проверка кода:
- [x] Сервер запускается локально
- [x] Все зависимости указаны в package.json
- [x] Исправлена обработка ошибок подписок
- [x] Настроены health checks
- [x] Оптимизирован для Render

## 🚀 Деплой на Render

### 1. GitHub репозиторий
- [ ] Создать репозиторий на GitHub
- [ ] Загрузить код в репозиторий
- [ ] Убедиться, что все файлы загружены

### 2. Регистрация на Render
- [ ] Создать аккаунт на render.com
- [ ] Подтвердить email
- [ ] Подключить GitHub аккаунт

### 3. Создание Web Service
- [ ] Нажать "New" → "Web Service"
- [ ] Выбрать GitHub репозиторий
- [ ] Настроить параметры:
  - [ ] Name: push-server
  - [ ] Environment: Node
  - [ ] Region: Frankfurt (EU Central)
  - [ ] Branch: main
  - [ ] Build Command: npm install
  - [ ] Start Command: npm start

### 4. Переменные окружения
- [ ] NODE_ENV=production
- [ ] PORT=10000
- [ ] VAPID_PUBLIC_KEY=your_key
- [ ] VAPID_PRIVATE_KEY=your_key
- [ ] FIREBASE_SERVICE_ACCOUNT=your_json

### 5. Деплой
- [ ] Нажать "Create Web Service"
- [ ] Дождаться успешного деплоя
- [ ] Получить URL сервера

## 🧪 Тестирование после деплоя

### Проверка статуса
- [ ] `GET /status` - статус сервера
- [ ] `GET /stats` - статистика подписок

### Тест API endpoints
- [ ] `POST /createUser` - создание пользователя
- [ ] `DELETE /deleteUser/:uid` - удаление пользователя
- [ ] `POST /sendForceLogoutNotification` - принудительный выход
- [ ] `POST /send-alarm` - тревожные уведомления

### Проверка логов
- [ ] Просмотр логов в Render Dashboard
- [ ] Проверка ошибок
- [ ] Мониторинг метрик

## 🔄 Обновление frontend

### auth.ts
- [ ] Обновить URL для createUser
- [ ] Обновить URL для deleteUser

### notifications.ts
- [ ] Обновить URL для sendForceLogoutNotification

## 📊 Мониторинг

### Render Dashboard
- [ ] Настроить уведомления о сбоях
- [ ] Мониторинг использования ресурсов
- [ ] Просмотр логов в реальном времени

### Health Checks
- [ ] Проверить, что `/status` отвечает
- [ ] Убедиться, что health checks проходят

## ⚠️ Ограничения и особенности

### Бесплатный план Render
- [ ] 750 часов/месяц (≈31 день)
- [ ] Авто-спящий режим после 15 минут
- [ ] 512MB RAM
- [ ] Shared CPU

### Авто-спящий режим
- [ ] Первый запрос после сна может занять 30-60 секунд
- [ ] Это нормально для бесплатного плана
- [ ] Для продакшена рекомендуется платный план

## 🎯 Результат

После успешного деплоя:
- [x] Сервер работает на Render
- [x] Push-уведомления отправляются
- [x] Пользователи создаются/удаляются
- [x] Принудительный выход работает
- [x] Статистика доступна
- [x] Автоматические перезапуски при сбоях

## 📞 Поддержка

При проблемах:
1. [ ] Проверить логи в Render Dashboard
2. [ ] Убедиться, что все переменные настроены
3. [ ] Проверить статус: `GET /status`
4. [ ] Обратиться в поддержку Render при необходимости

## 📚 Документация

- [x] `RENDER_DEPLOY.md` - подробная инструкция
- [x] `README-RENDER.md` - README для Render
- [x] `SUBSCRIPTION_FIX.md` - исправление проблем с подписками
- [x] `QUICK_DEPLOY.md` - быстрый деплой

---

**Готово к деплою на Render! 🚀** 