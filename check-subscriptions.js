const admin = require('firebase-admin');

// Инициализация Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkSubscriptions() {
    console.log('🔍 Проверяем подписки в базе данных...');

    try {
        const subscriptionsRef = db.collection('push_subscriptions');
        const snapshot = await subscriptionsRef.get();

        console.log(`📊 Найдено подписок: ${snapshot.size}`);

        if (snapshot.empty) {
            console.log('❌ Подписки не найдены');
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\n📋 Подписка ID: ${doc.id}`);
            console.log(`👤 Пользователь: ${data.userId}`);
            console.log(`🔗 Endpoint: ${data.subscription?.endpoint?.substring(0, 50)}...`);
            console.log(`📅 Создана: ${data.createdAt?.toDate?.() || data.createdAt}`);
            console.log(`💾 Персистентная: ${data.persistent || false}`);
        });

    } catch (error) {
        console.error('❌ Ошибка при проверке подписок:', error);
    }
}

checkSubscriptions(); 