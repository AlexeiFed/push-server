const express = require('express');
const cors = require('cors');
const { sendAlarmPushToAll, sendAlarmPushToUsers } = require('./send-alarm-push');

const app = express();
const PORT = process.env.PORT || 3001;

// Защита от спама - ограничение частоты отправки
const lastSendTime = new Map();
const MIN_SEND_INTERVAL = 5000; // 5 секунд между отправками

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://vityaz-security-agency.web.app'],
    credentials: true
}));
app.use(express.json());

// Статус сервера
app.get('/status', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Отправка тревожного уведомления
app.post('/send-alarm', async (req, res) => {
    try {
        const { type, target, userIds, title, body } = req.body;

        console.log('📡 Получен запрос на отправку уведомления:', {
            type,
            target,
            userIds: userIds?.length || 0,
            title,
            body
        });

        // Проверяем защиту от спама
        const now = Date.now();
        const lastSend = lastSendTime.get(target) || 0;

        if (now - lastSend < MIN_SEND_INTERVAL) {
            const remainingTime = Math.ceil((MIN_SEND_INTERVAL - (now - lastSend)) / 1000);
            console.log(`⏰ Слишком частые запросы. Ожидайте ${remainingTime} секунд`);
            return res.status(429).json({
                success: false,
                message: `Слишком частые запросы. Ожидайте ${remainingTime} секунд`,
                retryAfter: remainingTime
            });
        }

        // Обновляем время последней отправки
        lastSendTime.set(target, now);

        let result;

        if (target === 'users' && userIds && userIds.length > 0) {
            // Отправка конкретным пользователям
            const objectId = req.body.objectId;
            const objectName = req.body.objectName;
            result = await sendAlarmPushToUsers(userIds, title, body, objectId, objectName);
        } else {
            // Отправка всем пользователям
            const objectId = req.body.objectId;
            const objectName = req.body.objectName;
            result = await sendAlarmPushToAll(title, body, objectId, objectName);
        }

        // Проверяем, что результат существует
        if (!result) {
            result = { sentCount: 0, errorCount: 1 };
        }

        res.json({
            success: true,
            message: 'Уведомление отправлено',
            sentCount: result.sentCount || 0,
            errorCount: result.errorCount || 0,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка обработки запроса:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка отправки уведомления',
            error: error.message
        });
    }
});

// Отправка тестового уведомления
app.post('/send-test', async (req, res) => {
    try {
        const { title, body, testId, senderId, senderName } = req.body;

        console.log('📡 Получен запрос на отправку тестового уведомления:', {
            title,
            body,
            testId,
            senderId,
            senderName
        });

        // Проверяем защиту от спама
        const now = Date.now();
        const lastSend = lastSendTime.get('test') || 0;

        if (now - lastSend < MIN_SEND_INTERVAL) {
            const remainingTime = Math.ceil((MIN_SEND_INTERVAL - (now - lastSend)) / 1000);
            console.log(`⏰ Слишком частые тестовые запросы. Ожидайте ${remainingTime} секунд`);
            return res.status(429).json({
                success: false,
                message: `Слишком частые запросы. Ожидайте ${remainingTime} секунд`,
                remainingTime
            });
        }

        // Обновляем время последней отправки
        lastSendTime.set('test', now);

        // Отправляем тестовое уведомление всем пользователям
        const result = await sendAlarmPushToAll({
            title: title || 'Проверка связи',
            body: body || 'Тестовое уведомление для проверки связи',
            data: {
                type: 'test-notification',
                testId: testId || `test_${Date.now()}`,
                senderId: senderId || 'system',
                senderName: senderName || 'Система',
                timestamp: Date.now()
            }
        });

        console.log('✅ Тестовое уведомление отправлено:', result);

        res.json({
            success: true,
            message: 'Тестовое уведомление отправлено',
            sentCount: result.sentCount || 0,
            errorCount: result.errorCount || 0,
            testId: testId || `test_${Date.now()}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка отправки тестового уведомления:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка отправки тестового уведомления',
            error: error.message
        });
    }
});

// Статистика подписок
app.get('/stats', async (req, res) => {
    try {
        const admin = require('firebase-admin');
        const db = admin.firestore();

        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();
        let valid = 0;
        let invalid = 0;

        subscriptionsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.subscription?.endpoint || data.endpoint) {
                valid++;
            } else {
                invalid++;
            }
        });

        res.json({
            total: subscriptionsSnapshot.size,
            valid,
            invalid,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения статистики',
            error: error.message
        });
    }
});

// Получение FCM токена через серверную аутентификацию
app.post('/get-fcm-token', async (req, res) => {
    try {
        const { userId, userRole, deviceInfo } = req.body;

        console.log('🔑 Получен запрос на FCM токен:', { userId, userRole });

        // Валидация данных
        if (!userId || !userRole) {
            return res.status(400).json({
                success: false,
                message: 'Отсутствуют обязательные поля userId и userRole'
            });
        }

        const admin = require('firebase-admin');

        // Создаем кастомный токен для FCM
        const customToken = await admin.auth().createCustomToken(userId, {
            role: userRole,
            deviceInfo: deviceInfo || {}
        });

        console.log('✅ Custom token создан для пользователя:', userId);

        res.json({
            success: true,
            customToken: customToken,
            message: 'Custom token создан успешно',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка создания FCM токена:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка создания FCM токена',
            error: error.message
        });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Push-server запущен на порту ${PORT}`);
    console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
    console.log(`📊 Статистика: http://localhost:${PORT}/stats`);
    console.log(`🔍 Статус: http://localhost:${PORT}/status`);
    console.log(`🛡️ Защита от спама: ${MIN_SEND_INTERVAL}ms между запросами`);
});

module.exports = app; 