const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');

// Регистрация
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Проверка существования пользователя
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }

        // Валидация роли
        if (role && !['student', 'teacher'].includes(role)) {
            return res.status(400).json({ message: 'Недопустимая роль пользователя' });
        }

        // Создание нового пользователя
        user = new User({
            email,
            password,
            name,
            role: role || 'student'
        });

        await user.save();

        // Создание JWT токена
        const token = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Ошибка валидации',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Вход
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Поиск пользователя
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Неверные учетные данные' });
        }

        // Проверка пароля
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверные учетные данные' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение текущего пользователя
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('enrolledCourses')
            .populate('createdCourses');
        
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(user);
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 