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
    required: true
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
  }
}, {
  timestamps: true
});

// Индекс для быстрого поиска прогресса
progressSchema.index({ student: 1, course: 1, lesson: 1 }, { unique: true });

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

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress; 