/**
 * @file: force-logout-notification.js
 * @description: Cloud Function для отправки уведомления о принудительном выходе
 * @dependencies: firebase-admin, express, web-push
 * @created: 2025-07-23
 */

const admin = require('firebase-admin');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
// Удаляем неправильные импорты, используем admin.firestore() напрямую

// Инициализация Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Настройка web-push
webpush.setVapidDetails(
    'mailto:admin@vityaz-security.ru',
    process.env.VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY',
    process.env.VAPID_PRIVATE_KEY || 'YOUR_VAPID_PRIVATE_KEY'
);

const app = express();
app.use(cors());
app.use(express.json());

// Функция отправки уведомления о принудительном выходе
app.post('/sendForceLogoutNotification', async (req, res) => {
    try {
        const { userId, message, type } = req.body;

        // Валидация входных данных
        if (!userId || !message) {
            return res.status(400).json({
                error: 'Не указаны обязательные параметры: userId, message'
            });
        }

        console.log('Отправка уведомления о принудительном выходе:', { userId, message, type });

        // Получаем подписки пользователя
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
            const subscription = doc.data();

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
                console.log('Уведомление отправлено на подписку:', doc.id);

            } catch (error) {
                console.error('Ошибка отправки уведомления на подписку:', doc.id, error);
                errors.push({ subscriptionId: doc.id, error: error.message });

                // Если подписка недействительна, удаляем её
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

        console.log('Отправка завершена:', { sentCount, errors: errors.length });

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

// Запуск сервера
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`Сервер уведомлений о принудительном выходе запущен на порту ${PORT}`);
});

module.exports = app; 