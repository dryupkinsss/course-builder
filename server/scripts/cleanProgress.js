const mongoose = require('mongoose');
require('dotenv').config();
require('../models/Progress');

async function cleanProgress() {
  try {
    // Подключаемся к базе данных
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/course-builder';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Получаем коллекцию Progress
    const Progress = mongoose.model('Progress');
    const collection = Progress.collection;

    // Находим и удаляем документы с quiz: null
    const result = await collection.deleteMany({
      quiz: null,
      lesson: { $exists: true } // Удаляем только те, где есть lesson
    });

    console.log(`Удалено ${result.deletedCount} документов с quiz: null`);

    // Проверяем оставшиеся документы
    const remainingDocs = await collection.find({
      quiz: null
    }).toArray();

    console.log('Оставшиеся документы с quiz: null:', remainingDocs);

    console.log('Очистка завершена');
  } catch (error) {
    console.error('Ошибка при очистке:', error);
  } finally {
    // Закрываем соединение с базой данных
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Запускаем функцию
cleanProgress(); 