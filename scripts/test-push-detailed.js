/**
 * @file: test-push-detailed.js
 * @description: Детальный тест push-уведомлений с подробной диагностикой
 * @dependencies: firebase-admin, web-push, dotenv
 * @created: 2025-07-24
 */

require('dotenv').config();
const admin = require('firebase-admin');
const webpush = require('web-push');

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

async function testPushDetailed() {
    try {
        console.log('🧪 Детальный тест push-уведомлений...\n');

        const db = admin.firestore();

        // Получаем все подписки
        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();

        if (subscriptionsSnapshot.empty) {
            console.log('❌ Подписки не найдены');
            return;
        }

        console.log(`📊 Найдено подписок: ${subscriptionsSnapshot.size}\n`);

        let successCount = 0;
        let errorCount = 0;
        const results = [];

        for (const doc of subscriptionsSnapshot.docs) {
            const subscriptionData = doc.data();
            console.log(`\n📋 Тестирование подписки ID: ${doc.id}`);
            console.log(`   Пользователь: ${subscriptionData.userId || 'Не указан'}`);

            // Получаем данные пользователя
            let userName = 'Неизвестный';
            let userRole = 'Неизвестно';

            if (subscriptionData.userId) {
                try {
                    const userDoc = await db.collection('users').doc(subscriptionData.userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        userName = userData.name;
                        userRole = userData.role;
                        console.log(`   Пользователь: ${userName} (${userRole})`);
                    }
                } catch (error) {
                    console.log(`   ❌ Ошибка получения данных пользователя: ${error.message}`);
                }
            }

            // Обрабатываем разные структуры подписки
            let subscription;
            if (subscriptionData.subscription) {
                subscription = subscriptionData.subscription;
                console.log(`   Структура: { userId, subscription }`);
            } else {
                subscription = subscriptionData;
                console.log(`   Структура: { endpoint, keys }`);
            }

            // Проверяем структуру подписки
            if (!subscription.endpoint || !subscription.keys) {
                console.log(`   ❌ Неверная структура подписки`);
                errorCount++;
                results.push({
                    id: doc.id,
                    userName,
                    userRole,
                    status: 'error',
                    error: 'Неверная структура подписки'
                });
                continue;
            }

            // Проверяем ключи
            if (!subscription.keys.p256dh || !subscription.keys.auth) {
                console.log(`   ❌ Отсутствуют необходимые ключи`);
                errorCount++;
                results.push({
                    id: doc.id,
                    userName,
                    userRole,
                    status: 'error',
                    error: 'Отсутствуют необходимые ключи'
                });
                continue;
            }

            console.log(`   ✅ Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
            console.log(`   ✅ Keys: p256dh и auth присутствуют`);

            try {
                const payload = JSON.stringify({
                    title: 'Тест push-уведомлений',
                    body: `Тестовое уведомление для ${userName} (${userRole})`,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    tag: 'test',
                    data: {
                        type: 'test',
                        userId: subscriptionData.userId,
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

                console.log(`   📤 Отправка уведомления...`);

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

                console.log(`   ✅ Уведомление отправлено успешно`);
                successCount++;
                results.push({
                    id: doc.id,
                    userName,
                    userRole,
                    status: 'success'
                });

            } catch (error) {
                console.log(`   ❌ Ошибка отправки: ${error.message}`);
                if (error.statusCode) {
                    console.log(`   📊 HTTP статус: ${error.statusCode}`);
                }

                errorCount++;
                results.push({
                    id: doc.id,
                    userName,
                    userRole,
                    status: 'error',
                    error: error.message,
                    statusCode: error.statusCode
                });

                // Если подписка недействительна, удаляем её
                if (error.statusCode === 410) {
                    try {
                        await doc.ref.delete();
                        console.log(`   🗑️ Удалена недействительная подписка`);
                    } catch (deleteError) {
                        console.log(`   ❌ Ошибка удаления подписки: ${deleteError.message}`);
                    }
                }
            }
        }

        console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:');
        console.log(`   Всего подписок: ${subscriptionsSnapshot.size}`);
        console.log(`   Успешно: ${successCount}`);
        console.log(`   Ошибок: ${errorCount}`);

        console.log('\n📋 ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ:');
        results.forEach((result, index) => {
            const statusIcon = result.status === 'success' ? '✅' : '❌';
            console.log(`   ${index + 1}. ${statusIcon} ${result.userName} (${result.userRole})`);
            if (result.status === 'error') {
                console.log(`      Ошибка: ${result.error}`);
                if (result.statusCode) {
                    console.log(`      HTTP статус: ${result.statusCode}`);
                }
            }
        });

        // Рекомендации
        console.log('\n💡 РЕКОМЕНДАЦИИ:');
        if (errorCount > 0) {
            console.log(`   - ${errorCount} подписок имеют проблемы`);
            console.log(`   - Проверьте логи браузера пользователей`);
            console.log(`   - Попросите пользователей переподписаться на уведомления`);
        }
        if (successCount === 0) {
            console.log(`   - Нет работающих подписок. Проверьте VAPID ключи`);
        }

    } catch (error) {
        console.error('❌ Ошибка тестирования:', error);
    } finally {
        process.exit(0);
    }
}

testPushDetailed(); 