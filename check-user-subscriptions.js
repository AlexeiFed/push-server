/**
 * @file: check-user-subscriptions.js
 * @description: Проверка подписок конкретного пользователя
 * @usage: node check-user-subscriptions.js
 */

const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ID пользователя для проверки
const TEST_USER_ID = '6on3OFPyMSNWjZJX4Cm8WtSh77P2';

async function checkUserSubscriptions() {
    console.log('🔍 Проверяем подписки пользователя:', TEST_USER_ID);

    try {
        // Получаем все подписки пользователя
        const querySnapshot = await db.collection('push_subscriptions')
            .where('userId', '==', TEST_USER_ID)
            .get();

        console.log('📊 Найдено подписок:', querySnapshot.size);

        if (querySnapshot.empty) {
            console.log('❌ Подписки не найдены');

            // Проверим все подписки в коллекции
            console.log('🔍 Проверяем все подписки в коллекции...');
            const allSubscriptions = await db.collection('push_subscriptions').get();
            console.log('📊 Всего подписок в коллекции:', allSubscriptions.size);

            allSubscriptions.forEach(doc => {
                const data = doc.data();
                console.log('📄 Документ:', doc.id, 'userId:', data.userId);
            });

            return;
        }

        // Выводим детали каждой подписки
        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log('\n📄 Подписка ID:', doc.id);
            console.log('👤 User ID:', data.userId);
            console.log('📅 Created At:', data.createdAt?.toDate());
            console.log('🔄 Restored:', data.restored);

            if (data.subscription) {
                console.log('🔗 Endpoint:', data.subscription.endpoint?.substring(0, 50) + '...');
                console.log('🔑 Keys:', {
                    auth: data.subscription.keys?.auth ? 'present' : 'missing',
                    p256dh: data.subscription.keys?.p256dh ? 'present' : 'missing'
                });
            } else {
                console.log('❌ Структура subscription отсутствует');
                console.log('📋 Данные:', JSON.stringify(data, null, 2));
            }
        });

    } catch (error) {
        console.error('❌ Ошибка при проверке подписок:', error);
    }
}

// Запускаем проверку
checkUserSubscriptions().then(() => {
    console.log('✅ Проверка завершена');
    process.exit(0);
}).catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
}); 