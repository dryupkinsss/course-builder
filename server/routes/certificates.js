const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const PDFDocument = require('pdfkit');
const path = require('path');

// Создание сертификата
router.post('/:courseId', auth, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        // Проверяем, существует ли курс
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Курс не найден' });
        }

        // Проверяем, записан ли студент на курс
        if (!course.enrolledStudents.includes(userId)) {
            return res.status(403).json({ message: 'Вы не записаны на этот курс' });
        }

        // Проверяем, есть ли уже сертификат для этого курса
        const existingCertificate = await Certificate.findOne({
            student: userId,
            course: courseId
        });

        if (existingCertificate) {
            return res.status(400).json({ message: 'Сертификат уже существует' });
        }

        // Создаем новый сертификат
        const certificate = new Certificate({
            student: userId,
            course: courseId
        });

        await certificate.save();

        // Возвращаем созданный сертификат с заполненными данными
        const populatedCertificate = await Certificate.findById(certificate._id)
            .populate('student', 'name email')
            .populate('course', 'title');

        res.status(201).json(populatedCertificate);
    } catch (error) {
        console.error('Error creating certificate:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение всех сертификатов пользователя
router.get('/', auth, async (req, res) => {
    try {
        const certificates = await Certificate.find({ student: req.user._id })
            .populate('course', 'title')
            .sort('-createdAt');

        res.json(certificates);
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение сертификата по ID
router.get('/:id', auth, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('student', 'name email')
            .populate('course', 'title');

        if (!certificate) {
            return res.status(404).json({ message: 'Сертификат не найден' });
        }

        // Проверяем, принадлежит ли сертификат текущему пользователю
        if (certificate.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет доступа к сертификату' });
        }

        res.json(certificate);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Скачивание сертификата
router.get('/:id/download', auth, async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id)
            .populate('student', 'name email')
            .populate('course', 'title');

        if (!certificate) {
            return res.status(404).json({ message: 'Сертификат не найден' });
        }

        // Проверяем, принадлежит ли сертификат текущему пользователю
        if (certificate.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет доступа к сертификату' });
        }

        // Создаем PDF документ
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape'
        });

        // Подключаем шрифт с поддержкой кириллицы
        const fontPath = path.join(__dirname, '../fonts/DejaVuSans.ttf');
        doc.registerFont('dejavu', fontPath);
        doc.font('dejavu');

        // Устанавливаем заголовки для скачивания
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateNumber}.pdf`);

        // Отправляем PDF в ответ
        doc.pipe(res);

        // Добавляем содержимое сертификата
        doc.fontSize(40)
           .text('СЕРТИФИКАТ', { align: 'center' })
           .moveDown();

        doc.fontSize(20)
           .text('Настоящим удостоверяется, что', { align: 'center' })
           .moveDown();

        doc.fontSize(30)
           .text(certificate.student.name, { align: 'center' })
           .moveDown();

        doc.fontSize(20)
           .text('успешно завершил(а) курс', { align: 'center' })
           .moveDown();

        doc.fontSize(25)
           .text(`"${certificate.course.title}"`, { align: 'center' })
           .moveDown();

        doc.fontSize(16)
           .text(`Номер сертификата: ${certificate.certificateNumber}`, { align: 'center' })
           .moveDown();

        doc.fontSize(16)
           .text(`Дата выдачи: ${new Date(certificate.issueDate).toLocaleDateString()}`, { align: 'center' });

        // Завершаем создание PDF
        doc.end();
    } catch (error) {
        console.error('Error downloading certificate:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router; 