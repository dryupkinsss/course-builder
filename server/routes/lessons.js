const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const { auth } = require('../middlewares/auth');

// Получение всех уроков курса
router.get('/course/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        // Проверка доступа
        if (!course.enrolledStudents.includes(req.user.userId) && 
            course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        const lessons = await Lesson.find({ course: req.params.courseId })
            .sort('order');

        res.json(lessons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение урока по ID
router.get('/:id', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id)
            .populate('course')
            .populate('quiz');

        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        const course = await Course.findById(lesson.course._id);

        // Проверка доступа
        if (!course.enrolledStudents.includes(req.user.userId) && 
            course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        res.json(lesson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание урока
router.post('/', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.body.course);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        if (course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        const lesson = new Lesson(req.body);
        await lesson.save();

        // Добавление урока в курс
        course.lessons.push(lesson._id);
        await course.save();

        res.status(201).json(lesson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление урока
router.put('/:id', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        const course = await Course.findById(lesson.course);

        if (course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        Object.assign(lesson, req.body);
        await lesson.save();

        res.json(lesson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удаление урока
router.delete('/:id', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        const course = await Course.findById(lesson.course);

        if (course.instructor.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        // Удаление урока из курса
        course.lessons = course.lessons.filter(
            lessonId => lessonId.toString() !== req.params.id
        );
        await course.save();

        await lesson.remove();
        res.json({ message: 'Урок удален' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Отметка урока как завершенного
router.post('/:id/complete', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        const course = await Course.findById(lesson.course);

        if (!course.enrolledStudents.includes(req.user.userId)) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        if (!lesson.completedBy.includes(req.user.userId)) {
            lesson.completedBy.push(req.user.userId);
            await lesson.save();
        }

        res.json({ message: 'Урок отмечен как завершенный' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 