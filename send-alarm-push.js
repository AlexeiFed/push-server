const webpush = require('web-push');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Инициализация Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// VAPID ключи (должны точно соответствовать тем, что используются в PWA)
const VAPID_PUBLIC_KEY = 'BPtABepktG0gcckjqEzxjRoFEubhuujI9jvNE9hRIrJmw6W9wpvJitFCqMkbdvde_Xokh98oJIs6RDkQ4-SKU_A';
const VAPID_PRIVATE_KEY = '5Ayim_hP-yVT6C2kkx6Ei8GT7PZLQH-ShuRvDPv30CY';

console.log('🔑 VAPID Public Key:', VAPID_PUBLIC_KEY);
console.log('🔑 VAPID Private Key:', VAPID_PRIVATE_KEY.substring(0, 10) + '...');

// Настройка VAPID
webpush.setVapidDetails(
    'mailto:23alex08@mail.ru',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

async function sendAlarmPushToAll(customTitle, customBody, objectId, objectName) {
    try {
        console.log('📡 Отправляем тревожное уведомление через Web Push API...');

        // Получаем все подписки из Firestore
        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();

        if (subscriptionsSnapshot.empty) {
            console.log('❌ Подписки не найдены в коллекции push_subscriptions');
            return;
        }

        console.log(`📋 Найдено ${subscriptionsSnapshot.size} подписок`);

        const promises = subscriptionsSnapshot.docs.map(async (doc) => {
            const subscriptionData = doc.data();
            console.log(`📤 Отправляем уведомление подписке: ${doc.id}`);
            console.log(`📋 Данные подписки:`, JSON.stringify(subscriptionData, null, 2));

            // Проверяем структуру подписки
            let subscription;
            if (subscriptionData.subscription) {
                // Если подписка в поле subscription
                subscription = subscriptionData.subscription;
            } else if (subscriptionData.endpoint) {
                // Если подписка напрямую в документе
                subscription = subscriptionData;
            } else {
                console.error(`❌ Неверная структура подписки ${doc.id}:`, subscriptionData);
                return { success: false, id: doc.id, error: 'Invalid subscription structure' };
            }

            // Проверяем наличие endpoint
            if (!subscription.endpoint) {
                console.error(`❌ Подписка ${doc.id} не содержит endpoint`);
                return { success: false, id: doc.id, error: 'Missing endpoint' };
            }

            try {
                // Обычное уведомление с data для корректной работы в фоне
                const payload = JSON.stringify({
                    title: customTitle || '🚨 ТРЕВОГА!',
                    body: customBody || 'Обнаружена угроза безопасности! Требуется немедленное внимание.',
                    icon: '/icons/logo-vityaz.png',
                    badge: '/icons/logo-vityaz.png',
                    tag: 'alarm',
                    requireInteraction: true,
                    data: {
                        url: objectId ? `/alarm/${objectId}` : '/alarm',
                        type: 'alarm',
                        timestamp: Date.now().toString(),
                        objectId: objectId || null,
                        objectName: objectName || null,
                        sound: '/sounds/alarm-siren.mp3',
                        vibration: '1000,500,1000,500,1000,500,1000,500,1000'
                    }
                });

                const result = await webpush.sendNotification(subscription, payload);
                console.log(`✅ Уведомление отправлено: ${doc.id}`);
                return { success: true, id: doc.id };

            } catch (error) {
                console.error(`❌ Ошибка отправки уведомления ${doc.id}:`, error.message);

                // Если подписка недействительна, удаляем её
                if (error.statusCode === 410) {
                    console.log(`🗑️ Удаляем недействительную подписку: ${doc.id}`);
                    await doc.ref.delete();
                }

                return { success: false, id: doc.id, error: error.message };
            }
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        console.log(`\n📊 Результаты отправки:`);
        console.log(`✅ Успешно: ${successCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);

    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
    }
}

async function sendAlarmPushToUsers(userIds, customTitle, customBody, objectId, objectName) {
    try {
        console.log('📡 Отправляем тревожное уведомление конкретным пользователям...');
        console.log('🎯 Целевые пользователи:', userIds);

        // Получаем подписки из коллекции push_subscriptions
        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();

        if (subscriptionsSnapshot.empty) {
            console.log('❌ Подписки не найдены в коллекции push_subscriptions');
            return { sentCount: 0, errorCount: 0 };
        }

        console.log(`📋 Найдено ${subscriptionsSnapshot.size} подписок в коллекции`);

        // Создаем список ID пользователей с подписками
        const usersWithSubscriptions = subscriptionsSnapshot.docs.map(doc => doc.id);
        console.log('👥 Пользователи с подписками:', usersWithSubscriptions);

        // Проверяем, какие целевые пользователи имеют подписки
        const targetUsersWithSubscriptions = userIds.filter(uid => usersWithSubscriptions.includes(uid));
        console.log('🎯 Целевые пользователи с подписками:', targetUsersWithSubscriptions);

        if (targetUsersWithSubscriptions.length === 0) {
            console.log('❌ Ни один из целевых пользователей не имеет подписки');
            return { sentCount: 0, errorCount: 0 };
        }

        const promises = subscriptionsSnapshot.docs.map(async (doc) => {
            const subscriptionData = doc.data();
            const subscriptionUserId = doc.id; // ID пользователя = ID документа

            // Проверяем, что пользователь в списке целевых
            if (userIds && !userIds.includes(subscriptionUserId)) {
                console.log(`⏭️ Пропускаем пользователя ${subscriptionUserId} (не в целевой группе)`);
                return { success: false, user: subscriptionUserId, error: 'User not in target list' };
            }

            console.log(`📤 Отправляем уведомление пользователю: ${subscriptionUserId}`);

            // Проверяем структуру подписки
            let subscription;
            if (subscriptionData.subscription) {
                subscription = subscriptionData.subscription;
            } else if (subscriptionData.endpoint) {
                subscription = subscriptionData;
            } else {
                console.error(`❌ Неверная структура подписки ${subscriptionUserId}:`, subscriptionData);
                return { success: false, user: subscriptionUserId, error: 'Invalid subscription structure' };
            }

            // Проверяем наличие endpoint
            if (!subscription.endpoint) {
                console.error(`❌ Подписка ${subscriptionUserId} не содержит endpoint`);
                return { success: false, user: subscriptionUserId, error: 'Missing endpoint' };
            }

            try {
                // Обычное уведомление с data для корректной работы в фоне
                const payload = JSON.stringify({
                    title: customTitle || '🚨 ТРЕВОГА!',
                    body: customBody || `Обнаружена угроза безопасности! Требуется немедленное внимание.`,
                    icon: '/icons/logo-vityaz.png',
                    badge: '/icons/logo-vityaz.png',
                    tag: 'alarm',
                    requireInteraction: true,
                    data: {
                        url: objectId ? `/alarm/${objectId}` : '/alarm',
                        type: 'alarm',
                        timestamp: Date.now().toString(),
                        user: subscriptionUserId,
                        objectId: objectId || null,
                        objectName: objectName || null,
                        sound: '/sounds/alarm-siren.mp3',
                        vibration: '1000,500,1000,500,1000,500,1000,500,1000'
                    }
                });

                const result = await webpush.sendNotification(subscription, payload);
                console.log(`✅ Уведомление отправлено пользователю: ${subscriptionUserId}`);
                return { success: true, user: subscriptionUserId };

            } catch (error) {
                console.error(`❌ Ошибка отправки пользователю ${subscriptionUserId}:`, error.message);

                // Если подписка недействительна, удаляем её
                if (error.statusCode === 410) {
                    console.log(`🗑️ Удаляем недействительную подписку: ${subscriptionUserId}`);
                    await doc.ref.delete();
                }

                return { success: false, user: subscriptionUserId, error: error.message };
            }
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        console.log(`\n📊 Результаты отправки пользователям:`);
        console.log(`✅ Успешно: ${successCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);

        return { sentCount: successCount, errorCount };

    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
        return { sentCount: 0, errorCount: 1 };
    }
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2);
if (args.includes('--users')) {
    sendAlarmPushToUsers();
} else {
    sendAlarmPushToAll();
}

// Экспорт функций для использования в server.js
module.exports = {
    sendAlarmPushToAll,
    sendAlarmPushToUsers
};