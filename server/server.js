const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Статические файлы
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course-builder', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB подключена'))
.catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Маршруты
console.log('Загрузка маршрутов...');

// Загрузка и подключение маршрутов
try {
  // Auth router
  console.log('Загрузка auth router...');
  const authRouter = require('./routes/auth');
  console.log('Auth router загружен успешно');
  app.use('/api/auth', authRouter);
  console.log('Auth router подключен к /api/auth');

  // Messages router
  console.log('Загрузка messages router...');
  const messagesRouter = require('./routes/messages');
  console.log('Messages router загружен успешно');
  app.use('/api/messages', messagesRouter);
  console.log('Messages router подключен к /api/messages');

  // Courses router
  console.log('Загрузка courses router...');
  const coursesRouter = require('./routes/courses');
  console.log('Courses router загружен успешно');
  app.use('/api/courses', coursesRouter);
  console.log('Courses router подключен к /api/courses');

  // Lessons router
  console.log('Загрузка lessons router...');
  const lessonsRouter = require('./routes/lessons');
  console.log('Lessons router загружен успешно');
  app.use('/api/lessons', lessonsRouter);
  console.log('Lessons router подключен к /api/lessons');

  // Quizzes router
  console.log('Загрузка quizzes router...');
  const quizzesRouter = require('./routes/quizzes');
  console.log('Quizzes router загружен успешно');
  app.use('/api/quizzes', quizzesRouter);
  console.log('Quizzes router подключен к /api/quizzes');

} catch (error) {
  console.error('Ошибка при загрузке маршрутов:', error);
  process.exit(1); // Завершаем процесс с ошибкой
}

// Обработка 404 ошибок
app.use((req, res, next) => {
  console.log('404 - Маршрут не найден:', req.method, req.url);
  res.status(404).json({ message: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: 'Что-то пошло не так!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 