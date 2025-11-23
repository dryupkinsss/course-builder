const mongoose = require('mongoose');
const Progress = require('../models/Progress');

async function recreateIndexes() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course-builder');
    console.log('Connected to MongoDB');

    // Удаляем все существующие индексы
    await Progress.collection.dropIndexes();
    console.log('Dropped existing indexes');

    // Создаем новые индексы
    await Progress.createIndexes();
    console.log('Created new indexes');

    // Проверяем созданные индексы
    const indexes = await Progress.collection.indexes();
    console.log('Current indexes:', indexes);

    console.log('Index recreation completed successfully');
  } catch (error) {
    console.error('Error recreating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

recreateIndexes(); 