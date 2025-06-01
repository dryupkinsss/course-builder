const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const { auth } = require('../middlewares/auth');

// Создание теста
router.post('/', auth, async (req, res) => {
    try {
        const { lessonId, title, description, questions, passingScore, timeLimit } = req.body;

        // Проверяем существование урока
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Урок не найден' });
        }

        // Создаем тест
        const quiz = new Quiz({
            title,
            description,
            lesson: lessonId,
            questions,
            passingScore,
            timeLimit
        });

        await quiz.save();

        // Обновляем урок, добавляя ссылку на тест
        lesson.quiz = quiz._id;
        await lesson.save();

        res.status(201).json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение теста
router.get('/:id', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('lesson', 'title');

        if (!quiz) {
            return res.status(404).json({ message: 'Тест не найден' });
        }

        res.json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Прохождение теста
router.post('/:id/submit', auth, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('lesson', 'course')
            .populate('course');
        
        if (!quiz) {
            return res.status(404).json({ message: 'Тест не найден' });
        }

        // Получаем ID курса из теста или из связанного урока
        const courseId = quiz.course ? quiz.course._id : (quiz.lesson ? quiz.lesson.course : null);
        
        if (!courseId) {
            return res.status(400).json({ message: 'Тест не привязан к курсу' });
        }

        const { answers } = req.body;
        const result = quiz.checkAnswers(answers);

        // Сохраняем попытку в тесте
        quiz.attempts.push({
            user: req.user._id,
            score: result.score,
            answers: result.results
        });

        await quiz.save();

        // Сохраняем прогресс
        const progress = await Progress.findOneAndUpdate(
            {
                student: req.user._id,
                course: courseId,
                quiz: quiz._id
            },
            {
                $setOnInsert: {
                    student: req.user._id,
                    course: courseId,
                    quiz: quiz._id,
                    status: 'not_started'
                }
            },
            {
                new: true,
                upsert: true
            }
        );

        // Добавляем попытку в прогресс
        await progress.addQuizAttempt({
            score: result.score,
            maxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
            passed: result.passed,
            answers: result.results
        });

        res.json({
            score: result.score,
            passed: result.passed,
            results: result.results,
            progress: progress
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 