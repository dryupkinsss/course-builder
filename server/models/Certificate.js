const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
    issueDate: {
        type: Date,
        default: Date.now
    },
    certificateNumber: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `CERT-${year}${month}${day}-${random}`;
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema); 