import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Chip,
  CircularProgress
} from '@mui/material';
import { coursesAPI } from '../../services/api';

const categories = [
  'Все',
  'Программирование',
  'Дизайн',
  'Маркетинг',
  'Бизнес',
  'Языки'
];

const levels = [
  'Все',
  'Начальный',
  'Средний',
  'Продвинутый'
];

const levelLabels = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый'
};

const CourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'Все',
    level: 'Все'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setCourses(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке курсов');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'Все' || course.category === filters.category;
    const matchesLevel = filters.level === 'Все' || course.level === filters.level;
    return matchesSearch && matchesCategory && matchesLevel;
  });

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
        <Typography color="error" align="center" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }} maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Поиск курсов"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Категория</InputLabel>
              <Select
                name="category"
                value={filters.category}
                label="Категория"
                onChange={handleFilterChange}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Уровень</InputLabel>
              <Select
                name="level"
                value={filters.level}
                label="Уровень"
                onChange={handleFilterChange}
              >
                {levels.map(level => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={4}>
        {filteredCourses.map((course) => (
          <Grid item key={course._id}>
            <Card
              sx={{
                width: '350px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/courses/${course._id}`)}
            >
              <CardMedia
                component="img"
                height="200"
                image={course.thumbnail ? `http://localhost:5000/${course.thumbnail}` : 'https://source.unsplash.com/random?course'}
                alt={course.title}
                sx={{ width: '100%', objectFit: 'cover' }}
              />
              <CardContent sx={{ 
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                '&:last-child': { pb: 2 }
              }}>
                <Typography gutterBottom variant="h5" component="h2" noWrap>
                  {course.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    mb: 2,
                    wordBreak: 'break-word',
                    whiteSpace: 'normal'
                  }}
                >
                  {course.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={course.rating} readOnly precision={0.5} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({course.rating})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={course.category} size="small" />
                  <Chip label={levelLabels[course.level] || course.level} size="small" />
                </Box>
                <Typography variant="h6" color="primary" sx={{ mt: 'auto' }}>
                  {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default CourseList; 