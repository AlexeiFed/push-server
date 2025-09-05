/**
 * @file: diagnose-subscriptions.js
 * @description: Диагностика push-подписок для выявления проблем
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

async function diagnoseSubscriptions() {
    try {
        console.log('🔍 Диагностика push-подписок...\n');

        const db = admin.firestore();

        // Получаем все подписки
        const subscriptionsSnapshot = await db.collection('push_subscriptions').get();

        if (subscriptionsSnapshot.empty) {
            console.log('❌ Подписки не найдены');
            return;
        }

        console.log(`📊 Найдено подписок: ${subscriptionsSnapshot.size}\n`);

        let validSubscriptions = 0;
        let invalidSubscriptions = 0;
        const issues = [];

        for (const doc of subscriptionsSnapshot.docs) {
            const subscriptionData = doc.data();
            console.log(`\n📋 Подписка ID: ${doc.id}`);
            console.log(`   Пользователь: ${subscriptionData.userId || 'Не указан'}`);

            // Проверяем структуру подписки
            let subscription;
            if (subscriptionData.subscription) {
                subscription = subscriptionData.subscription;
                console.log(`   Структура: { userId, subscription }`);
            } else {
                subscription = subscriptionData;
                console.log(`   Структура: { endpoint, keys }`);
            }

            // Проверяем наличие endpoint
            if (!subscription.endpoint) {
                console.log(`   ❌ Отсутствует endpoint`);
                issues.push({
                    id: doc.id,
                    issue: 'Отсутствует endpoint',
                    userId: subscriptionData.userId
                });
                invalidSubscriptions++;
                continue;
            }

            console.log(`   ✅ Endpoint: ${subscription.endpoint.substring(0, 50)}...`);

            // Проверяем наличие keys
            if (!subscription.keys) {
                console.log(`   ❌ Отсутствуют keys`);
                issues.push({
                    id: doc.id,
                    issue: 'Отсутствуют keys',
                    userId: subscriptionData.userId
                });
                invalidSubscriptions++;
                continue;
            }

            // Проверяем p256dh ключ
            if (!subscription.keys.p256dh) {
                console.log(`   ❌ Отсутствует p256dh ключ`);
                issues.push({
                    id: doc.id,
                    issue: 'Отсутствует p256dh ключ',
                    userId: subscriptionData.userId
                });
                invalidSubscriptions++;
                continue;
            }

            // Проверяем auth ключ
            if (!subscription.keys.auth) {
                console.log(`   ❌ Отсутствует auth ключ`);
                issues.push({
                    id: doc.id,
                    issue: 'Отсутствует auth ключ',
                    userId: subscriptionData.userId
                });
                invalidSubscriptions++;
                continue;
            }

            console.log(`   ✅ Keys: p256dh и auth присутствуют`);

            // Проверяем, существует ли пользователь
            if (subscriptionData.userId) {
                try {
                    const userDoc = await db.collection('users').doc(subscriptionData.userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        console.log(`   ✅ Пользователь активен: ${userData.name} (${userData.role})`);
                    } else {
                        console.log(`   ❌ Пользователь не найден в базе`);
                        issues.push({
                            id: doc.id,
                            issue: 'Пользователь не найден в базе',
                            userId: subscriptionData.userId
                        });
                        invalidSubscriptions++;
                        continue;
                    }
                } catch (error) {
                    console.log(`   ❌ Ошибка проверки пользователя: ${error.message}`);
                    issues.push({
                        id: doc.id,
                        issue: `Ошибка проверки пользователя: ${error.message}`,
                        userId: subscriptionData.userId
                    });
                    invalidSubscriptions++;
                    continue;
                }
            } else {
                console.log(`   ⚠️ Пользователь не указан`);
            }

            validSubscriptions++;
        }

        console.log('\n📊 РЕЗУЛЬТАТЫ ДИАГНОСТИКИ:');
        console.log(`   Всего подписок: ${subscriptionsSnapshot.size}`);
        console.log(`   Валидных: ${validSubscriptions}`);
        console.log(`   Невалидных: ${invalidSubscriptions}`);

        if (issues.length > 0) {
            console.log('\n❌ ПРОБЛЕМЫ:');
            issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ID: ${issue.id}, Пользователь: ${issue.userId}, Проблема: ${issue.issue}`);
            });
        }

        // Рекомендации
        console.log('\n💡 РЕКОМЕНДАЦИИ:');
        if (invalidSubscriptions > 0) {
            console.log(`   - Удалите ${invalidSubscriptions} невалидных подписок`);
            console.log(`   - Попросите пользователей переподписаться на уведомления`);
        }
        if (validSubscriptions === 0) {
            console.log(`   - Нет валидных подписок. Проверьте процесс подписки пользователей`);
        }

    } catch (error) {
        console.error('❌ Ошибка диагностики:', error);
    } finally {
        process.exit(0);
    }
}

diagnoseSubscriptions(); 