const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
require('dotenv').config();

async function migrateQuizzes() {
    try {
        // Подключаемся к базе данных
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Получаем все тесты без привязки к курсу
        const unassignedQuizzes = await Quiz.find({
            $or: [
                { course: { $exists: false } },
                { course: null }
            ]
        });
        console.log(`Found ${unassignedQuizzes.length} unassigned quizzes`);

        // Получаем все курсы
        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses`);

        // Для каждого курса
        for (const course of courses) {
            console.log(`\nProcessing course: ${course.title}`);
            
            // Находим тесты, которые нужно привязать к этому курсу
            const courseQuizzes = unassignedQuizzes.filter(quiz => {
                // Если у теста есть урок, проверяем, принадлежит ли он этому курсу
                if (quiz.lesson) {
                    return course.lessons.includes(quiz.lesson);
                }
                // Если у теста нет урока, привязываем его к первому курсу
                return course === courses[0];
            });

            console.log(`Found ${courseQuizzes.length} quizzes to assign to course ${course.title}`);

            // Обновляем каждый тест
            for (let i = 0; i < courseQuizzes.length; i++) {
                const quiz = courseQuizzes[i];
                const update = {
                    course: course._id,
                    order: i + 1
                };

                await Quiz.findByIdAndUpdate(quiz._id, update);
                console.log(`Updated quiz: ${quiz.title}`);
            }
        }

        // Проверяем оставшиеся тесты
        const remainingQuizzes = await Quiz.find({
            $or: [
                { course: { $exists: false } },
                { course: null }
            ]
        });
        console.log(`\nRemaining unassigned quizzes: ${remainingQuizzes.length}`);

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

migrateQuizzes(); 