import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { coursesAPI } from '../../services/api';

const categories = [
  'Программирование',
  'Дизайн',
  'Маркетинг',
  'Бизнес',
  'Языки'
];

const levels = [
  { label: 'Начальный', value: 'beginner' },
  { label: 'Средний', value: 'intermediate' },
  { label: 'Продвинутый', value: 'advanced' }
];

const CourseCreate = () => {
  const navigate = useNavigate();
  // Вернуть состояния для ошибок и загрузки
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Новый тип модуля
  const emptyModule = (index) => ({
    title: `Модуль ${index + 1}`,
    lesson: null,
    quiz: null
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    price: '',
    thumbnail: null,
    requirements: [''],
    learningObjectives: [''],
    lessons: [],
    quizzes: []
  });

  // Инициализация состояния для модулей
  const [modules, setModules] = useState([]);
  const [editingModuleIndex, setEditingModuleIndex] = useState(-1);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  
  // Инициализация состояния для текущего урока и теста
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    duration: '',
    video: null,
    resources: [''],
    order: 1
  });
  
  const [currentQuiz, setCurrentQuiz] = useState({
    title: '',
    description: '',
    questions: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        thumbnail: file
      });
    }
  };

  const handleArrayChange = (index, value, field) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const addArrayItem = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removeArrayItem = (index, field) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setCurrentLesson({
      ...currentLesson,
      [name]: value
    });
  };

  const handleLessonFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentLesson({
        ...currentLesson,
        video: file
      });
    }
  };

  const handleLessonResourceChange = (index, value) => {
    const newResources = [...currentLesson.resources];
    newResources[index] = value;
    setCurrentLesson({
      ...currentLesson,
      resources: newResources
    });
  };

  const addLessonResource = () => {
    setCurrentLesson({
      ...currentLesson,
      resources: [...currentLesson.resources, '']
    });
  };

  const removeLessonResource = (index) => {
    const newResources = currentLesson.resources.filter((_, i) => i !== index);
    setCurrentLesson({
      ...currentLesson,
      resources: newResources
    });
  };

  const handleQuizChange = (field, value) => {
    setCurrentQuiz(prev => ({ ...prev, [field]: value }));
  };

  const handleAddQuestion = () => {
    setCurrentQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: '', options: ['', '', '', ''], correctOption: 0 }
      ]
    }));
  };

  const handleQuestionChange = (qIdx, field, value) => {
    setCurrentQuiz(prev => {
      const questions = [...prev.questions];
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      return { ...prev, questions };
    });
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    setCurrentQuiz(prev => {
      const questions = [...prev.questions];
      const options = [...questions[qIdx].options];
      const currentOption = options[optIdx];
      if (typeof currentOption === 'object') {
        options[optIdx] = { ...currentOption, text: value };
      } else {
        options[optIdx] = value;
      }
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });
  };

  const handleCorrectOptionChange = (qIdx, value) => {
    setCurrentQuiz(prev => {
      const questions = [...prev.questions];
      questions[qIdx] = { ...questions[qIdx], correctOption: value };
      return { ...prev, questions };
    });
  };

  // Добавить модуль
  const handleAddModule = () => {
    setModules([...modules, emptyModule(modules.length)]);
  };

  // Открыть форму лекции для модуля
  const handleOpenLesson = (idx) => {
    setEditingModuleIndex(idx);
    setCurrentLesson(modules[idx].lesson || {
      title: '', description: '', duration: '', video: null, resources: [''], order: 1
    });
    setLessonDialogOpen(true);
  };

  // Открыть форму теста для модуля
  const handleOpenQuiz = (idx) => {
    setEditingModuleIndex(idx);
    setCurrentQuiz(modules[idx].quiz || {
      title: '', questions: []
    });
    setQuizDialogOpen(true);
  };

  // Сохранить лекцию в модуле
  const handleSaveLesson = () => {
    const newModules = [...modules];
    newModules[editingModuleIndex].lesson = currentLesson;
    setModules(newModules);
    setLessonDialogOpen(false);
  };

  // Сохранить тест в модуле
  const handleSaveQuiz = () => {
    const newModules = [...modules];
    newModules[editingModuleIndex].quiz = {
      ...currentQuiz,
      order: editingModuleIndex + 1
    };
    setModules(newModules);
    setQuizDialogOpen(false);
  };

  // Удалить модуль
  const handleRemoveModule = (idx) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  // Преобразование для бэкенда
  const prepareDataForBackend = () => {
    const lessons = modules.map((m, i) => m.lesson ? { ...m.lesson, order: i + 1 } : null).filter(Boolean);
    const quizzes = modules.map((m, i) => m.quiz ? { ...m.quiz, order: i + 1 } : null).filter(Boolean);
    return { ...formData, lessons, quizzes };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Валидация
    if (!formData.title || !formData.description || !formData.category || !formData.level) {
      setError('Пожалуйста, заполните все обязательные поля');
      setLoading(false);
      return;
    }

    if (formData.requirements.some(req => !req) || formData.learningObjectives.some(obj => !obj)) {
      setError('Пожалуйста, заполните все требования и цели обучения');
      setLoading(false);
      return;
    }

    // Новая валидация для модулей
    if (!modules.some(m => m.lesson || m.quiz)) {
      setError('Пожалуйста, добавьте хотя бы один модуль с лекцией или тестом');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(prepareDataForBackend()).forEach(key => {
        if (key === 'requirements' || key === 'learningObjectives') {
          formDataToSend.append(key, JSON.stringify(prepareDataForBackend()[key]));
        } else if (key === 'price') {
          formDataToSend.append(key, Number(prepareDataForBackend()[key]));
        } else if (key === 'thumbnail' && prepareDataForBackend()[key]) {
          formDataToSend.append('thumbnail', prepareDataForBackend()[key]);
        } else if (key === 'lessons') {
          // Добавляем уроки без видео
          const lessonsWithoutVideos = prepareDataForBackend()[key].map(lesson => ({
            ...lesson,
            video: null
          }));
          formDataToSend.append(key, JSON.stringify(lessonsWithoutVideos));
          
          // Добавляем видео уроков
          prepareDataForBackend()[key].forEach((lesson, index) => {
            if (lesson.video) {
              formDataToSend.append('lessonVideos', lesson.video);
            }
          });
        } else if (key === 'quizzes') {
          formDataToSend.append('quizzes', JSON.stringify(prepareDataForBackend()[key]));
        } else if (key !== 'thumbnail') {
          formDataToSend.append(key, prepareDataForBackend()[key]);
        }
      });

      await coursesAPI.create(formDataToSend);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при создании курса');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Создание нового курса
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Название курса"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Описание курса"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            required
            multiline
            rows={4}
          />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Категория</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Категория"
                  onChange={handleChange}
                  required
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Уровень сложности</InputLabel>
                <Select
                  name="level"
                  value={formData.level}
                  label="Уровень сложности"
                  onChange={handleChange}
                  required
                >
                  {levels.map(level => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Цена курса (₽)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            margin="normal"
            required
          />

          <Box sx={{ mt: 2, mb: 3 }}>
            <input
              accept="image/*"
              type="file"
              id="thumbnail-upload"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="thumbnail-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddIcon />}
              >
                Загрузить обложку курса
              </Button>
            </label>
            {formData.thumbnail && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Выбрано: {formData.thumbnail.name}
              </Typography>
            )}
          </Box>

          <Typography variant="h6" gutterBottom>
            Требования к курсу
          </Typography>
          <List>
            {formData.requirements.map((requirement, index) => (
              <ListItem key={index}>
                <TextField
                  fullWidth
                  value={requirement}
                  onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                  placeholder="Введите требование"
                  required
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeArrayItem(index, 'requirements')}
                    disabled={formData.requirements.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            startIcon={<AddIcon />}
            onClick={() => addArrayItem('requirements')}
            sx={{ mb: 3 }}
          >
            Добавить требование
          </Button>

          <Typography variant="h6" gutterBottom>
            Чему научатся студенты
          </Typography>
          <List>
            {formData.learningObjectives.map((objective, index) => (
              <ListItem key={index}>
                <TextField
                  fullWidth
                  value={objective}
                  onChange={(e) => handleArrayChange(index, e.target.value, 'learningObjectives')}
                  placeholder="Введите цель обучения"
                  required
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeArrayItem(index, 'learningObjectives')}
                    disabled={formData.learningObjectives.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            startIcon={<AddIcon />}
            onClick={() => addArrayItem('learningObjectives')}
            sx={{ mb: 3 }}
          >
            Добавить цель обучения
          </Button>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Управление модулями
          </Typography>
          <Button variant="contained" onClick={handleAddModule} sx={{ mb: 2 }}>
            Добавить модуль
          </Button>
          {modules.length === 0 && (
            <Alert severity="info">Добавьте хотя бы один модуль</Alert>
          )}
          {modules.map((mod, idx) => (
            <Paper key={idx} sx={{ mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">{mod.title}</Typography>
                <Button color="error" onClick={() => handleRemoveModule(idx)}>Удалить модуль</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant="outlined" onClick={() => handleOpenLesson(idx)}>
                  {mod.lesson ? 'Редактировать лекцию' : 'Добавить лекцию'}
                </Button>
                <Button variant="outlined" onClick={() => handleOpenQuiz(idx)}>
                  {mod.quiz ? 'Редактировать тест' : 'Добавить тест'}
                </Button>
              </Box>
              {mod.lesson && (
                <Box sx={{ mt: 2, ml: 2 }}>
                  <Typography variant="body2">Лекция: {mod.lesson.title}</Typography>
                </Box>
              )}
              {mod.quiz && (
                <Box sx={{ mt: 1, ml: 2 }}>
                  <Typography variant="body2">Тест: {mod.quiz.title}</Typography>
                </Box>
              )}
            </Paper>
          ))}

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Создать курс'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard')}
            >
              Отмена
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Диалоги для лекции и теста */}
      <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Лекция</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название урока"
            name="title"
            value={currentLesson.title}
            onChange={handleLessonChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Описание урока"
            name="description"
            value={currentLesson.description}
            onChange={handleLessonChange}
            margin="normal"
            required
            multiline
            rows={4}
          />

          <TextField
            fullWidth
            label="Длительность (в минутах)"
            name="duration"
            type="number"
            value={currentLesson.duration}
            onChange={handleLessonChange}
            margin="normal"
            required
          />

          <Box sx={{ mt: 2, mb: 3 }}>
            <input
              accept="video/*"
              type="file"
              id="video-upload"
              onChange={handleLessonFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddIcon />}
              >
                Загрузить видео урока
              </Button>
            </label>
            {currentLesson.video && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Выбрано: {currentLesson.video.name}
              </Typography>
            )}
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Дополнительные ресурсы
          </Typography>
          <List>
            {currentLesson.resources.map((resource, index) => (
              <ListItem key={index}>
                <TextField
                  fullWidth
                  value={resource}
                  onChange={(e) => handleLessonResourceChange(index, e.target.value)}
                  placeholder="Ссылка на ресурс (например, GitHub, документация)"
                  required
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeLessonResource(index)}
                    disabled={currentLesson.resources.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            startIcon={<AddIcon />}
            onClick={addLessonResource}
            sx={{ mb: 3 }}
          >
            Добавить ресурс
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLessonDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveLesson} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Тест</DialogTitle>
        <DialogContent>
          <TextField
            label="Название теста"
            value={currentQuiz.title}
            onChange={e => handleQuizChange('title', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {currentQuiz.questions.map((q, qIdx) => (
            <Box key={qIdx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
              <TextField
                label={`Вопрос ${qIdx + 1}`}
                value={q.question}
                onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
              />
              {q.options.map((opt, optIdx) => (
                <TextField
                  key={optIdx}
                  label={`Вариант ${optIdx + 1}`}
                  value={typeof opt === 'object' ? opt.text : opt}
                  onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                  sx={{ mr: 1, mb: 1, width: '45%' }}
                />
              ))}
              <TextField
                select
                label="Правильный вариант"
                value={q.correctOption}
                onChange={e => handleCorrectOptionChange(qIdx, Number(e.target.value))}
                SelectProps={{ native: true }}
                sx={{ width: 200 }}
              >
                {q.options.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    {typeof opt === 'object' ? opt.text : opt || `Вариант ${idx + 1}`}
                  </option>
                ))}
              </TextField>
            </Box>
          ))}
          <Button variant="outlined" onClick={handleAddQuestion} sx={{ mt: 1 }}>Добавить вопрос</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuizDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveQuiz} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseCreate; 