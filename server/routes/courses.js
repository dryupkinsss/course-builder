const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { auth } = require('../middlewares/auth');
const { upload, handleUploadError } = require('../middlewares/upload');
const fs = require('fs');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');

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
            .populate('enrolledStudents', 'name email');

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
        const isEnrolled = course.enrolledStudents.some(student => {
            const studentId = student._id.toString();
            const userId = req.user._id.toString();
            return studentId === userId;
        });
        const isInstructor = course.instructor._id.toString() === req.user._id.toString();
        const isPublished = course.isPublished;

        if (!isEnrolled && !isInstructor && !isPublished) {
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
            lessons: [] // Начинаем с пустого массива уроков
        };

        const course = new Course(courseData);
        await course.save();

        // Затем создаем уроки с привязкой к курсу
        const createdLessons = [];
        for (let i = 0; i < lessonsData.length; i++) {
            const lessonData = {
                ...lessonsData[i],
                course: course._id, // Добавляем ID курса
                video: lessonVideos[i].path,
                order: i + 1
            };
            const lesson = new Lesson(lessonData);
            await lesson.save();
            createdLessons.push(lesson._id);
        }

        // Обновляем курс с ID созданных уроков
        course.lessons = createdLessons;
        await course.save();

        // Возвращаем курс с заполненными данными уроков
        const populatedCourse = await Course.findById(course._id)
            .populate('lessons')
            .populate('instructor', 'name email');

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
router.put('/:id', auth, upload.single('thumbnail'), handleUploadError, async (req, res) => {
    try {
        // Приведение массивов к правильному виду
        if (typeof req.body.learningObjectives === 'string') {
            try { req.body.learningObjectives = JSON.parse(req.body.learningObjectives); } catch { req.body.learningObjectives = []; }
        }
        if (typeof req.body.requirements === 'string') {
            try { req.body.requirements = JSON.parse(req.body.requirements); } catch { req.body.requirements = []; }
        }
        if (typeof req.body.lessons === 'string') {
            try { req.body.lessons = JSON.parse(req.body.lessons); } catch { req.body.lessons = []; }
        }

        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        // Обновляем уроки
        if (req.body.lessons) {
            // Удаляем старые уроки, которых нет в новом списке
            const oldLessonIds = course.lessons.map(lesson => lesson.toString());
            const newLessonIds = req.body.lessons.map(lesson => lesson._id);
            const lessonsToDelete = oldLessonIds.filter(id => !newLessonIds.includes(id));
            
            if (lessonsToDelete.length > 0) {
                await Lesson.deleteMany({ _id: { $in: lessonsToDelete } });
            }

            // Обновляем или создаем новые уроки
            for (const lessonData of req.body.lessons) {
                if (lessonData._id) {
                    // Обновляем существующий урок
                    await Lesson.findByIdAndUpdate(lessonData._id, lessonData);
                } else {
                    // Создаем новый урок
                    const newLesson = new Lesson({
                        ...lessonData,
                        course: course._id
                    });
                    await newLesson.save();
                    course.lessons.push(newLesson._id);
                }
            }
        }

        // Обновляем остальные поля курса
        const updateData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            level: req.body.level,
            price: req.body.price,
            requirements: req.body.requirements,
            learningObjectives: req.body.learningObjectives
        };

        // Если загружена новая обложка, обновляем путь к ней
        if (req.file) {
            // Удаляем старую обложку, если она существует и не является дефолтной
            if (course.thumbnail && course.thumbnail !== 'default-course.jpg') {
                try {
                    fs.unlinkSync(course.thumbnail);
                } catch (err) {
                    console.error('Ошибка при удалении старой обложки:', err);
                }
            }
            updateData.thumbnail = req.file.path;
        }

        Object.assign(course, updateData);
        await course.save();

        // Возвращаем обновленный курс с популированными уроками
        const updatedCourse = await Course.findById(course._id)
            .populate('instructor', 'name email')
            .populate('lessons');

        res.json(updatedCourse);
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

        if (course.instructor.toString() !== req.user._id) {
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

        // Проверка, не является ли пользователь создателем курса
        if (course.instructor.toString() === req.user._id.toString()) {
            return res.status(403).json({ message: 'Создатель курса не может записаться на свой курс' });
        }

        if (course.enrolledStudents.includes(req.user._id)) {
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
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Проверяем, является ли пользователь преподавателем курса
    if (course.instructor.toString() !== req.user._id.toString()) {
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
        lastAccessed: progress ? progress.lastAccessed : null
      };
    });

    const lessonsProgress = await Promise.all(progressPromises);

    res.json({
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

module.exports = router; 