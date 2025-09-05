/**
 * @file: fixed-unified-server.js
 * @description: Исправленный объединенный сервер для всех функций push-server
 * @dependencies: firebase-admin, express, cors, web-push, dotenv
 * @created: 2025-07-23
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    serviceAccount = require('./serviceAccountKey.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Настройка web-push
webpush.setVapidDetails(
    'mailto:admin@vityaz-security.ru',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://vityaz-security-agency.web.app'],
    credentials: true
}));
app.use(express.json());

// Защита от спама - ограничение частоты отправки
const lastSendTime = new Map();
const MIN_SEND_INTERVAL = 5000; // 5 секунд между отправками

// ===== СТАТУС СЕРВЕРА =====
app.get('/status', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        services: ['push', 'create-user', 'delete-user', 'force-logout', 'callDog-webhook']
    });
});

// ===== УТИЛИТЫ =====
function formatPhoneNumber(phone) {
    if (!phone) return '';

    // Удаляем все символы кроме цифр
    const digits = phone.replace(/\D/g, '');

    // Если номер начинается с 8, заменяем на +7
    if (digits.startsWith('8') && digits.length === 11) {
        return '+7' + digits.substring(1);
    }

    // Если номер начинается с 7, добавляем +
    if (digits.startsWith('7') && digits.length === 11) {
        return '+' + digits;
    }

    // Если номер уже в формате +7, возвращаем как есть
    if (phone.startsWith('+7') && digits.length === 11) {
        return phone;
    }

    // Если номер короткий, добавляем +7
    if (digits.length === 10) {
        return '+7' + digits;
    }

    // Возвращаем исходный номер если не удалось определить формат
    return phone;
}

// ===== СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ =====
app.post('/createUser', async (req, res) => {
    try {
        const { email, password, role, name, phone } = req.body;

        if (!email || !password || !role || !name) {
            return res.status(400).json({
                error: 'Не все обязательные поля заполнены'
            });
        }

        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name
        });

        // Форматируем номер телефона
        const formattedPhone = formatPhoneNumber(phone);

        const userData = {
            email: email,
            role: role,
            name: name,
            phone: formattedPhone,
            createdAt: new Date()
        };

        await admin.firestore().collection('users').doc(userRecord.uid).set(userData);
        await admin.firestore().collection('user_credentials').doc(userRecord.uid).set({
            email: email,
            password: password,
            createdAt: new Date()
        });

        console.log('Пользователь создан успешно:', userRecord.uid);

        res.json({
            uid: userRecord.uid,
            email: email,
            role: role,
            name: name,
            phone: formattedPhone,
            createdAt: new Date()
        });

    } catch (error) {
        console.error('Ошибка создания пользователя:', error);

        if (error.code === 'auth/email-already-exists') {
            res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        } else if (error.code === 'auth/invalid-password') {
            res.status(400).json({ error: 'Пароль слишком слабый' });
        } else if (error.code === 'auth/invalid-email') {
            res.status(400).json({ error: 'Неверный формат email' });
        } else {
            res.status(500).json({ error: 'Ошибка создания пользователя: ' + error.message });
        }
    }
});

// ===== УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ =====
app.delete('/deleteUser/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        if (!uid) {
            return res.status(400).json({
                error: 'UID пользователя не указан'
            });
        }

        await admin.auth().deleteUser(uid);
        console.log('Пользователь удален из Firebase Auth:', uid);

        res.json({
            success: true,
            message: `Пользователь ${uid} успешно удален из Firebase Auth`
        });

    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);

        if (error.code === 'auth/user-not-found') {
            res.status(404).json({ error: 'Пользователь не найден' });
        } else if (error.code === 'auth/invalid-uid') {
            res.status(400).json({ error: 'Неверный UID пользователя' });
        } else {
            res.status(500).json({ error: 'Ошибка удаления пользователя: ' + error.message });
        }
    }
});

// ===== ПРИНУДИТЕЛЬНЫЙ ВЫХОД =====
app.post('/sendForceLogoutNotification', async (req, res) => {
    try {
        const { userId, message, type } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                error: 'Не указаны обязательные параметры: userId, message'
            });
        }

        console.log('Отправка уведомления о принудительном выходе:', { userId, message, type });

        const db = admin.firestore();
        const querySnapshot = await db.collection('push_subscriptions')
            .where('userId', '==', userId)
            .get();

        if (querySnapshot.empty) {
            console.log('Подписки пользователя не найдены:', userId);
            return res.json({
                success: true,
                message: 'Подписки пользователя не найдены',
                sentCount: 0
            });
        }

        let sentCount = 0;
        const errors = [];

        // Отправляем уведомление на все подписки пользователя
        for (const doc of querySnapshot.docs) {
            const subscriptionData = doc.data();

            // Обрабатываем разные структуры подписки
            let subscription;
            if (subscriptionData.subscription) {
                // Структура: { userId, subscription: { endpoint, keys } }
                subscription = subscriptionData.subscription;
            } else {
                // Структура: { endpoint, keys }
                subscription = subscriptionData;
            }

            console.log('Подписка найдена:', {
                id: doc.id,
                userId: subscriptionData.userId,
                hasEndpoint: !!subscription.endpoint,
                hasKeys: !!subscription.keys,
                keysStructure: subscription.keys ? Object.keys(subscription.keys).join(', ') : 'no keys'
            });

            // Проверяем структуру подписки
            if (!subscription.endpoint || !subscription.keys) {
                console.error('Неверная структура подписки:', subscriptionData);
                errors.push({
                    subscriptionId: doc.id,
                    error: 'Неверная структура подписки - отсутствует endpoint или keys'
                });
                continue;
            }

            // Проверяем наличие необходимых ключей
            if (!subscription.keys.p256dh || !subscription.keys.auth) {
                console.error('Отсутствуют необходимые ключи в подписке:', {
                    hasP256dh: !!subscription.keys.p256dh,
                    hasAuth: !!subscription.keys.auth
                });
                errors.push({
                    subscriptionId: doc.id,
                    error: 'Отсутствуют необходимые ключи p256dh или auth'
                });
                continue;
            }

            try {
                const payload = JSON.stringify({
                    title: 'Выход из системы',
                    body: message,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    tag: 'force_logout',
                    data: {
                        type: 'force_logout',
                        userId: userId,
                        timestamp: Date.now()
                    },
                    actions: [
                        {
                            action: 'logout',
                            title: 'Выйти'
                        }
                    ],
                    requireInteraction: true
                });

                console.log('📤 Отправляем уведомление на подписку:', {
                    id: doc.id,
                    endpoint: subscription.endpoint.substring(0, 50) + '...',
                    payloadLength: payload.length
                });

                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.keys.p256dh,
                            auth: subscription.keys.auth
                        }
                    },
                    payload
                );

                sentCount++;
                console.log('✅ Уведомление отправлено на подписку:', doc.id);

            } catch (error) {
                console.error('❌ Ошибка отправки уведомления на подписку:', {
                    id: doc.id,
                    error: error.message,
                    statusCode: error.statusCode,
                    endpoint: subscription.endpoint.substring(0, 50) + '...'
                });
                errors.push({ subscriptionId: doc.id, error: error.message });

                // Если подписка недействительна, удаляем её
                if (error.statusCode === 410) {
                    try {
                        await doc.ref.delete();
                        console.log('🗑️ Удалена недействительная подписка:', doc.id);
                    } catch (deleteError) {
                        console.error('❌ Ошибка удаления недействительной подписки:', deleteError);
                    }
                }
            }
        }

        console.log('Отправка завершена:', { sentCount, errors: errors.length, totalSubscriptions: subscriptions.length });

        res.json({
            success: true,
            message: `Уведомления отправлены`,
            sentCount,
            errors: errors.length
        });

    } catch (error) {
        console.error('Ошибка отправки уведомления о принудительном выходе:', error);
        res.status(500).json({
            error: 'Ошибка отправки уведомления: ' + error.message
        });
    }
});

// ===== ОТПРАВКА ТРЕВОЖНЫХ УВЕДОМЛЕНИЙ =====
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

        lastSendTime.set(target, now);

        // Получаем все подписки
        const db = admin.firestore();
        let querySnapshot;

        if (target === 'users' && userIds && userIds.length > 0) {
            querySnapshot = await db.collection('push_subscriptions')
                .where('userId', 'in', userIds)
                .get();
        } else {
            querySnapshot = await db.collection('push_subscriptions').get();
        }

        if (querySnapshot.empty) {
            return res.json({
                success: true,
                message: 'Подписки не найдены',
                sentCount: 0
            });
        }

        // Получаем список активных пользователей для проверки
        console.log('📋 Получение списка активных пользователей...');
        const usersSnapshot = await db.collection('users').get();
        const activeUserIds = new Set();

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            // Считаем пользователя активным, если он существует в базе
            activeUserIds.add(doc.id);
        });

        console.log(`📊 Найдено активных пользователей: ${activeUserIds.size}`);

        let sentCount = 0;
        const errors = [];

        for (const doc of querySnapshot.docs) {
            const subscriptionData = doc.data();

            // Проверяем, активен ли пользователь подписки
            const userId = subscriptionData.userId;
            if (userId && !activeUserIds.has(userId)) {
                console.log(`⚠️ Пользователь ${userId} не найден в активных пользователях, пропускаем подписку`);
                errors.push({
                    subscriptionId: doc.id,
                    error: 'Пользователь неактивен или удален'
                });
                continue;
            }

            // Обрабатываем разные структуры подписки
            let subscription;
            if (subscriptionData.subscription) {
                // Структура: { userId, subscription: { endpoint, keys } }
                subscription = subscriptionData.subscription;
            } else {
                // Структура: { endpoint, keys }
                subscription = subscriptionData;
            }

            // Проверяем структуру подписки
            if (!subscription.endpoint || !subscription.keys) {
                console.error('Неверная структура подписки:', subscriptionData);
                errors.push({
                    subscriptionId: doc.id,
                    error: 'Неверная структура подписки'
                });
                continue;
            }

            // Проверяем наличие необходимых ключей
            if (!subscription.keys.p256dh || !subscription.keys.auth) {
                console.error('Отсутствуют необходимые ключи в подписке:', doc.id, {
                    hasEndpoint: !!subscription.endpoint,
                    hasKeys: !!subscription.keys,
                    keysStructure: subscription.keys ? Object.keys(subscription.keys).join(', ') : 'no keys'
                });
                errors.push({
                    subscriptionId: doc.id,
                    error: 'Отсутствуют необходимые ключи'
                });
                continue;
            }

            try {
                const payload = JSON.stringify({
                    title: title || 'Тревожное уведомление',
                    body: body || 'Получено тревожное уведомление',
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    tag: 'alarm',
                    data: {
                        type: 'alarm',
                        objectId: req.body.objectId,
                        objectName: req.body.objectName,
                        timestamp: Date.now()
                    },
                    actions: [
                        {
                            action: 'view',
                            title: 'Просмотреть'
                        }
                    ],
                    requireInteraction: true
                });

                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.keys.p256dh,
                            auth: subscription.keys.auth
                        }
                    },
                    payload
                );

                sentCount++;
                console.log('Тревожное уведомление отправлено на подписку:', doc.id);

            } catch (error) {
                console.error('Ошибка отправки тревожного уведомления на подписку:', doc.id, error);
                errors.push({ subscriptionId: doc.id, error: error.message });

                if (error.statusCode === 410) {
                    try {
                        await doc.ref.delete();
                        console.log('Удалена недействительная подписка:', doc.id);
                    } catch (deleteError) {
                        console.error('Ошибка удаления недействительной подписки:', deleteError);
                    }
                }
            }
        }

        res.json({
            success: true,
            message: 'Уведомление отправлено',
            sentCount,
            errorCount: errors.length,
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

// ===== СТАТИСТИКА =====
app.get('/stats', async (req, res) => {
    try {
        const db = admin.firestore();
        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();
        const usersSnapshot = await db.collection('users').get();

        res.json({
            subscriptions: subscriptionsSnapshot.size,
            users: usersSnapshot.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});

// ===== СОХРАНЕНИЕ PUSH-ПОДПИСКИ =====
app.post('/savePushSubscription', async (req, res) => {
    try {
        const { userId, subscription } = req.body;

        if (!userId || !subscription) {
            return res.status(400).json({
                error: 'Не указаны обязательные параметры: userId, subscription'
            });
        }

        const db = admin.firestore();
        await db.collection('push_subscriptions').doc(userId).set({
            userId,
            subscription,
            createdAt: new Date(),
            persistent: true
        });

        console.log('Push-подписка сохранена для пользователя:', userId);

        res.json({
            success: true,
            message: 'Push-подписка успешно сохранена'
        });

    } catch (error) {
        console.error('Ошибка сохранения push-подписки:', error);
        res.status(500).json({
            error: 'Ошибка сохранения push-подписки: ' + error.message
        });
    }
});

// ===== УДАЛЕНИЕ PUSH-ПОДПИСКИ =====
app.post('/removePushSubscription', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                error: 'Не указан userId'
            });
        }

        const db = admin.firestore();
        await db.collection('push_subscriptions').doc(userId).delete();

        console.log('Push-подписка удалена для пользователя:', userId);

        res.json({
            success: true,
            message: 'Push-подписка успешно удалена'
        });

    } catch (error) {
        console.error('Ошибка удаления push-подписки:', error);
        res.status(500).json({
            error: 'Ошибка удаления push-подписки: ' + error.message
        });
    }
});

// ===== CALLDOG WEBHOOK =====
app.post('/callDog/webhook', async (req, res) => {
    try {
        console.log('📞 CallDog webhook получен:', JSON.stringify(req.body, null, 2));

        const { call, ...userParams } = req.body;

        if (!call) {
            console.log('⚠️ Webhook без данных о звонке');
            return res.status(400).json({ error: 'Нет данных о звонке' });
        }

        // Сохраняем информацию о звонке в Firestore
        const callData = {
            phone: call.phone,
            answer: call.answer,
            status: call.status || 'unknown',
            duration: call.duration || 0,
            userParams: userParams,
            receivedAt: new Date(),
            timestamp: new Date()
        };

        // Сохраняем в коллекцию callDog_logs
        await admin.firestore().collection('callDog_logs').add(callData);

        console.log('✅ CallDog webhook сохранен в Firestore');

        // Отправляем push-уведомление администратору о результате звонка
        if (call.answer) {
            const notificationPayload = {
                title: '📞 Результат тревожного вызова',
                body: `Номер ${call.phone}: ${call.answer === '1' ? 'Подтвердил тревогу' : 'Нажал ' + call.answer}`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                data: {
                    type: 'callDog_result',
                    phone: call.phone,
                    answer: call.answer,
                    url: '/admin'
                }
            };

            // Получаем все push-подписки администраторов
            const adminSubscriptions = await admin.firestore()
                .collection('push_subscriptions')
                .where('userRole', '==', 'admin')
                .get();

            const pushPromises = [];
            adminSubscriptions.forEach(doc => {
                const subscription = doc.data();
                if (subscription.subscription) {
                    pushPromises.push(
                        webpush.sendNotification(subscription.subscription, JSON.stringify(notificationPayload))
                            .catch(err => console.error('Ошибка отправки push:', err))
                    );
                }
            });

            await Promise.all(pushPromises);
            console.log('📱 Push-уведомления отправлены администраторам');
        }

        res.json({ success: true, message: 'Webhook обработан' });

    } catch (error) {
        console.error('❌ Ошибка обработки CallDog webhook:', error);
        res.status(500).json({ error: 'Ошибка обработки webhook' });
    }
});

// ===== ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
    console.log(`🚀 Исправленный объединенный сервер запущен на порту ${PORT}`);
    console.log(`📊 Статус: http://localhost:${PORT}/status`);
    console.log(`📈 Статистика: http://localhost:${PORT}/stats`);
});

module.exports = app; 