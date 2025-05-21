const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
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
    content: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // в минутах
        required: true
    },
    videoUrl: {
        type: String
    },
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    completedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Индекс для быстрого поиска уроков по курсу и порядку
lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema); 