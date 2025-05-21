import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { assessmentAPI } from '../../services/api';

const Assessment = () => {
  const { user } = useSelector((state) => state.auth);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchAssessment();
  }, []);

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const fetchAssessment = async () => {
    try {
      const response = await assessmentAPI.getCurrent();
      setAssessment(response.data);
      setTimeLeft(response.data.timeLimit * 60); // Convert minutes to seconds
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке теста');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await assessmentAPI.submit(assessment._id, answers);
      setResults(response.data);
      setSubmitted(true);
    } catch (err) {
      setError('Ошибка при отправке ответов');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (submitted && results) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Результаты теста
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              Оценка: {results.score}%
            </Typography>
            <Typography color="text.secondary">
              Правильных ответов: {results.correctAnswers} из {assessment.questions.length}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <List>
            {assessment.questions.map((question, index) => (
              <ListItem key={question._id}>
                <ListItemIcon>
                  {results.answers[question._id] === question.correctAnswer ? (
                    <CheckIcon color="success" />
                  ) : (
                    <CloseIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`Вопрос ${index + 1}: ${question.text}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        Ваш ответ: {results.answers[question._id]}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Правильный ответ: {question.correctAnswer}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {assessment.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon />
            <Typography>
              {formatTime(timeLeft)}
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {assessment.questions.map((_, index) => (
            <Step key={index}>
              <StepLabel>Вопрос {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Вопрос {activeStep + 1}
          </Typography>
          <Typography variant="body1" paragraph>
            {assessment.questions[activeStep].text}
          </Typography>

          {assessment.questions[activeStep].type === 'multiple_choice' ? (
            <FormControl component="fieldset">
              <RadioGroup
                value={answers[assessment.questions[activeStep]._id] || ''}
                onChange={(e) => handleAnswerChange(assessment.questions[activeStep]._id, e.target.value)}
              >
                {assessment.questions[activeStep].options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          ) : assessment.questions[activeStep].type === 'checkbox' ? (
            <FormControl component="fieldset">
              {assessment.questions[activeStep].options.map((option) => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={answers[assessment.questions[activeStep]._id]?.includes(option) || false}
                      onChange={(e) => {
                        const currentAnswers = answers[assessment.questions[activeStep]._id] || [];
                        const newAnswers = e.target.checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter(a => a !== option);
                        handleAnswerChange(assessment.questions[activeStep]._id, newAnswers);
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormControl>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={answers[assessment.questions[activeStep]._id] || ''}
              onChange={(e) => handleAnswerChange(assessment.questions[activeStep]._id, e.target.value)}
              placeholder="Введите ваш ответ..."
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Назад
          </Button>
          {activeStep === assessment.questions.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== assessment.questions.length}
            >
              Завершить тест
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!answers[assessment.questions[activeStep]._id]}
            >
              Далее
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Assessment; 