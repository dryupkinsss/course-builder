const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Ошибка валидации',
      errors: Object.values(err.errors).map(error => error.message)
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Недействительный токен'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Срок действия токена истек'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Дублирование данных',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Внутренняя ошибка сервера'
  });
};

module.exports = errorHandler; 