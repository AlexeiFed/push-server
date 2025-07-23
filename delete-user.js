/**
 * @file: delete-user.js
 * @description: Cloud Function для удаления пользователей из Firebase Auth
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

// Функция удаления пользователя
app.delete('/deleteUser/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        // Валидация входных данных
        if (!uid) {
            return res.status(400).json({
                error: 'UID пользователя не указан'
            });
        }

        // Удаляем пользователя из Firebase Auth
        await admin.auth().deleteUser(uid);
        console.log('Пользователь удален из Firebase Auth:', uid);

        res.json({
            success: true,
            message: `Пользователь ${uid} успешно удален из Firebase Auth`
        });

    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);

        if (error.code === 'auth/user-not-found') {
            res.status(404).json({ error: 'Пользователь не найден' });
        } else if (error.code === 'auth/invalid-uid') {
            res.status(400).json({ error: 'Неверный UID пользователя' });
        } else {
            res.status(500).json({ error: 'Ошибка удаления пользователя: ' + error.message });
        }
    }
});

// Запуск сервера
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`Сервер удаления пользователей запущен на порту ${PORT}`);
});

module.exports = app; 