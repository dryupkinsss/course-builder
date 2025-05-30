const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const { auth } = require('../middlewares/auth');
const { upload, handleUploadError } = require('../middlewares/upload');

// Получение всех уроков курса
router.get('/course/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        // Проверка доступа
        if (!course.enrolledStudents.includes(req.user._id) && 
            course.instructor.toString() !== req.user._id) {
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
        if (!req.params.id) {
            return res.status(400).json({ message: 'ID урока не указан' });
        }

        console.log('Fetching lesson with ID:', req.params.id);

        const lesson = await Lesson.findById(req.params.id)
            .populate('course', 'title description instructor')
            .populate('quiz')
            .populate('completedBy', 'name');

        console.log('Found lesson:', lesson);

        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        if (!lesson.course) {
            return res.status(404).json({ message: 'Курс для урока не найден' });
        }

        console.log('Fetching course with ID:', lesson.course._id);

        const course = await Course.findById(lesson.course._id)
            .populate({
                path: 'lessons',
                select: 'title duration order video description',
                options: { sort: { order: 1 } }
            });

        console.log('Found course:', course);

        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        // Проверка доступа
        if (!course.enrolledStudents.includes(req.user._id) && 
            course.instructor.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        // Преобразуем данные для отправки
        const lessonData = lesson.toObject();
        const courseData = course.toObject();
        
        // Преобразуем ObjectId в строки
        courseData._id = courseData._id.toString();
        courseData.instructor = courseData.instructor.toString();
        courseData.enrolledStudents = courseData.enrolledStudents.map(id => id.toString());
        
        // Преобразуем уроки
        courseData.lessons = courseData.lessons.map(lesson => ({
            _id: lesson._id.toString(),
            title: lesson.title,
            duration: lesson.duration,
            order: lesson.order,
            video: lesson.video,
            description: lesson.description
        }));

        // Добавляем информацию о том, завершен ли урок
        lessonData.isCompleted = lesson.completedBy.includes(req.user._id);
        lessonData.course = courseData;

        console.log('Sending response:', JSON.stringify(lessonData, null, 2));

        res.json(lessonData);
    } catch (error) {
        console.error('Ошибка при получении урока:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Неверный формат ID урока' });
        }
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание урока
router.post('/', auth, upload.single('video'), handleUploadError, async (req, res) => {
    try {
        if (!req.body.course) {
            return res.status(400).json({ message: 'ID курса не указан' });
        }

        const course = await Course.findById(req.body.course);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        if (course.instructor.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        // Подготовка данных урока
        const lessonData = {
            title: req.body.title,
            description: req.body.description,
            course: req.body.course,
            order: parseInt(req.body.order) || (course.lessons.length + 1),
            duration: parseInt(req.body.duration),
            resources: JSON.parse(req.body.resources || '[]'),
            content: req.body.content || ''
        };

        // Если есть видео, добавляем путь к нему
        if (req.file) {
            lessonData.video = req.file.path;
        }

        // Создаем урок
        const lesson = new Lesson(lessonData);
        await lesson.save();

        // Добавляем ID урока в массив уроков курса
        course.lessons.push(lesson._id);
        await course.save();

        // Возвращаем созданный урок с информацией о курсе
        const populatedLesson = await Lesson.findById(lesson._id)
            .populate('course', 'title');

        res.status(201).json(populatedLesson);
    } catch (error) {
        console.error('Ошибка при создании урока:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Ошибка валидации данных урока',
                details: error.message 
            });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Неверный формат ID курса' });
        }
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

        if (course.instructor.toString() !== req.user._id) {
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

        if (course.instructor.toString() !== req.user._id) {
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

        if (!course.enrolledStudents.includes(req.user._id)) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        if (!lesson.completedBy.includes(req.user._id)) {
            lesson.completedBy.push(req.user._id);
            await lesson.save();
        }

        res.json({ message: 'Урок отмечен как завершенный' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 