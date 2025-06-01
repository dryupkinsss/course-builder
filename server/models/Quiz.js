const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: false
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['single', 'multiple', 'text'],
            required: true
        },
        options: [{
            text: String,
            isCorrect: Boolean
        }],
        correctAnswer: String, // для текстовых вопросов
        points: {
            type: Number,
            default: 1
        }
    }],
    passingScore: {
        type: Number,
        required: true
    },
    timeLimit: {
        type: Number, // в минутах
        default: 0 // 0 означает без ограничения времени
    },
    attempts: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: Number,
        answers: [{
            question: {
                type: mongoose.Schema.Types.ObjectId
            },
            answer: mongoose.Schema.Types.Mixed,
            isCorrect: Boolean
        }],
        completedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Метод для проверки ответов
quizSchema.methods.checkAnswers = function(answers) {
    let score = 0;
    const results = [];

    this.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        let isCorrect = false;

        if (question.type === 'single') {
            isCorrect = question.options[userAnswer].isCorrect;
        } else if (question.type === 'multiple') {
            isCorrect = userAnswer.every(answer => question.options[answer].isCorrect) &&
                       question.options.filter(opt => opt.isCorrect).length === userAnswer.length;
        } else if (question.type === 'text') {
            isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        }

        if (isCorrect) {
            score += question.points;
        }

        results.push({
            question: question._id,
            answer: userAnswer,
            isCorrect
        });
    });

    return {
        score,
        results,
        passed: score >= this.passingScore
    };
};

module.exports = mongoose.model('Quiz', quizSchema); 