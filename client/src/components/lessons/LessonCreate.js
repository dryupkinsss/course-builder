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
  MenuItem,
  Grid
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { lessonsAPI, coursesAPI } from '../../services/api';

const LessonCreate = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
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
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await coursesAPI.getById(courseId);
      setCourse(response.data);
      // Устанавливаем порядковый номер следующего урока
      setFormData(prev => ({
        ...prev,
        order: (response.data.lessons?.length || 0) + 1
      }));
    } catch (err) {
      setError('Ошибка при загрузке курса');
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
    setLoading(true);

    // Валидация
    if (!formData.title || !formData.description || !formData.duration) {
      setError('Пожалуйста, заполните все обязательные поля');
      setLoading(false);
      return;
    }

    if (!formData.video) {
      setError('Пожалуйста, загрузите видео урока');
      setLoading(false);
      return;
    }

    if (formData.resources.some(resource => !resource)) {
      setError('Пожалуйста, заполните все ссылки на ресурсы или удалите пустые');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('course', courseId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('order', formData.order);
      formDataToSend.append('resources', JSON.stringify(formData.resources));
      formDataToSend.append('video', formData.video);

      await lessonsAPI.create(formDataToSend);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Ошибка при создании урока:', err);
      setError(err.response?.data?.message || 'Ошибка при создании урока');
      setLoading(false);
    }
  };

  if (!course) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Создание нового урока
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
                  {Array.from({ length: (course.lessons?.length || 0) + 1 }, (_, i) => i + 1).map(num => (
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
                Загрузить видео урока
              </Button>
            </label>
            {formData.video && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Выбрано: {formData.video.name}
              </Typography>
            )}
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
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Создать урок'}
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

export default LessonCreate; 