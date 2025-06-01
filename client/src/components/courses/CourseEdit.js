import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemSecondaryAction,
  IconButton
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

const CourseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  // Новый тип модуля
  const emptyModule = (index) => ({
    title: `Модуль ${index + 1}`,
    lesson: null,
    quiz: null
  });

  const emptyQuiz = () => ({
    title: '',
    description: '',
    questions: [],
    passingScore: 1
  });

  const [modules, setModules] = useState([]);
  const [editingModuleIndex, setEditingModuleIndex] = useState(-1);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
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

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        console.log('Fetching course with ID:', id);
        const response = await coursesAPI.getById(id);
        console.log('Course data received:', response.data);
        
        const course = response.data;
        if (!course) {
          console.error('No course data received');
          setError('Курс не найден');
          return;
        }

        const newFormData = {
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          level: course.level || '',
          price: course.price || '',
          thumbnail: course.thumbnail || null,
          requirements: Array.isArray(course.requirements) ? course.requirements : [''],
          learningObjectives: Array.isArray(course.learningObjectives) ? course.learningObjectives : [''],
          lessons: Array.isArray(course.lessons) ? course.lessons : [],
          quizzes: Array.isArray(course.quizzes) ? course.quizzes : []
        };

        // Формируем модули из уроков и тестов
        const lessons = Array.isArray(course.lessons) ? course.lessons : [];
        const quizzes = Array.isArray(course.quizzes) ? course.quizzes : [];
        
        console.log('Loaded lessons:', lessons);
        console.log('Loaded quizzes:', quizzes);
        
        // Создаем массив модулей максимальной длины
        const maxLength = Math.max(lessons.length, quizzes.length);
        const loadedModules = [];

        // Заполняем модули данными
        for (let i = 0; i < maxLength; i++) {
          const module = {
            title: `Модуль ${i + 1}`,
            lesson: lessons[i] || null,
            quiz: null
          };

          // Находим тест для текущего модуля
          const moduleQuiz = quizzes.find(q => {
            // Если у теста нет order, используем индекс в массиве + 1
            const quizOrder = q.order || (quizzes.indexOf(q) + 1);
            return quizOrder === i + 1;
          });

          if (moduleQuiz) {
            module.quiz = {
              ...moduleQuiz,
              order: moduleQuiz.order || (quizzes.indexOf(moduleQuiz) + 1),
              questions: moduleQuiz.questions.map(q => ({
                question: q.question,
                type: q.type || 'single',
                options: q.options.map((opt, idx) => ({
                  text: typeof opt === 'object' ? opt.text : opt,
                  isCorrect: idx === q.correctOption
                })),
                correctOption: q.correctOption
              }))
            };
          }

          loadedModules.push(module);
        }

        // Если нет модулей, создаем один пустой
        if (loadedModules.length === 0) {
          loadedModules.push(emptyModule(0));
        }

        console.log('Loaded modules:', loadedModules);
        setModules(loadedModules);
        setFormData(newFormData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Ошибка при загрузке курса');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        thumbnail: file
      });
    }
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

    // Проверяем, что есть хотя бы один модуль с уроком или тестом
    if (!modules.some(module => module.lesson || module.quiz)) {
      setError('Добавьте хотя бы один урок или тест');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      const backendData = prepareDataForBackend();

      // Добавляем основные данные курса
      Object.keys(backendData).forEach(key => {
        if (key === 'requirements' || key === 'learningObjectives') {
          formDataToSend.append(key, JSON.stringify(backendData[key]));
        } else if (key === 'price') {
          formDataToSend.append(key, Number(backendData[key]));
        } else if (key === 'thumbnail' && backendData[key]) {
          formDataToSend.append('thumbnail', backendData[key]);
        } else if (key === 'lessons') {
          // Сначала собираем все видео файлы
          const lessonsWithVideoPaths = backendData[key].map((lesson, index) => {
            if (lesson.video instanceof File) {
              // Добавляем видео файл с правильным именем поля
              formDataToSend.append('lessonVideos', lesson.video);
              return {
                ...lesson,
                video: null,
                videoIndex: index // Сохраняем индекс для сопоставления на сервере
              };
            }
            return {
              ...lesson,
              video: lesson.video instanceof File ? null : lesson.video
            };
          });

          // Добавляем уроки с индексами видео
          formDataToSend.append(key, JSON.stringify(lessonsWithVideoPaths));
        } else if (key === 'quizzes') {
          formDataToSend.append(key, JSON.stringify(backendData[key]));
        } else if (key !== 'thumbnail') {
          formDataToSend.append(key, backendData[key]);
        }
      });

      console.log('Sending data to backend:', {
        lessons: JSON.parse(formDataToSend.get('lessons')),
        quizzes: JSON.parse(formDataToSend.get('quizzes'))
      });

      const response = await coursesAPI.update(id, formDataToSend);

      // Обновляем состояние после успешного сохранения
      const updatedCourse = response.data;
      setFormData({
        ...formData,
        modules: updatedCourse.modules || []
      });

      // Показываем сообщение об успехе
      setSuccess('Курс успешно обновлен');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err.response?.data?.message || 'Ошибка при обновлении курса');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizChange = (field, value) => {
    setCurrentQuiz(prev => ({ ...prev, [field]: value }));
  };

  const handleAddQuestion = () => {
    setCurrentQuiz(prev => ({
      ...prev,
      questions: Array.isArray(prev.questions)
        ? [...prev.questions, { question: '', options: ['', '', '', ''], correctOption: 0 }]
        : [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
    }));
  };

  const handleQuestionChange = (qIdx, field, value) => {
    setCurrentQuiz(prev => {
      const questions = Array.isArray(prev.questions) ? [...prev.questions] : [];
      if (!questions[qIdx]) questions[qIdx] = { question: '', options: ['', '', '', ''], correctOption: 0 };
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      return { ...prev, questions };
    });
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    setCurrentQuiz(prev => {
      const questions = Array.isArray(prev.questions) ? [...prev.questions] : [];
      if (!questions[qIdx]) questions[qIdx] = { question: '', options: ['', '', '', ''], correctOption: 0 };
      const options = Array.isArray(questions[qIdx].options) ? [...questions[qIdx].options] : ['', '', '', ''];
      const currentOption = options[optIdx];
      options[optIdx] = typeof currentOption === 'object' ? { ...currentOption, text: value } : value;
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });
  };

  const handleCorrectOptionChange = (qIdx, value) => {
    setCurrentQuiz(prev => {
      const questions = Array.isArray(prev.questions) ? [...prev.questions] : [];
      if (!questions[qIdx]) questions[qIdx] = { question: '', options: ['', '', '', ''], correctOption: 0 };
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
    const module = modules[idx];
    setCurrentLesson(module.lesson || {
      title: '',
      description: '',
      duration: '',
      video: null,
      resources: [''],
      order: idx + 1
    });
    setLessonDialogOpen(true);
  };

  // Открыть форму теста для модуля
  const handleOpenQuiz = (idx) => {
    setEditingModuleIndex(idx);
    const module = modules[idx];
    console.log('Opening quiz form for module:', module);
    
    // Если в модуле уже есть тест, используем его данные
    if (module.quiz) {
      console.log('Existing quiz data:', module.quiz);
      setCurrentQuiz({
        title: module.quiz.title || '',
        description: module.quiz.description || '',
        passingScore: module.quiz.passingScore || 1,
        questions: module.quiz.questions.map(q => ({
          question: q.question,
          type: q.type || 'single',
          options: q.options.map((opt, idx) => ({
            text: typeof opt === 'object' ? opt.text : opt,
            isCorrect: idx === q.correctOption
          })),
          correctOption: q.correctOption
        }))
      });
    } else {
      // Если теста нет, создаем новый
      setCurrentQuiz(emptyQuiz());
    }
    setQuizDialogOpen(true);
  };

  // Сохранить лекцию в модуле
  const handleSaveLesson = () => {
    if (!currentLesson.title || !currentLesson.description || !currentLesson.duration) {
      setError('Пожалуйста, заполните все обязательные поля лекции');
      return;
    }

    const newModules = [...modules];
    newModules[editingModuleIndex] = {
      ...newModules[editingModuleIndex],
      lesson: {
        ...currentLesson,
        order: editingModuleIndex + 1
      }
    };
    setModules(newModules);
    setLessonDialogOpen(false);
  };

  // Сохранить тест в модуле
  const handleSaveQuiz = () => {
    // Валидация
    if (!currentQuiz.title) {
      setError('Пожалуйста, введите название теста');
      return;
    }

    if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
      setError('Пожалуйста, добавьте хотя бы один вопрос');
      return;
    }

    // Проверяем каждый вопрос
    for (const q of currentQuiz.questions) {
      if (!q.question) {
        setError('Пожалуйста, заполните текст вопроса');
        return;
      }

      if (!q.options || q.options.length < 2) {
        setError('Пожалуйста, добавьте хотя бы два варианта ответа');
        return;
      }

      // Проверяем, что все варианты ответов заполнены
      for (const opt of q.options) {
        if (!opt || (typeof opt === 'object' && !opt.text)) {
          setError('Пожалуйста, заполните все варианты ответов');
          return;
        }
      }

      // Проверяем, что выбран правильный ответ
      if (q.correctOption === undefined || q.correctOption === null) {
        setError('Пожалуйста, выберите правильный ответ');
        return;
      }
    }

    // Форматируем данные теста
    const formattedQuiz = {
      title: currentQuiz.title,
      description: currentQuiz.description || '',
      passingScore: currentQuiz.passingScore || 1,
      order: editingModuleIndex + 1,
      questions: currentQuiz.questions.map(q => ({
        question: q.question,
        type: q.type || 'single',
        options: q.options.map((opt, idx) => ({
          text: typeof opt === 'object' ? opt.text : opt,
          isCorrect: idx === q.correctOption
        })),
        correctOption: q.correctOption
      }))
    };

    console.log('Saving formatted quiz:', formattedQuiz);

    // Обновляем модули
    const newModules = [...modules];
    newModules[editingModuleIndex] = {
      ...newModules[editingModuleIndex],
      quiz: formattedQuiz
    };
    setModules(newModules);

    // Закрываем диалог
    setQuizDialogOpen(false);
    setCurrentQuiz(emptyQuiz());
  };

  // Удалить модуль
  const handleRemoveModule = (idx) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  // Преобразование для бэкенда
  const prepareDataForBackend = () => {
    const data = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      level: formData.level,
      price: formData.price,
      requirements: formData.requirements,
      learningObjectives: formData.learningObjectives,
      lessons: [],
      quizzes: []
    };

    // Добавляем уроки
    modules.forEach((module, index) => {
      if (module.lesson) {
        const lessonData = {
          title: module.lesson.title,
          description: module.lesson.description,
          duration: module.lesson.duration,
          order: index + 1,
          resources: module.lesson.resources || []
        };

        // Если есть новое видео, используем его
        if (module.lesson.video instanceof File) {
          lessonData.video = module.lesson.video;
        } 
        // Если есть существующее видео, используем его путь
        else if (module.lesson.video) {
          lessonData.video = module.lesson.video;
        }

        data.lessons.push(lessonData);
      }
    });

    // Добавляем тесты
    modules.forEach((module, index) => {
      if (module.quiz) {
        data.quizzes.push({
          title: module.quiz.title,
          description: module.quiz.description,
          questions: module.quiz.questions.map(q => ({
            question: q.question,
            type: q.type || 'single',
            options: q.options.map((opt, idx) => ({
              text: typeof opt === 'object' ? opt.text : opt,
              isCorrect: idx === q.correctOption
            })),
            correctOption: q.correctOption,
            points: 1
          })),
          passingScore: module.quiz.passingScore || 1,
          order: index + 1
        });
      }
    });

    return data;
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
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container>
        <Alert severity="success" sx={{ mt: 4 }}>
          {success}
        </Alert>
      </Container>
    );
  }

  console.log('Current formData:', formData);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Редактирование курса
        </Typography>
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
            {formData.thumbnail instanceof File && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Выбрано: {formData.thumbnail.name}
                </Typography>
                <Box
                  component="img"
                  src={URL.createObjectURL(formData.thumbnail)}
                  alt="Предпросмотр обложки"
                  sx={{
                    mt: 1,
                    maxWidth: '200px',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                />
              </Box>
            )}
            {formData.thumbnail && typeof formData.thumbnail === 'string' && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Текущая обложка: {formData.thumbnail.split('/').pop()}
                </Typography>
                <Box
                  component="img"
                  src={`http://localhost:5000/${formData.thumbnail}`}
                  alt="Обложка курса"
                  sx={{
                    mt: 1,
                    maxWidth: '200px',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                />
              </Box>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Требования к курсу
          </Typography>
          <Box>
            {formData.requirements.map((requirement, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  value={requirement}
                  onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                  placeholder="Введите требование"
                  required
                />
                <Button
                  onClick={() => removeArrayItem(index, 'requirements')}
                  disabled={formData.requirements.length === 1}
                  sx={{ ml: 1 }}
                >
                  Удалить
                </Button>
              </Box>
            ))}
            <Button onClick={() => addArrayItem('requirements')} sx={{ mb: 3 }}>
              Добавить требование
            </Button>
          </Box>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Чему научатся студенты
          </Typography>
          <Box>
            {formData.learningObjectives.map((objective, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  value={objective}
                  onChange={(e) => handleArrayChange(index, e.target.value, 'learningObjectives')}
                  placeholder="Введите цель обучения"
                  required
                />
                <Button
                  onClick={() => removeArrayItem(index, 'learningObjectives')}
                  disabled={formData.learningObjectives.length === 1}
                  sx={{ ml: 1 }}
                >
                  Удалить
                </Button>
              </Box>
            ))}
            <Button onClick={() => addArrayItem('learningObjectives')} sx={{ mb: 3 }}>
              Добавить цель обучения
            </Button>
          </Box>
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
                  <Typography variant="body2">Лекция: {mod.lesson?.title || ''}</Typography>
                </Box>
              )}
              {mod.quiz && (
                <Box sx={{ mt: 1, ml: 2 }}>
                  <Typography variant="body2">Тест: {mod.quiz?.title || ''}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Вопросов: {mod.quiz?.questions?.length || 0}
                  </Typography>
                </Box>
              )}
            </Paper>
          ))}
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
            >
              Сохранить изменения
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
            {(currentLesson.resources || []).map((resource, index) => (
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
                    disabled={(currentLesson.resources || []).length === 1}
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
            value={currentQuiz?.title || ''}
            onChange={e => handleQuizChange('title', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {(currentQuiz?.questions || []).map((q, qIdx) => (
            <Box key={qIdx} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
              <TextField
                label={`Вопрос ${qIdx + 1}`}
                value={q?.question || ''}
                onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
              />
              {(q?.options || []).map((opt, optIdx) => (
                <TextField
                  key={optIdx}
                  label={`Вариант ${optIdx + 1}`}
                  value={typeof opt === 'object' ? opt.text : opt || ''}
                  onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                  sx={{ mr: 1, mb: 1, width: '45%' }}
                />
              ))}
              <TextField
                select
                label="Правильный вариант"
                value={q?.correctOption ?? 0}
                onChange={e => handleCorrectOptionChange(qIdx, Number(e.target.value))}
                SelectProps={{ native: true }}
                sx={{ width: 200 }}
              >
                {(q?.options || []).map((opt, idx) => (
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

export default CourseEdit; 