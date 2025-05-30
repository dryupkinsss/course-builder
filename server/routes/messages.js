const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const Message = require('../models/Message');

console.log('Инициализация маршрута сообщений');

// Тестовый маршрут
router.get('/test', (req, res) => {
    res.json({ message: 'Messages route is working' });
});

// Получение сообщений пользователя
router.get('/', auth, async (req, res) => {
    console.log('GET /api/messages - Получен запрос');
    console.log('User:', req.user);
    
    try {
        console.log('Поиск сообщений для пользователя:', req.user._id);
        const messages = await Message.find({
            $or: [
                { sender: req.user._id },
                { recipient: req.user._id }
            ]
        })
        .populate('sender', 'name email')
        .populate('recipient', 'name email')
        .sort('-createdAt');

        console.log('Найдено сообщений:', messages.length);
        res.json(messages);
    } catch (error) {
        console.error('Ошибка при получении сообщений:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Отправка сообщения
router.post('/', auth, async (req, res) => {
    console.log('POST /api/messages - Получен запрос');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    try {
        const { recipient, subject, content } = req.body;
        
        if (!recipient || !content) {
            console.log('Ошибка: отсутствует получатель или текст сообщения');
            return res.status(400).json({ message: 'Необходимо указать получателя и текст сообщения' });
        }

        const newMessage = new Message({
            sender: req.user._id,
            recipient: recipient,
            subject: subject || 'Новое сообщение',
            content: content,
            read: false
        });

        console.log('Создано новое сообщение:', newMessage);
        await newMessage.save();
        console.log('Сообщение сохранено в базу данных');

        // Заполняем данные отправителя и получателя
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name email')
            .populate('recipient', 'name email');

        console.log('Отправляем ответ:', populatedMessage);
        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удаление сообщения
router.delete('/:id', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        
        if (!message) {
            return res.status(404).json({ message: 'Сообщение не найдено' });
        }

        // Проверяем, является ли пользователь отправителем или получателем
        if (message.sender.toString() !== req.user._id.toString() && 
            message.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        await message.deleteOne();
        res.json({ message: 'Сообщение удалено' });
    } catch (error) {
        console.error('Ошибка при удалении сообщения:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Отметка сообщения как прочитанного
router.put('/:id/read', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        
        if (!message) {
            return res.status(404).json({ message: 'Сообщение не найдено' });
        }

        if (message.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        message.read = true;
        await message.save();

        res.json(message);
    } catch (error) {
        console.error('Ошибка при обновлении сообщения:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 