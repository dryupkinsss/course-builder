import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Checkbox,
  TextField,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { quizAPI } from '../../services/api';

const QuizComponent = ({ onComplete }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!user?._id) {
        setError('Необходимо авторизоваться');
        setLoading(false);
        return;
      }

      try {
        const data = await quizAPI.getQuiz(id);
        console.log('Quiz data:', data); // Debug log
        
        // Проверяем, был ли тест уже пройден
        if (data.attempts && data.attempts.some(attempt => 
          attempt.user === user._id && 
          (attempt.score >= data.passingScore || data.attempts.length > 0)
        )) {
          setError('Этот тест уже пройден');
          return;
        }

        setQuiz(data);
        // Инициализируем пустые ответы для каждого вопроса
        const initialAnswers = {};
        data.questions.forEach((q, index) => {
          initialAnswers[index] = q.type === 'multiple' ? [] : '';
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError('Ошибка при загрузке теста');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, user?._id]);

  const handleSingleAnswer = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleMultipleAnswer = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: prev[questionIndex].includes(value)
        ? prev[questionIndex].filter(v => v !== value)
        : [...prev[questionIndex], value]
    }));
  };

  const handleTextAnswer = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.submitQuiz(id, Object.values(answers));
      setResult(response);
      setSubmitted(true);
      if (onComplete) {
        onComplete(response);
      }
      // После успешного прохождения теста, перенаправляем на страницу курса
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      setError('Ошибка при отправке ответов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !quiz) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!quiz) {
    return <Alert severity="info">Тест не найден</Alert>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 2 }}>
      <Typography variant="h5" gutterBottom>
        {quiz.title}
      </Typography>
      {quiz.description && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {quiz.description}
        </Typography>
      )}
      <Divider sx={{ my: 2 }} />

      {quiz.questions.map((question, index) => (
        <Box key={index} mb={4}>
          <Typography variant="h6" gutterBottom>
            Вопрос {index + 1}: {question.question}
          </Typography>

          {submitted && (
            <Typography
              color={result.results[index].isCorrect ? 'success.main' : 'error.main'}
              sx={{ mb: 1 }}
            >
              {result.results[index].isCorrect ? '✓ Правильно' : '✗ Неправильно'}
            </Typography>
          )}

          {question.type === 'single' && (
            <FormControl component="fieldset">
              <RadioGroup
                value={answers[index]}
                onChange={(e) => handleSingleAnswer(index, e.target.value)}
              >
                {question.options.map((option, optIndex) => (
                  <FormControlLabel
                    key={optIndex}
                    value={optIndex.toString()}
                    control={<Radio />}
                    label={option.text}
                    disabled={submitted}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'multiple' && (
            <FormControl component="fieldset">
              {question.options.map((option, optIndex) => (
                <FormControlLabel
                  key={optIndex}
                  control={
                    <Checkbox
                      checked={answers[index].includes(optIndex.toString())}
                      onChange={(e) => handleMultipleAnswer(index, optIndex.toString())}
                      disabled={submitted}
                    />
                  }
                  label={option.text}
                />
              ))}
            </FormControl>
          )}

          {question.type === 'text' && (
            <TextField
              fullWidth
              multiline
              rows={2}
              value={answers[index]}
              onChange={(e) => handleTextAnswer(index, e.target.value)}
              disabled={submitted}
              placeholder="Введите ваш ответ"
            />
          )}
        </Box>
      ))}

      {!submitted ? (
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Завершить тест'}
          </Button>
        </Box>
      ) : (
        <Box mt={3}>
          <Alert severity={result.passed ? 'success' : 'error'} sx={{ mb: 2 }}>
            {result.passed
              ? `Поздравляем! Вы набрали ${result.score} баллов`
              : `Вы набрали ${result.score} баллов. Для прохождения нужно ${quiz.passingScore} баллов`}
          </Alert>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(-1)}
            fullWidth
          >
            Вернуться к уроку
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default QuizComponent; 