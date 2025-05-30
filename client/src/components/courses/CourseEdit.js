import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    price: '',
    thumbnail: null,
    requirements: [''],
    learningObjectives: [''],
    lessons: []
  });

  // Состояние для диалога создания/редактирования урока
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    duration: '',
    video: null,
    resources: [''],
    order: 1
  });
  const [editingLessonIndex, setEditingLessonIndex] = useState(-1);

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
          lessons: Array.isArray(course.lessons) ? course.lessons : []
        };

        console.log('Setting form data:', newFormData);
        setFormData(newFormData);
      } catch (err) {
        console.error('Error loading course:', err);
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
      // Сохраняем только имя файла, так как это временный файл
      setCurrentLesson({
        ...currentLesson,
        video: file.name
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

  const openLessonDialog = (index = -1) => {
    if (index >= 0) {
      const lesson = formData.lessons[index];
      setCurrentLesson({
        ...lesson,
        resources: Array.isArray(lesson.resources) ? lesson.resources : ['']
      });
      setEditingLessonIndex(index);
    } else {
      setCurrentLesson({
        title: '',
        description: '',
        duration: '',
        video: null,
        resources: [''],
        order: formData.lessons.length + 1
      });
      setEditingLessonIndex(-1);
    }
    setLessonDialogOpen(true);
  };

  const handleLessonSubmit = () => {
    if (!currentLesson.title || !currentLesson.description || !currentLesson.duration) {
      setError('Пожалуйста, заполните все обязательные поля урока');
      return;
    }

    const newLessons = [...formData.lessons];
    const lessonToAdd = {
      ...currentLesson,
      video: currentLesson.video ? (typeof currentLesson.video === 'string' ? currentLesson.video : '') : '',
      resources: Array.isArray(currentLesson.resources) ? currentLesson.resources.filter(Boolean) : ['']
    };

    if (editingLessonIndex >= 0) {
      newLessons[editingLessonIndex] = lessonToAdd;
    } else {
      newLessons.push(lessonToAdd);
    }

    setFormData({
      ...formData,
      lessons: newLessons
    });

    setLessonDialogOpen(false);
  };

  const removeLesson = (index) => {
    const newLessons = formData.lessons.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      lessons: newLessons
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
    setSaving(true);
    setError('');
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'requirements' || key === 'learningObjectives') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'price') {
          formDataToSend.append(key, Number(formData[key]));
        } else if (key === 'thumbnail' && formData[key]) {
          formDataToSend.append('thumbnail', formData[key]);
        } else if (key === 'lessons') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key !== 'thumbnail') {
          formDataToSend.append(key, formData[key]);
        }
      });

      await coursesAPI.update(id, formDataToSend);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при сохранении изменений');
    } finally {
      setSaving(false);
    }
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
            Уроки курса
          </Typography>
          <List>
            {formData?.lessons?.map((lesson, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${index + 1}. ${lesson.title}`}
                  secondary={`${lesson.duration} минут`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => openLessonDialog(index)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => removeLesson(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            startIcon={<AddIcon />}
            onClick={() => openLessonDialog()}
            sx={{ mb: 3 }}
          >
            Добавить урок
          </Button>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Сохранить изменения'}
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

      {/* Диалог создания/редактирования урока */}
      <Dialog
        open={lessonDialogOpen}
        onClose={() => setLessonDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLessonIndex >= 0 ? 'Редактирование урока' : 'Создание нового урока'}
        </DialogTitle>
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

          <Box sx={{ mt: 2 }}>
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
                Загрузить видео
              </Button>
            </label>
            {currentLesson.video && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Выбрано: {currentLesson.video}
              </Typography>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Ресурсы урока
          </Typography>
          <List>
            {currentLesson.resources.map((resource, index) => (
              <ListItem key={index}>
                <TextField
                  fullWidth
                  value={resource}
                  onChange={(e) => handleLessonResourceChange(index, e.target.value)}
                  placeholder="Введите ссылку на ресурс"
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
          <Button onClick={handleLessonSubmit} variant="contained">
            {editingLessonIndex >= 0 ? 'Сохранить изменения' : 'Добавить урок'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseEdit; 