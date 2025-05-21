const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { auth } = require('../middlewares/auth');

// Получение всех курсов
router.get('/', async (req, res) => {
    try {
        const { category, level, search } = req.query;
        let query = { isPublished: true };

        if (category) {
            query.category = category;
        }
        if (level) {
            query.level = level;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const courses = await Course.find(query)
            .populate('instructor', 'name email')
            .sort('-createdAt');

        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение курса по ID
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email')
            .populate('lessons')
            .populate({
                path: 'reviews.user',
                select: 'name'
            });

        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание курса
router.post('/', auth, async (req, res) => {
    try {
        const course = new Course({
            ...req.body,
            instructor: req.user.userId
        });

        await course.save();
        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление курса
router.put('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        if (course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        Object.assign(course, req.body);
        await course.save();

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удаление курса
router.delete('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        if (course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        await course.remove();
        res.json({ message: 'Курс удален' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Запись на курс
router.post('/:id/enroll', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        if (course.enrolledStudents.includes(req.user.userId)) {
            return res.status(400).json({ message: 'Вы уже записаны на этот курс' });
        }

        course.enrolledStudents.push(req.user.userId);
        await course.save();

        res.json({ message: 'Вы успешно записались на курс' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Добавление отзыва
router.post('/:id/reviews', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        const { rating, comment } = req.body;

        // Проверка, оставил ли пользователь уже отзыв
        const existingReview = course.reviews.find(
            review => review.user.toString() === req.user.userId
        );

        if (existingReview) {
            return res.status(400).json({ message: 'Вы уже оставили отзыв на этот курс' });
        }

        course.reviews.push({
            user: req.user.userId,
            rating,
            comment
        });

        // Обновление среднего рейтинга
        const totalRating = course.reviews.reduce((sum, review) => sum + review.rating, 0);
        course.rating = totalRating / course.reviews.length;

        await course.save();
        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 