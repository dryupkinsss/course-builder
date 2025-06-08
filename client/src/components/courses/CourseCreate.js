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
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';

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
    quizzes: [],
    isPublished: true
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
        } else if (key === 'isPublished') {
          formDataToSend.append(key, prepareDataForBackend()[key]);
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 6 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 4 } }}>
        {/* Breadcrumbs и возврат назад */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIosNewIcon fontSize="small" />}
            onClick={() => navigate(-1)}
            sx={{ color: '#7c3aed', fontWeight: 500, textTransform: 'none', px: 0, minWidth: 0 }}
          >
            Назад к курсам
          </Button>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: -1 }}>
          Создание нового курса
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 4 }}>
          Заполните информацию о вашем курсе
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        <form onSubmit={handleSubmit}>
          {/* Основная информация */}
          <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 4, boxShadow: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Основная информация
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Заполните ключевые сведения о курсе
            </Typography>
            <TextField
              fullWidth
              label="Название курса *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="Введите название курса"
            />
            <TextField
              fullWidth
              label="Описание курса *"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              required
              multiline
              rows={4}
              placeholder="Расскажите о вашем курсе подробнее"
            />
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Обложка курса
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<SaveAltIcon />}
                  sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                >
                  Загрузить обложку
                  <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                </Button>
                {formData.thumbnail && (
                  <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                    <img
                      src={typeof formData.thumbnail === 'string' ? formData.thumbnail : URL.createObjectURL(formData.thumbnail)}
                      alt="Превью"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Категория *</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    label="Категория *"
                    onChange={handleChange}
                    required
                    displayEmpty
                    renderValue={(selected) =>
                      selected ? selected : <span style={{ color: '#888', fontWeight: 400 }}>Категория</span>
                    }
                  >
                    <MenuItem value="" disabled>
                      Категория
                    </MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Уровень сложности *</InputLabel>
                  <Select
                    name="level"
                    value={formData.level}
                    label="Уровень сложности *"
                    onChange={handleChange}
                    required
                    displayEmpty
                    renderValue={(selected) =>
                      selected ? levels.find(l => l.value === selected)?.label : <span style={{ color: '#888', fontWeight: 400 }}>Уровень сложности</span>
                    }
                  >
                    <MenuItem value="" disabled>
                      Уровень сложности
                    </MenuItem>
                    {levels.map(level => (
                      <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Цена курса (₽) *"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="Укажите стоимость или 0 для бесплатного"
            />
          </Paper>
          {/* Чему научатся студенты */}
          <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 4, boxShadow: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Чему научатся студенты
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Введите результат обучения для студентов
            </Typography>
            {formData.learningObjectives.map((objective, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  value={objective}
                  onChange={(e) => handleArrayChange(index, e.target.value, 'learningObjectives')}
                  placeholder="Введите результат обучения"
                  required
                />
                <IconButton
                  edge="end"
                  onClick={() => removeArrayItem(index, 'learningObjectives')}
                  disabled={formData.learningObjectives.length === 1}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={() => addArrayItem('learningObjectives')}
              sx={{ fontWeight: 600, textTransform: 'none', mb: 1 }}
            >
              Добавить результат обучения
            </Button>
          </Paper>
          {/* Требования */}
          <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 4, boxShadow: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Требования
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Укажите, что потребуется для прохождения курса
            </Typography>
            {formData.requirements.map((requirement, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  fullWidth
                  value={requirement}
                  onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                  placeholder="Введите требование"
                  required
                />
                <IconButton
                  edge="end"
                  onClick={() => removeArrayItem(index, 'requirements')}
                  disabled={formData.requirements.length === 1}
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={() => addArrayItem('requirements')}
              sx={{ fontWeight: 600, textTransform: 'none', mb: 1 }}
            >
              Добавить требование
            </Button>
          </Paper>
          {/* Модули курса */}
          <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 4, boxShadow: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Модули курса
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={handleAddModule}
                sx={{
                  background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                  color: '#fff',
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                  ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
                }}
              >
                Добавить модуль
              </Button>
            </Box>
            {modules.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 6 }}>
                Модули еще не добавлены
              </Typography>
            )}
            {modules.map((mod, idx) => (
              <Paper key={idx} sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{mod.title}</Typography>
                  <Button color="error" onClick={() => handleRemoveModule(idx)} sx={{ borderRadius: 2, textTransform: 'none' }}>Удалить</Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="outlined" onClick={() => handleOpenLesson(idx)} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    {mod.lesson ? 'Редактировать лекцию' : 'Добавить лекцию'}
                  </Button>
                  <Button variant="outlined" onClick={() => handleOpenQuiz(idx)} sx={{ borderRadius: 2, textTransform: 'none' }}>
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
          </Paper>
          {/* Кнопки действий */}
          <Box sx={{ mt: 6, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Сохранить черновик
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<LibraryAddCheckIcon />}
              disabled={loading}
              sx={{
                background: 'linear-gradient(90deg, #7c3aed 60%, #1976d2 100%)',
                color: '#fff',
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                ':hover': { background: 'linear-gradient(90deg, #6d28d9 60%, #1565c0 100%)' }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Создать курс'}
            </Button>
          </Box>
        </form>
      </Box>
      {/* Диалоги для лекции и теста */}
      <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 28, pb: 0 }}>Добавить лекцию</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
            Заполните информацию о лекции
          </Typography>
          <TextField
            fullWidth
            label="Название урока *"
            name="title"
            value={currentLesson.title}
            onChange={handleLessonChange}
            margin="normal"
            required
            placeholder="Введите название урока"
          />
          <TextField
            fullWidth
            label="Описание урока *"
            name="description"
            value={currentLesson.description}
            onChange={handleLessonChange}
            margin="normal"
            required
            multiline
            rows={3}
            placeholder="Кратко опишите содержание урока"
          />
          <TextField
            fullWidth
            label="Длительность (в минутах) *"
            name="duration"
            type="number"
            value={currentLesson.duration}
            onChange={handleLessonChange}
            margin="normal"
            required
            placeholder="Например, 45"
          />
          <Box sx={{ my: 2 }}>
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
                sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
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
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
            Дополнительные ресурсы
          </Typography>
          {currentLesson.resources.map((resource, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                value={resource}
                onChange={(e) => handleLessonResourceChange(index, e.target.value)}
                placeholder="Ссылка на ресурс (например, GitHub, документация)"
                required
              />
              <IconButton
                edge="end"
                onClick={() => removeLessonResource(index)}
                disabled={currentLesson.resources.length === 1}
                sx={{ ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={addLessonResource}
            sx={{ fontWeight: 600, textTransform: 'none', mb: 1 }}
          >
            Добавить ресурс
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setLessonDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Отмена
          </Button>
          <Button onClick={handleSaveLesson} variant="contained" sx={{
            background: 'linear-gradient(90deg, #7c3aed 60%, #1976d2 100%)',
            color: '#fff',
            borderRadius: 2,
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
            ':hover': { background: 'linear-gradient(90deg, #6d28d9 60%, #1565c0 100%)' }
          }}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 28, pb: 0 }}>Добавить тест</DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
            Заполните информацию о тесте и вопросы
          </Typography>
          <TextField
            label="Название теста *"
            value={currentQuiz.title}
            onChange={e => handleQuizChange('title', e.target.value)}
            fullWidth
            margin="normal"
            required
            placeholder="Введите название теста"
          />
          {currentQuiz.questions.map((q, qIdx) => (
            <Box key={qIdx} sx={{ mb: 3, p: 2, borderLeft: '3px solid #e0e7ff', bgcolor: '#f8fafc', borderRadius: 2 }}>
              <TextField
                label={`Вопрос ${qIdx + 1}`}
                value={q.question}
                onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
                required
                placeholder="Введите текст вопроса"
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {q.options.map((opt, optIdx) => (
                  <TextField
                    key={optIdx}
                    label={`Вариант ${optIdx + 1}`}
                    value={typeof opt === 'object' ? opt.text : opt}
                    onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                    sx={{ width: { xs: '100%', sm: '45%' }, mb: 1 }}
                    required
                    placeholder={`Вариант ${optIdx + 1}`}
                  />
                ))}
              </Box>
              <TextField
                select
                label="Правильный вариант"
                value={q.correctOption}
                onChange={e => handleCorrectOptionChange(qIdx, Number(e.target.value))}
                SelectProps={{ native: true }}
                sx={{ width: 220 }}
              >
                {q.options.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    {typeof opt === 'object' ? opt.text : opt || `Вариант ${idx + 1}`}
                  </option>
                ))}
              </TextField>
            </Box>
          ))}
          <Button variant="outlined" onClick={handleAddQuestion} startIcon={<AddIcon />} sx={{ mt: 1, fontWeight: 600, textTransform: 'none' }}>Добавить вопрос</Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setQuizDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Отмена
          </Button>
          <Button onClick={handleSaveQuiz} variant="contained" sx={{
            background: 'linear-gradient(90deg, #7c3aed 60%, #1976d2 100%)',
            color: '#fff',
            borderRadius: 2,
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
            ':hover': { background: 'linear-gradient(90deg, #6d28d9 60%, #1565c0 100%)' }
          }}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseCreate; 