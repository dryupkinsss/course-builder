import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { lessonsAPI, coursesAPI } from '../../services/api';

const LessonEdit = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    video: null,
    resources: [''],
    order: 1
  });

  useEffect(() => {
    fetchData();
  }, [courseId, lessonId]);

  const fetchData = async () => {
    try {
      const [courseResponse, lessonResponse] = await Promise.all([
        coursesAPI.getById(courseId),
        lessonsAPI.getById(lessonId)
      ]);
      
      setCourse(courseResponse.data);
      const lesson = lessonResponse.data;
      
      setFormData({
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        video: null, // Не загружаем видео, так как оно уже есть
        resources: lesson.resources || [''],
        order: lesson.order
      });
      
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      setLoading(false);
    }
  };

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
        video: file
      });
    }
  };

  const handleResourceChange = (index, value) => {
    const newResources = [...formData.resources];
    newResources[index] = value;
    setFormData({
      ...formData,
      resources: newResources
    });
  };

  const addResource = () => {
    setFormData({
      ...formData,
      resources: [...formData.resources, '']
    });
  };

  const removeResource = (index) => {
    const newResources = formData.resources.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      resources: newResources
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Валидация
    if (!formData.title || !formData.description || !formData.duration) {
      setError('Пожалуйста, заполните все обязательные поля');
      setSaving(false);
      return;
    }

    if (formData.resources.some(resource => !resource)) {
      setError('Пожалуйста, заполните все ссылки на ресурсы или удалите пустые');
      setSaving(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'resources') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'video' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (key !== 'video') {
          formDataToSend.append(key, formData[key]);
        }
      });

      await lessonsAPI.update(lessonId, formDataToSend);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении урока');
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

  if (!course) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Курс не найден
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Редактирование урока
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Курс: {course.title}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Название урока"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Описание урока"
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
              <TextField
                fullWidth
                label="Длительность (в минутах)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Порядковый номер</InputLabel>
                <Select
                  name="order"
                  value={formData.order}
                  label="Порядковый номер"
                  onChange={handleChange}
                  required
                >
                  {Array.from({ length: course.lessons?.length || 0 }, (_, i) => i + 1).map(num => (
                    <MenuItem key={num} value={num}>
                      {num}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, mb: 3 }}>
            <input
              accept="video/*"
              type="file"
              id="video-upload"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddIcon />}
              >
                Заменить видео урока
              </Button>
            </label>
            {formData.video && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Выбрано: {formData.video.name}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Оставьте поле пустым, чтобы сохранить текущее видео
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Дополнительные ресурсы
          </Typography>
          <List>
            {formData.resources.map((resource, index) => (
              <ListItem key={index}>
                <TextField
                  fullWidth
                  value={resource}
                  onChange={(e) => handleResourceChange(index, e.target.value)}
                  placeholder="Ссылка на ресурс (например, GitHub, документация)"
                  required
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeResource(index)}
                    disabled={formData.resources.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            startIcon={<AddIcon />}
            onClick={addResource}
            sx={{ mb: 3 }}
          >
            Добавить ресурс
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
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              Отмена
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default LessonEdit; 