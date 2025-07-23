const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Инициализация Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function cleanSubscriptions() {
    try {
        console.log('🧹 Начинаем очистку подписок...');

        // Получаем все подписки
        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();

        if (subscriptionsSnapshot.empty) {
            console.log('📋 Подписки не найдены');
            return;
        }

        console.log(`📋 Найдено ${subscriptionsSnapshot.size} подписок`);

        let validCount = 0;
        let invalidCount = 0;

        for (const doc of subscriptionsSnapshot.docs) {
            const subscriptionData = doc.data();
            console.log(`\n🔍 Проверяем подписку: ${doc.id}`);
            console.log(`📋 Данные:`, JSON.stringify(subscriptionData, null, 2));

            // Проверяем структуру
            let subscription;
            if (subscriptionData.subscription) {
                subscription = subscriptionData.subscription;
            } else if (subscriptionData.endpoint) {
                subscription = subscriptionData;
            } else {
                console.log(`❌ Неверная структура - удаляем`);
                await doc.ref.delete();
                invalidCount++;
                continue;
            }

            // Проверяем наличие endpoint
            if (!subscription.endpoint) {
                console.log(`❌ Нет endpoint - удаляем`);
                await doc.ref.delete();
                invalidCount++;
                continue;
            }

            // Проверяем формат endpoint
            if (!subscription.endpoint.startsWith('https://')) {
                console.log(`❌ Неверный формат endpoint - удаляем`);
                await doc.ref.delete();
                invalidCount++;
                continue;
            }

            console.log(`✅ Подписка валидна`);
            validCount++;
        }

        console.log(`\n📊 Результаты очистки:`);
        console.log(`✅ Валидных подписок: ${validCount}`);
        console.log(`🗑️ Удалено невалидных: ${invalidCount}`);

    } catch (error) {
        console.error('💥 Ошибка очистки:', error);
    }
}

// Запуск
cleanSubscriptions().then(() => {
    console.log('✅ Очистка завершена');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
}); 