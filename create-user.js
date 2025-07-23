/**
 * @file: create-user.js
 * @description: Cloud Function для создания пользователей без входа в систему
 * @dependencies: firebase-admin, express
 * @created: 2025-07-23
 */

const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Инициализация Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// Функция создания пользователя
app.post('/createUser', async (req, res) => {
    try {
        const { email, password, role, name } = req.body;

        // Валидация входных данных
        if (!email || !password || !role || !name) {
            return res.status(400).json({
                error: 'Не все обязательные поля заполнены'
            });
        }

        // Создаем пользователя через Firebase Admin SDK
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name
        });

        // Создаем запись в Firestore
        const userData = {
            email: email,
            role: role,
            name: name,
            createdAt: new Date()
        };

        await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

        // Сохраняем учетные данные в отдельную коллекцию
        await admin.firestore().collection('user_credentials').doc(userRecord.uid).set({
            email: email,
            password: password,
            createdAt: new Date()
        });

        console.log('Пользователь создан успешно:', userRecord.uid);

        res.json({
            uid: userRecord.uid,
            email: email,
            role: role,
            name: name,
            createdAt: new Date()
        });

    } catch (error) {
        console.error('Ошибка создания пользователя:', error);

        if (error.code === 'auth/email-already-exists') {
            res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        } else if (error.code === 'auth/invalid-password') {
            res.status(400).json({ error: 'Пароль слишком слабый' });
        } else if (error.code === 'auth/invalid-email') {
            res.status(400).json({ error: 'Неверный формат email' });
        } else {
            res.status(500).json({ error: 'Ошибка создания пользователя: ' + error.message });
        }
    }
});

// Запуск сервера
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Сервер создания пользователей запущен на порту ${PORT}`);
});

module.exports = app; 