const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
require('dotenv').config();

async function checkQuizzes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const quizzes = await Quiz.find({});
        console.log(`Found ${quizzes.length} quizzes in total`);

        for (const quiz of quizzes) {
            console.log('\nQuiz details:');
            console.log('ID:', quiz._id);
            console.log('Title:', quiz.title);
            console.log('Course:', quiz.course);
            console.log('Lesson:', quiz.lesson);
            console.log('Order:', quiz.order);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkQuizzes(); 