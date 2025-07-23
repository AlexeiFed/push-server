# ⚡ Быстрый деплой на Render

## 🎯 Цель
Обновить push-server до версии 2.2.0 с исправлениями структуры подписок

## 🚀 Пошаговая инструкция

### 1. Откройте Render Dashboard
- Перейдите на [render.com](https://render.com)
- Войдите в аккаунт
- Найдите сервис `push-server-b8p6`

### 2. Запустите ручной деплой
- Нажмите кнопку **"Manual Deploy"**
- Выберите **"Deploy latest commit"**
- Дождитесь завершения (2-3 минуты)

### 3. Проверьте результат
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

## 🔄 Альтернативные варианты

### Если "Deploy latest commit" не помог:
1. **Clear build cache & deploy** - очистит кэш и пересоберет
2. **Restart service** - перезапустит сервис

### Если ничего не помогает:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что переменные окружения настроены
3. Создайте новый сервис при необходимости

## ✅ Признаки успешного деплоя

- ✅ Версия обновилась до 2.2.0
- ✅ Новые endpoints доступны
- ✅ Нет ошибок в логах
- ✅ Сервер отвечает на запросы

## 🧪 Тестирование

После успешного деплоя протестируйте:

```bash
# Проверка новых endpoints
curl -X POST https://push-server-b8p6.onrender.com/savePushSubscription \
  -H "Content-Type: application/json" \
  -d '{"test":"test"}'

# Создание пользователя
curl -X POST https://push-server-b8p6.onrender.com/createUser \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"inspector","name":"Test"}'
```

## 📞 Поддержка

Если деплой не прошел:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что GitHub репозиторий обновлен
3. Проверьте переменные окружения
4. Создайте новый сервис при необходимости 