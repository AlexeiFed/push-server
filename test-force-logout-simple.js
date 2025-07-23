/**
 * @file: test-force-logout-simple.js
 * @description: Простой тест отправки force_logout уведомлений
 * @usage: node test-force-logout-simple.js
 */

const fetch = require('node-fetch');

// URL push-сервера
const PUSH_SERVER_URL = 'https://push-server-b8p6.onrender.com';

// ID пользователя для тестирования (замените на реальный ID)
const TEST_USER_ID = '6on3OFPyMSNWjZJX4Cm8WtSh77P2'; // ID из базы данных (с буквой O)

async function testForceLogout() {
    console.log('🧪 Тестируем отправку force_logout уведомления...');
    console.log('👤 Тестовый пользователь:', TEST_USER_ID);

    try {
        const response = await fetch(`${PUSH_SERVER_URL}/sendForceLogoutNotification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: TEST_USER_ID,
                message: 'Тестовое уведомление о принудительном выходе',
                type: 'force_logout'
            })
        });

        const result = await response.json();

        console.log('📊 Результат отправки:');
        console.log('Status:', response.status);
        console.log('Response:', result);

        if (response.ok) {
            console.log('✅ Уведомление отправлено успешно!');
            console.log('📱 Проверьте приложение - должен произойти автоматический выход');
        } else {
            console.log('❌ Ошибка отправки уведомления');
        }

    } catch (error) {
        console.error('❌ Ошибка при отправке уведомления:', error);
    }
}

// Запускаем тест
testForceLogout(); 