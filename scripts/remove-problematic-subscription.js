/**
 * @file: remove-problematic-subscription.js
 * @description: Удаление проблемной подписки куратора
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

async function removeProblematicSubscription() {
    try {
        console.log('🗑️ Удаление проблемной подписки куратора...\n');

        const db = admin.firestore();

        // ID проблемной подписки куратора
        const problematicSubscriptionId = '6on3OFPyMSNWjZJX4Cm8WtSh77P2';

        try {
            await db.collection('push_subscriptions').doc(problematicSubscriptionId).delete();
            console.log(`✅ Подписка ${problematicSubscriptionId} удалена`);
        } catch (error) {
            console.log(`❌ Ошибка удаления подписки: ${error.message}`);
        }

        // Проверяем оставшиеся подписки
        const remainingSubscriptions = await db.collection('push_subscriptions').get();
        console.log(`\n📊 Оставшиеся подписки: ${remainingSubscriptions.size}`);

        for (const doc of remainingSubscriptions.docs) {
            const subscriptionData = doc.data();
            console.log(`   - ${doc.id}: ${subscriptionData.userId}`);
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        process.exit(0);
    }
}

removeProblematicSubscription(); 