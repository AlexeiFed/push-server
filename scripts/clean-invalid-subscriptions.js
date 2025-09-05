/**
 * @file: clean-invalid-subscriptions.js
 * @description: Очистка невалидных push-подписок
 * @dependencies: firebase-admin, dotenv
 * @created: 2025-07-24
 */

require('dotenv').config();
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

async function cleanInvalidSubscriptions() {
    try {
        console.log('🧹 Очистка невалидных push-подписок...\n');

        const db = admin.firestore();

        // Получаем все подписки
        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();

        if (subscriptionsSnapshot.empty) {
            console.log('❌ Подписки не найдены');
            return;
        }

        console.log(`📊 Найдено подписок: ${subscriptionsSnapshot.size}\n`);

        let validSubscriptions = 0;
        let deletedSubscriptions = 0;
        const deletedIds = [];

        for (const doc of subscriptionsSnapshot.docs) {
            const subscriptionData = doc.data();
            console.log(`\n📋 Проверка подписки ID: ${doc.id}`);
            console.log(`   Пользователь: ${subscriptionData.userId || 'Не указан'}`);

            // Проверяем, существует ли пользователь
            if (subscriptionData.userId) {
                try {
                    const userDoc = await db.collection('users').doc(subscriptionData.userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        console.log(`   ✅ Пользователь активен: ${userData.name} (${userData.role})`);
                        validSubscriptions++;
                    } else {
                        console.log(`   ❌ Пользователь не найден в базе - УДАЛЯЕМ`);
                        await doc.ref.delete();
                        deletedSubscriptions++;
                        deletedIds.push(doc.id);
                    }
                } catch (error) {
                    console.log(`   ❌ Ошибка проверки пользователя: ${error.message} - УДАЛЯЕМ`);
                    await doc.ref.delete();
                    deletedSubscriptions++;
                    deletedIds.push(doc.id);
                }
            } else {
                console.log(`   ⚠️ Пользователь не указан - УДАЛЯЕМ`);
                await doc.ref.delete();
                deletedSubscriptions++;
                deletedIds.push(doc.id);
            }
        }

        console.log('\n📊 РЕЗУЛЬТАТЫ ОЧИСТКИ:');
        console.log(`   Всего подписок: ${subscriptionsSnapshot.size}`);
        console.log(`   Валидных: ${validSubscriptions}`);
        console.log(`   Удалено: ${deletedSubscriptions}`);

        if (deletedIds.length > 0) {
            console.log('\n🗑️ УДАЛЕННЫЕ ПОДПИСКИ:');
            deletedIds.forEach((id, index) => {
                console.log(`   ${index + 1}. ${id}`);
            });
        }

        console.log('\n✅ Очистка завершена!');

    } catch (error) {
        console.error('❌ Ошибка очистки:', error);
    } finally {
        process.exit(0);
    }
}

cleanInvalidSubscriptions(); 