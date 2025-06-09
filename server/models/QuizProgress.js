const mongoose = require('mongoose');

const quizProgressSchema = new mongoose.Schema({
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
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
  attempts: [{
    score: Number,
    answers: [{
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz.questions'
      },
      selectedOption: Number,
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

// Compound index to ensure unique progress per student per quiz
quizProgressSchema.index({ student: 1, course: 1, quiz: 1 }, { unique: true });

const QuizProgress = mongoose.model('QuizProgress', quizProgressSchema);

module.exports = QuizProgress; 