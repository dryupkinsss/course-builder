const quizzesRouter = require('./routes/quizzes');

// Маршруты
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/quizzes', quizzesRouter); 