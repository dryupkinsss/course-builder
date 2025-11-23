const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    console.log('Auth middleware - Начало обработки запроса');
    console.log('Headers:', req.headers);
    
    try {
        // Получение токена из заголовка
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Token:', token ? 'Присутствует' : 'Отсутствует');
        
        if (!token) {
            console.log('Ошибка: токен отсутствует');
            throw new Error();
        }

        // Проверка токена
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        const user = await User.findOne({ _id: decoded._id });
        console.log('User:', user ? 'Найден' : 'Не найден');

        if (!user) {
            console.log('Ошибка: пользователь не найден');
            throw new Error();
        }

        req.token = token;
        req.user = user;
        console.log('Auth middleware - Успешная аутентификация');
        next();
    } catch (error) {
        console.error('Auth middleware - Ошибка:', error);
        res.status(401).json({ message: 'Пожалуйста, авторизуйтесь' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Доступ запрещен' });
        }
        next();
    };
};

module.exports = {
    auth,
    checkRole
}; 