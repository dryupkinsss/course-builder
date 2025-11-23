const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    thumbnail: {
        type: String,
        default: 'default-course.jpg'
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
    }],
    quizzes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    }],
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    requirements: [String],
    learningObjectives: [String],
    totalDuration: {
        type: Number, // в минутах
        default: 0
    }
}, {
    timestamps: true
});

// Виртуальное поле для количества уроков
courseSchema.virtual('lessonCount').get(function() {
    return this.lessons.length;
});

// Метод для подсчета общей длительности курса
courseSchema.methods.calculateTotalDuration = async function() {
    const Lesson = mongoose.model('Lesson');
    const lessons = await Lesson.find({ _id: { $in: this.lessons } });
    this.totalDuration = lessons.reduce((total, lesson) => total + lesson.duration, 0);
    return this.totalDuration;
};

// Метод для подсчета дохода преподавателя
courseSchema.methods.calculateTeacherIncome = function() {
    const teacherShare = 0.4; // 40% от стоимости курса
    return this.price * this.enrolledStudents.length * teacherShare;
};

// Предсохранный хук для подсчета общей длительности
courseSchema.pre('save', async function(next) {
    await this.calculateTotalDuration();
    next();
});

// Виртуальное поле для количества студентов
courseSchema.virtual('studentCount').get(function() {
    return this.enrolledStudents.length;
});

module.exports = mongoose.model('Course', courseSchema); 