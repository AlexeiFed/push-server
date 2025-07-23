# 🚀 Push Server для Render

Объединенный сервер для push-уведомлений, оптимизированный для деплоя на Render.

## 📋 Функции

- ✅ Создание пользователей через Firebase Admin SDK
- ✅ Удаление пользователей из Firebase Auth
- ✅ Отправка push-уведомлений
- ✅ Принудительный выход пользователей
- ✅ Тревожные уведомления
- ✅ Статистика и мониторинг

## 🚀 Быстрый деплой на Render

### 1. Подготовка
```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd push-server

# Установите зависимости
npm install
```

### 2. Настройка переменных окружения
Скопируйте `render.env.example` в `render.env` и заполните:
```bash
cp render.env.example render.env
# Отредактируйте render.env с вашими значениями
```

### 3. Деплой на Render
1. Зайдите на [render.com](https://render.com)
2. Создайте аккаунт через GitHub
3. Нажмите "New" → "Web Service"
4. Подключите GitHub репозиторий
5. Настройте переменные окружения в Render Dashboard

### 4. Переменные окружения для Render
```env
NODE_ENV=production
PORT=10000
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
FIREBASE_SERVICE_ACCOUNT=your_json
```

## 📊 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/status` | Статус сервера |
| GET | `/stats` | Статистика подписок |
| POST | `/createUser` | Создание пользователя |
| DELETE | `/deleteUser/:uid` | Удаление пользователя |
| POST | `/sendForceLogoutNotification` | Принудительный выход |
| POST | `/send-alarm` | Тревожные уведомления |

## 🧪 Тестирование

```bash
# Проверка статуса
curl https://your-app-name.onrender.com/status

# Создание пользователя
curl -X POST https://your-app-name.onrender.com/createUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"inspector","name":"Test"}'
```

## 🔧 Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Запуск продакшн версии
npm start
```

## 📈 Мониторинг

- **Логи:** Render Dashboard → Logs
- **Метрики:** Render Dashboard → Metrics
- **Health Checks:** Автоматически проверяет `/status`

## ⚠️ Ограничения Render

- **750 часов/месяц** (бесплатный план)
- **Авто-спящий режим** после 15 минут неактивности
- **512MB RAM**
- **Shared CPU**

## 🔒 Безопасность

- Все приватные ключи хранятся в переменных окружения
- CORS настроен для разрешенных доменов
- Защита от спама (5 секунд между запросами)
- Валидация входных данных

## 📞 Поддержка

При проблемах:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные настроены
3. Проверьте статус: `GET /status`

## 📄 Лицензия

ISC License 