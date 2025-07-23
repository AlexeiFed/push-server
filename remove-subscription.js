const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Инициализация Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function removeUserSubscription(userId) {
    try {
        console.log(`🗑️ Удаляем подписку для пользователя: ${userId}`);

        // Получаем все подписки пользователя
        const subscriptionsSnapshot = await db.collection('push_subscriptions')
            .where('userId', '==', userId)
            .get();

        if (subscriptionsSnapshot.empty) {
            console.log(`📋 Подписки для пользователя ${userId} не найдены`);
            return { success: true, message: 'Подписки не найдены' };
        }

        console.log(`📋 Найдено ${subscriptionsSnapshot.size} подписок для удаления`);

        // Удаляем все подписки пользователя
        const deletePromises = subscriptionsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        console.log(`✅ Удалено ${subscriptionsSnapshot.size} подписок для пользователя ${userId}`);

        return {
            success: true,
            message: `Удалено ${subscriptionsSnapshot.size} подписок`,
            deletedCount: subscriptionsSnapshot.size
        };

    } catch (error) {
        console.error('💥 Ошибка удаления подписки:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Экспорт для использования в Cloud Functions
module.exports = { removeUserSubscription };

// Если запускается напрямую
if (require.main === module) {
    const userId = process.argv[2];
    if (!userId) {
        console.error('❌ Укажите userId как аргумент');
        process.exit(1);
    }

    removeUserSubscription(userId).then((result) => {
        console.log('📊 Результат:', result);
        process.exit(result.success ? 0 : 1);
    }).catch((error) => {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    });
} 