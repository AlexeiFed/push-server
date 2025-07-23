# 🚀 Деплой обновленного push-server на Render

## ✅ Выполненные шаги

### 1. Подготовка к деплою
- [x] Проверка изменений в коде
- [x] Коммит изменений в Git
- [x] Отправка на GitHub

### 2. Автоматический деплой
Render автоматически обнаружит изменения в GitHub и начнет деплой.

## 🔄 Ожидаемый процесс

### Время деплоя
- **Обычно:** 2-5 минут
- **При первом деплое:** 5-10 минут
- **При больших изменениях:** до 15 минут

### Признаки успешного деплоя
1. **Версия обновится** с 2.1.0 до 2.2.0
2. **Новые endpoints** станут доступны
3. **Логи покажут** успешный запуск

## 🧪 Тестирование после деплоя

### 1. Проверка версии
```bash
curl https://push-server-b8p6.onrender.com/status
```
**Ожидаемый результат:**
```json
{
  "status": "ok",
  "version": "2.2.0",
  "services": ["push", "create-user", "delete-user", "force-logout", "savePushSubscription", "removePushSubscription"]
}
```

### 2. Тест новых endpoints

#### Сохранение подписки
```bash
curl -X POST https://push-server-b8p6.onrender.com/savePushSubscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "subscription": {
      "endpoint": "https://test.com",
      "keys": {
        "p256dh": "test_key",
        "auth": "test_auth"
      }
    }
  }'
```

#### Удаление подписки
```bash
curl -X POST https://push-server-b8p6.onrender.com/removePushSubscription \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user"}'
```

### 3. Тест создания пользователя
```bash
curl -X POST https://push-server-b8p6.onrender.com/createUser \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "role": "inspector",
    "name": "Test User"
  }'
```

## 🔍 Мониторинг деплоя

### Проверка логов Render
1. Зайдите на [render.com](https://render.com)
2. Найдите ваш push-server
3. Перейдите на вкладку "Logs"
4. Проверьте наличие ошибок

### Признаки проблем
- ❌ Ошибки в логах
- ❌ Сервер не отвечает
- ❌ Версия не обновилась через 10 минут

## 🚨 Если деплой не прошел

### Вариант 1: Ручной деплой (РЕКОМЕНДУЕТСЯ)
1. Зайдите в [Render Dashboard](https://render.com)
2. Найдите ваш push-server (`push-server-b8p6`)
3. Нажмите **"Manual Deploy"**
4. Выберите **"Deploy latest commit"**
5. Дождитесь завершения деплоя (2-3 минуты)
6. Проверьте статус: `curl https://push-server-b8p6.onrender.com/status`

### Вариант 2: Clear build cache & deploy
Если "Deploy latest commit" не помог:
1. Нажмите **"Manual Deploy"**
2. Выберите **"Clear build cache & deploy"**
3. Это очистит кэш и пересоберет приложение

### Вариант 3: Проверка переменных окружения
Убедитесь, что в Render настроены:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `FIREBASE_SERVICE_ACCOUNT`

### Вариант 4: Пересоздание сервиса
Если ничего не помогает:
1. Создайте новый Web Service в Render
2. Укажите тот же GitHub репозиторий
3. Настройте переменные окружения
4. Получите новый URL

## 📊 Ожидаемые улучшения

После успешного деплоя:
- ✅ Исправлена структура подписок
- ✅ Устранены CORS ошибки
- ✅ Добавлены новые endpoints
- ✅ Улучшено логирование ошибок
- ✅ Поддержка разных форматов данных

## 🎯 Следующие шаги

1. **Дождаться обновления** (2-5 минут)
2. **Проверить версию** через `/status`
3. **Протестировать** новые endpoints
4. **Обновить frontend** если нужно
5. **Проверить** работу push-уведомлений

## 📞 Поддержка

Если деплой не прошел через 15 минут:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что GitHub репозиторий обновлен
3. Проверьте переменные окружения
4. Создайте новый сервис при необходимости 