const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Ошибка валидации',
      errors: errors.array()
    });
  }
  next();
};

// Валидация для регистрации
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль должен содержать минимум 8 символов')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Имя должно содержать минимум 2 символа')
];

// Валидация для создания курса
const courseValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Название курса должно содержать от 3 до 100 символов'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Описание курса должно содержать от 10 до 1000 символов'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Выберите категорию курса')
];

// Валидация для создания урока
const lessonValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Название урока должно содержать от 3 до 100 символов'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Содержание урока должно содержать минимум 10 символов'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Длительность урока должна быть положительным числом')
];

// Валидация для создания теста
const testValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Название теста должно содержать от 3 до 100 символов'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Тест должен содержать хотя бы один вопрос'),
  body('questions.*.text')
    .trim()
    .notEmpty()
    .withMessage('Вопрос не может быть пустым'),
  body('questions.*.options')
    .isArray({ min: 2 })
    .withMessage('Вопрос должен иметь минимум 2 варианта ответа'),
  body('questions.*.correctAnswer')
    .notEmpty()
    .withMessage('Укажите правильный ответ')
];

module.exports = {
  validate,
  registerValidation,
  courseValidation,
  lessonValidation,
  testValidation
}; 