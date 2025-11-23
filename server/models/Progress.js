const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false,
    default: undefined
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false,
    default: undefined
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  quizAttempts: [{
    score: Number,
    maxScore: Number,
    passed: Boolean,
    answers: [{
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz.questions'
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

// Индексы для быстрого поиска прогресса
progressSchema.index({ student: 1, course: 1, lesson: 1 }, { 
  unique: true,
  partialFilterExpression: { lesson: { $exists: true } }
});

progressSchema.index({ student: 1, course: 1, quiz: 1 }, { 
  unique: true,
  partialFilterExpression: { quiz: { $exists: true } }
});

progressSchema.index({ student: 1, course: 1 }, { 
  unique: true,
  partialFilterExpression: { 
    lesson: null,
    quiz: null
  }
});

// Метод для обновления прогресса
progressSchema.methods.updateProgress = async function(newProgress) {
  this.progress = newProgress;
  this.lastAccessed = new Date();
  
  if (newProgress === 100) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (newProgress > 0) {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Метод для добавления попытки теста
progressSchema.methods.addQuizAttempt = async function(attempt) {
  this.quizAttempts.push(attempt);
  this.lastAccessed = new Date();
  
  // Если тест пройден успешно, обновляем статус
  if (attempt.passed) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.progress = 100;
  }
  
  return this.save();
};

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress; 