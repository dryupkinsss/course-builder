const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { auth } = require('../middlewares/auth');
const { upload, handleUploadError } = require('../middlewares/upload');
const fs = require('fs');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const mongoose = require('mongoose');
const path = require('path');

// Получение всех курсов
router.get('/', auth, async (req, res) => {
    try {
        const { category, level, search } = req.query;
        let query = {};

        // Если пользователь не авторизован, показываем только опубликованные курсы
        if (!req.user) {
            query.isPublished = true;
        }

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

// Получение курсов, на которые записан пользователь
router.get('/enrolled', auth, async (req, res) => {
    try {
        const courses = await Course.find({ enrolledStudents: req.user._id })
            .populate('instructor', 'name email')
            .populate('lessons')
            .sort('-createdAt');

        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение курса по ID
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('Fetching course with ID:', req.params.id);
        console.log('User ID:', req.user._id);

        const course = await Course.findById(req.params.id)
            .populate({
                path: 'lessons',
                select: 'title duration order video description',
                options: { sort: { order: 1 } }
            })
            .populate('instructor', 'name email')
            .populate('enrolledStudents', 'name email')
            .populate('quizzes');

        if (!course) {
            console.log('Course not found');
            return res.status(404).json({ message: 'Курс не найден' });
        }

        console.log('Course found:', {
            courseId: course._id,
            instructorId: course.instructor._id,
            isPublished: course.isPublished,
            lessonsCount: course.lessons ? course.lessons.length : 0
        });

        // Проверка доступа
        const userIdStr = req.user._id.toString();
        const enrolledIds = course.enrolledStudents.map(s => s._id ? s._id.toString() : s.toString());
        const isEnrolled = enrolledIds.includes(userIdStr);
        const isInstructor = course.instructor._id ? course.instructor._id.toString() === userIdStr : course.instructor.toString() === userIdStr;
        const isPublished = course.isPublished;

        console.log('Access check:', { userIdStr, enrolledIds, isEnrolled, isInstructor, isPublished });

        // Разрешаем просмотр любому, если курс опубликован
        if (!isPublished && !isEnrolled && !isInstructor) {
            console.log('Access denied');
            return res.status(403).json({ message: 'Нет доступа' });
        }

        // Преобразуем данные для отправки
        const courseData = course.toObject();
        
        // Преобразуем ObjectId в строки
        courseData._id = courseData._id.toString();
        courseData.instructor = courseData.instructor._id.toString();
        courseData.enrolledStudents = courseData.enrolledStudents.map(student => student._id.toString());
        
        // Убедимся, что lessons - это массив
        if (!Array.isArray(courseData.lessons)) {
            courseData.lessons = [];
        }

        // Преобразуем уроки
        courseData.lessons = courseData.lessons.map(lesson => ({
            _id: lesson._id.toString(),
            title: lesson.title || '',
            duration: lesson.duration || 0,
            order: lesson.order || 0,
            video: lesson.video || '',
            description: lesson.description || ''
        }));

        // Убедимся, что quizzes - это массив
        if (!Array.isArray(courseData.quizzes)) {
            courseData.quizzes = [];
        }

        // Преобразуем тесты
        courseData.quizzes = courseData.quizzes.map(quiz => ({
            _id: quiz._id.toString(),
            title: quiz.title || '',
            description: quiz.description || '',
            order: quiz.order || 0,
            passingScore: quiz.passingScore || 1,
            questions: (quiz.questions || []).map(q => ({
                question: q.question,
                type: q.type,
                options: q.options,
                correctOption: Array.isArray(q.options) ? q.options.findIndex(opt => opt.isCorrect) : 0
            }))
        }));

        console.log('Sending course data:', {
            id: courseData._id,
            title: courseData.title,
            lessonsCount: courseData.lessons.length
        });

        res.json(courseData);
    } catch (error) {
        console.error('Ошибка при получении курса:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Неверный формат ID курса' });
        }
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Создание курса
router.post('/', auth, upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'lessonVideos', maxCount: 10 }
]), handleUploadError, async (req, res) => {
    try {
        // Приведение массивов к правильному виду
        if (typeof req.body.learningObjectives === 'string') {
            try { req.body.learningObjectives = JSON.parse(req.body.learningObjectives); } catch { req.body.learningObjectives = []; }
        }
        if (typeof req.body.requirements === 'string') {
            try { req.body.requirements = JSON.parse(req.body.requirements); } catch { req.body.requirements = []; }
        }

        // Проверяем наличие всех необходимых файлов
        if (!req.files || !req.files.thumbnail || !req.files.lessonVideos) {
            return res.status(400).json({ 
                message: 'Необходимо загрузить превью курса и видео уроков' 
            });
        }

        const thumbnail = req.files.thumbnail[0];
        const lessonVideos = req.files.lessonVideos;

        // Проверяем, что количество видео соответствует количеству уроков
        const lessonsData = JSON.parse(req.body.lessons || '[]');
        if (lessonVideos.length !== lessonsData.length) {
            // Удаляем загруженные файлы в случае ошибки
            fs.unlinkSync(thumbnail.path);
            lessonVideos.forEach(video => fs.unlinkSync(video.path));
            return res.status(400).json({ 
                message: 'Количество видео должно соответствовать количеству уроков' 
            });
        }

        // Сначала создаем курс
        const courseData = {
            ...req.body,
            instructor: req.user._id,
            thumbnail: thumbnail.path,
            lessons: [],
            quizzes: []
        };

        const course = new Course(courseData);
        await course.save();

        // Затем создаем уроки с привязкой к курсу
        const createdLessons = [];
        for (let i = 0; i < lessonsData.length; i++) {
            let videoPath = lessonVideos[i].path;
            const uploadsIndex = videoPath.lastIndexOf('uploads');
            if (uploadsIndex !== -1) {
                videoPath = videoPath.substring(uploadsIndex + 'uploads/'.length);
            } else {
                videoPath = path.basename(videoPath);
            }
            // Удаляем все ведущие videos/ (и слэши)
            videoPath = videoPath.replace(/^videos[\/]+/, '');
            // Добавляем только один раз videos/
            videoPath = 'videos/' + path.basename(videoPath);
            const lessonData = {
                ...lessonsData[i],
                course: course._id,
                video: videoPath,
                order: i + 1
            };
            const lesson = new Lesson(lessonData);
            await lesson.save();
            createdLessons.push(lesson._id);
        }

        course.lessons = createdLessons;

        // --- Создание тестов (Quiz) ---
        let quizzesData = [];
        if (typeof req.body.quizzes === 'string') {
            try { quizzesData = JSON.parse(req.body.quizzes); } catch { quizzesData = []; }
        } else if (Array.isArray(req.body.quizzes)) {
            quizzesData = req.body.quizzes;
        }
        const createdQuizzes = [];
        for (const quiz of quizzesData) {
            const quizDoc = new Quiz({
                title: quiz.title,
                description: quiz.description || '',
                questions: (quiz.questions || []).map(q => ({
                    question: q.question,
                    type: 'single',
                    options: (q.options || []).map((opt, idx) => ({ text: opt, isCorrect: idx === q.correctOption })),
                    points: 1
                })),
                passingScore: 1,
                timeLimit: 0,
                lesson: null // если нужен тест для всего курса, можно не указывать lesson
            });
            await quizDoc.save();
            createdQuizzes.push(quizDoc._id);
        }
        course.quizzes = createdQuizzes;
        await course.save();
        // --- конец блока создания тестов ---

        // Возвращаем курс с заполненными данными уроков и тестов
        const populatedCourse = await Course.findById(course._id)
            .populate('lessons')
            .populate('instructor', 'name email')
            .populate('quizzes');

        res.status(201).json(populatedCourse);
    } catch (error) {
        console.error('Ошибка при создании курса:', error);
        
        // Удаляем загруженные файлы в случае ошибки
        if (req.files) {
            if (req.files.thumbnail) {
                fs.unlinkSync(req.files.thumbnail[0].path);
            }
            if (req.files.lessonVideos) {
                req.files.lessonVideos.forEach(video => {
                    fs.unlinkSync(video.path);
                });
            }
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Ошибка валидации данных курса',
                details: error.message 
            });
        }
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление курса
router.put('/:id', auth, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'lessonVideos', maxCount: 10 }
]), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

    const { title, description, category, level, price, requirements, learningObjectives, lessons, quizzes } = req.body;

    // Обновляем основные данные курса
    course.title = title;
    course.description = description;
    course.category = category;
    course.level = level;
    course.price = price;
    course.requirements = JSON.parse(requirements);
    course.learningObjectives = JSON.parse(learningObjectives);

    // Обновляем обложку, если она загружена
    if (req.files && req.files.thumbnail) {
      course.thumbnail = req.files.thumbnail[0].path;
    }

    // Удаляем старые уроки
    await Lesson.deleteMany({ course: course._id });

    // Создаем новые уроки из модулей
    let parsedLessons = [];
    try {
      parsedLessons = JSON.parse(req.body.lessons || '[]');
    } catch (e) {
      parsedLessons = [];
    }
    for (let i = 0; i < parsedLessons.length; i++) {
      const lessonData = parsedLessons[i];
      let videoPath = null;
      if (req.files && req.files.lessonVideos && req.files.lessonVideos[i]) {
        videoPath = req.files.lessonVideos[i].path;
      }
      const lesson = new Lesson({
        ...lessonData,
        course: course._id,
        video: videoPath,
        order: i + 1
      });
      await lesson.save();
    }

    // Обновляем тесты
    let parsedQuizzes = [];
    try {
      parsedQuizzes = JSON.parse(req.body.quizzes || '[]');
    } catch (e) {
      parsedQuizzes = [];
    }
    console.log('parsedQuizzes:', parsedQuizzes);

    const updatedQuizzes = [];
    for (let i = 0; i < parsedQuizzes.length; i++) {
      const quizData = parsedQuizzes[i];
      const { _id, ...quizDataWithoutId } = quizData;

      // Привести структуру вопросов и опций к нужному виду
      const questions = Array.isArray(quizDataWithoutId.questions)
        ? quizDataWithoutId.questions.map(q => ({
            question: q.question,
            type: q.type || 'single',
            options: Array.isArray(q.options)
              ? q.options.map(opt =>
                  typeof opt === 'object' && opt.text ? { text: opt.text, isCorrect: !!opt.isCorrect } : { text: String(opt), isCorrect: false }
                )
              : [],
            correctOption: typeof q.correctOption === 'number' ? q.correctOption : 0
          }))
        : [];

      let quiz;
      if (_id) {
        // Обновляем существующий тест
        quiz = await Quiz.findById(_id);
        if (quiz) {
          quiz.title = quizDataWithoutId.title;
          quiz.description = quizDataWithoutId.description;
          quiz.questions = questions;
          quiz.passingScore = quizDataWithoutId.passingScore || 1;
          quiz.order = i + 1;
          await quiz.save();
        }
      } else {
        // Создаем новый тест, если _id не предоставлен
        quiz = new Quiz({
          ...quizDataWithoutId,
          passingScore: quizDataWithoutId.passingScore || 1,
          questions,
          course: course._id,
          order: i + 1
        });
        await quiz.save();
      }
      
      if (quiz) {
        updatedQuizzes.push(quiz._id);
      }
    }

    // Удаляем тесты, которых нет в обновленном списке
    await Quiz.deleteMany({
      course: course._id,
      _id: { $nin: updatedQuizzes }
    });

    course.quizzes = updatedQuizzes;
    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Ошибка при обновлении курса' });
  }
});

// Удаление курса
router.delete('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        await course.deleteOne();
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

        // Проверка, не является ли пользователь создателем курса
        if (course.instructor.toString() === req.user._id.toString()) {
            return res.status(403).json({ message: 'Создатель курса не может записаться на свой курс' });
        }

        // Исправленное сравнение!
        if (course.enrolledStudents.some(id => id.toString() === req.user._id.toString())) {
            return res.status(400).json({ message: 'Вы уже записаны на этот курс' });
        }

        course.enrolledStudents.push(req.user._id);
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

        // Проверка, не является ли пользователь создателем курса
        if (course.instructor.toString() === req.user._id.toString()) {
            return res.status(403).json({ message: 'Создатель курса не может оставлять отзывы о своем курсе' });
        }

        // Проверка, записан ли пользователь на курс
        if (!course.enrolledStudents.includes(req.user._id)) {
            return res.status(403).json({ message: 'Только студенты, записанные на курс, могут оставлять отзывы' });
        }

        const { rating, comment } = req.body;

        // Проверка, оставил ли пользователь уже отзыв
        const existingReview = course.reviews.find(
            review => review.user.toString() === req.user._id
        );

        if (existingReview) {
            return res.status(400).json({ message: 'Вы уже оставили отзыв на этот курс' });
        }

        course.reviews.push({
            user: req.user._id,
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

// Получение курсов преподавателя
router.get('/my/created', auth, async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.user._id })
            .populate('instructor', 'name email')
            .populate({
                path: 'enrolledStudents',
                select: 'name email',
                model: 'User'
            })
            .populate('lessons')
            .sort('-createdAt');

        // Преобразуем данные для отправки
        const formattedCourses = courses.map(course => {
            const courseObj = course.toObject();
            return {
                ...courseObj,
                enrolledStudents: courseObj.enrolledStudents.map(student => ({
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    courseTitle: courseObj.title
                }))
            };
        });

        res.json(formattedCourses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение прогресса студента по курсу
router.get('/:courseId/students/:studentId/progress', auth, async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    
    // Проверяем, что courseId является валидным ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Неверный формат ID курса' });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем, является ли пользователь преподавателем курса или самим студентом
    if (course.instructor.toString() !== req.user._id.toString() && 
        studentId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

    // Получаем все уроки курса
    const lessons = await Lesson.find({ course: courseId }).sort('order');

    // Получаем прогресс по каждому уроку
    const progressPromises = lessons.map(async (lesson) => {
      const progress = await Progress.findOne({
        student: studentId,
        course: courseId,
        lesson: lesson._id
      });

      return {
        _id: lesson._id,
        title: lesson.title,
        progress: progress ? progress.progress : 0,
        status: progress ? progress.status : 'not_started',
        lastAccessed: progress ? progress.lastAccessed : null,
        completedAt: progress ? progress.completedAt : null
      };
    });

    const lessonsProgress = await Promise.all(progressPromises);

    // Вычисляем общий прогресс по курсу
    const totalProgress = lessonsProgress.reduce((acc, lesson) => acc + lesson.progress, 0) / lessons.length;

    res.json({
      courseId,
      studentId,
      totalProgress,
      lessons: lessonsProgress
    });
  } catch (err) {
    console.error('Ошибка при получении прогресса:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление прогресса студента по уроку
router.post('/:courseId/lessons/:lessonId/progress', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { progress } = req.body;

    // Проверяем, что студент записан на курс
    const course = await Course.findOne({
      _id: courseId,
      enrolledStudents: req.user._id
    });

    if (!course) {
      return res.status(403).json({ message: 'Нет доступа к курсу' });
    }

    // Проверяем существование урока
    const lesson = await Lesson.findOne({
      _id: lessonId,
      course: courseId
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    // Обновляем или создаем запись о прогрессе
    const progressData = await Progress.findOneAndUpdate(
      {
        student: req.user._id,
        course: courseId,
        lesson: lessonId
      },
      {
        progress: Math.min(Math.max(progress, 0), 100),
        lastAccessed: new Date(),
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
        completedAt: progress === 100 ? new Date() : undefined
      },
      {
        new: true,
        upsert: true
      }
    );

    res.json(progressData);
  } catch (err) {
    console.error('Ошибка при обновлении прогресса:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление прогресса по уроку
router.put('/:courseId/lessons/:lessonId/progress', auth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { progress } = req.body;
    const studentId = req.user._id;

    // Проверяем, что курс существует
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем, что урок существует в курсе
    const lesson = course.lessons.find(l => l._id.toString() === lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Урок не найден в курсе' });
    }

    // Проверяем, что студент зачислен на курс
    const isEnrolled = course.enrolledStudents.includes(studentId);
    if (!isEnrolled) {
      return res.status(403).json({ message: 'Вы не зачислены на этот курс' });
    }

    // Обновляем или создаем запись о прогрессе
    let progressDoc = await Progress.findOne({
      student: studentId,
      course: courseId,
      lesson: lessonId
    });

    if (!progressDoc) {
      progressDoc = new Progress({
        student: studentId,
        course: courseId,
        lesson: lessonId,
        progress: progress,
        status: progress === 100 ? 'completed' : 'in_progress'
      });
    } else {
      progressDoc.progress = progress;
      if (progress === 100) {
        progressDoc.status = 'completed';
        progressDoc.completedAt = new Date();
      }
    }

    await progressDoc.save();

    res.json({
      message: 'Прогресс успешно обновлен',
      progress: progressDoc
    });
  } catch (error) {
    console.error('Ошибка при обновлении прогресса:', error);
    res.status(500).json({ message: 'Ошибка при обновлении прогресса' });
  }
});

// Получение прогресса студента по курсу
router.get('/:courseId/progress/:studentId', auth, async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const userId = req.user._id;

    // Проверяем, что курс существует
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем права доступа (преподаватель или сам студент)
    const isInstructor = course.instructor.toString() === userId.toString();
    const isStudent = studentId === userId.toString();
    if (!isInstructor && !isStudent) {
      return res.status(403).json({ message: 'Нет доступа к этой информации' });
    }

    // Получаем все уроки курса
    const lessons = course.lessons;

    // Получаем прогресс по каждому уроку
    const progressPromises = lessons.map(async (lesson) => {
      const progress = await Progress.findOne({
        student: studentId,
        course: courseId,
        lesson: lesson._id
      });

      return {
        _id: lesson._id,
        title: lesson.title,
        progress: progress ? progress.progress : 0,
        status: progress ? progress.status : 'not_started',
        lastAccessed: progress ? progress.updatedAt : null,
        completedAt: progress ? progress.completedAt : null
      };
    });

    const lessonsProgress = await Promise.all(progressPromises);

    // Вычисляем общий прогресс по курсу
    const totalProgress = lessonsProgress.reduce((acc, lesson) => acc + lesson.progress, 0) / lessons.length;

    res.json({
      course: {
        _id: course._id,
        title: course.title
      },
      student: studentId,
      totalProgress: Math.round(totalProgress),
      lessons: lessonsProgress
    });
  } catch (error) {
    console.error('Ошибка при получении прогресса:', error);
    res.status(500).json({ message: 'Ошибка при получении прогресса' });
  }
});

module.exports = router; 