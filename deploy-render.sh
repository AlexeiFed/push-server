#!/bin/bash

# 🚀 Скрипт автоматического деплоя Push Server на Render

echo "🚀 Подготовка к деплою на Render..."

# Проверяем наличие необходимых файлов
if [ ! -f "fixed-unified-server.js" ]; then
    echo "❌ Ошибка: fixed-unified-server.js не найден"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден"
    exit 1
fi

if [ ! -f "render.yaml" ]; then
    echo "❌ Ошибка: render.yaml не найден"
    exit 1
fi

# Проверяем переменные окружения
if [ -z "$VAPID_PUBLIC_KEY" ] || [ -z "$VAPID_PRIVATE_KEY" ]; then
    echo "⚠️  Предупреждение: VAPID ключи не настроены"
    echo "Сгенерируйте ключи командой: npx web-push generate-vapid-keys"
fi

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Проверяем сборку
echo "🔧 Проверяем сборку..."
npm start &
SERVER_PID=$!

# Ждем запуска сервера
sleep 5

# Проверяем статус сервера
echo "🔍 Проверяем статус сервера..."
curl -f http://localhost:3000/status > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Сервер успешно запущен!"
    echo "📊 Статус: http://localhost:3000/status"
    echo "📈 Статистика: http://localhost:3000/stats"
else
    echo "❌ Ошибка: сервер не отвечает"
fi

# Останавливаем тестовый сервер
kill $SERVER_PID 2>/dev/null

echo "🎉 Готово к деплою на Render!"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Загрузите код на GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for Render deployment'"
echo "   git push origin main"
echo ""
echo "2. Деплой на Render:"
echo "   - Зайдите на render.com"
echo "   - Создайте аккаунт через GitHub"
echo "   - Нажмите 'New' → 'Web Service'"
echo "   - Подключите GitHub репозиторий"
echo "   - Настройте переменные окружения"
echo ""
echo "3. Переменные окружения для Render:"
echo "   NODE_ENV=production"
echo "   PORT=10000"
echo "   VAPID_PUBLIC_KEY=your_public_key"
echo "   VAPID_PRIVATE_KEY=your_private_key"
echo "   FIREBASE_SERVICE_ACCOUNT={\"type\":\"service_account\",...}"
echo ""
echo "4. После деплоя обновите URL в frontend"
echo ""
echo "📖 Подробная инструкция: RENDER_DEPLOY.md" 