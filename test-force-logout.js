const fetch = require('node-fetch');

async function testForceLogout() {
    const userId = 'QzUeaKaBeXUgvEqHYGfolUCYjew1'; // ID пользователя для тестирования
    const message = 'Тестовое уведомление о принудительном выходе';

    console.log('🧪 Тестируем отправку уведомления о принудительном выходе...');
    console.log('👤 Пользователь:', userId);
    console.log('📝 Сообщение:', message);

    try {
        const response = await fetch('https://push-server-b8p6.onrender.com/sendForceLogoutNotification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                message: message
            })
        });

        const result = await response.json();

        console.log('📡 Ответ сервера:', result);

        if (response.ok) {
            console.log('✅ Уведомление отправлено успешно');
            console.log('📊 Статистика:', {
                sentCount: result.sentCount,
                errors: result.errors
            });
        } else {
            console.log('❌ Ошибка отправки:', result.error);
        }

    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
    }
}

// Запускаем тест
testForceLogout(); 