import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Paper,
  Pagination
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
  { label: 'Все', value: 'Все' },
  { label: 'Начальный', value: 'beginner' },
  { label: 'Средний', value: 'intermediate' },
  { label: 'Продвинутый', value: 'advanced' }
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
  const [page, setPage] = useState(1);
  const COURSES_PER_PAGE = 6;
  const topRef = useRef(null);

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

  const paginatedCourses = filteredCourses.slice((page - 1) * COURSES_PER_PAGE, page * COURSES_PER_PAGE);
  const pageCount = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 6 }}>
      <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 } }}>
        <Typography ref={topRef} variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Каталог курсов
        </Typography>
        <Box sx={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          {/* Sidebar Filters */}
          <Box sx={{ width: 300, minWidth: 260, flexShrink: 0 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 4, mb: 4, position: { md: 'sticky' }, top: 100 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Фильтры
              </Typography>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Поиск курсов"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  sx={{ bgcolor: '#fff', borderRadius: 2 }}
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth size="small" sx={{ bgcolor: '#fff', borderRadius: 2 }}>
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
              </Box>
              <Box>
                <FormControl fullWidth size="small" sx={{ bgcolor: '#fff', borderRadius: 2 }}>
                  <InputLabel>Уровень</InputLabel>
                  <Select
                    name="level"
                    value={filters.level}
                    label="Уровень"
                    onChange={handleFilterChange}
                  >
                    {levels.map(level => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Box>

          {/* Courses Grid */}
          <Box sx={{ flex: 1 }}>
            <Grid container spacing={4} justifyContent="flex-start">
              {paginatedCourses.map((course) => (
                <Grid item key={course._id} xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                  <Card
                    sx={{
                      width: 300,
                      height: 500,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      boxShadow: 3,
                      transition: 'box-shadow 0.3s, transform 0.2s',
                      cursor: 'pointer',
                      ':hover': { boxShadow: 8, transform: 'translateY(-4px)', bgcolor: '#f1f5fd' }
                    }}
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={course.thumbnail ? `http://localhost:5000/${course.thumbnail}` : 'https://source.unsplash.com/random?course'}
                        alt={course.title}
                        sx={{ width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                      />
                      <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
                        <Chip label={course.category} size="small" sx={{ bgcolor: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)', color: '#fff', fontWeight: 600 }} />
                        {course.bestseller && (
                          <Chip label="Бестселлер" size="small" sx={{ bgcolor: 'orange', color: '#fff', fontWeight: 600 }} />
                        )}
                      </Box>
                    </Box>
                    <CardContent sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1, pb: 2, overflow: 'hidden' }}>
                      <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 700, wordBreak: 'break-word', whiteSpace: 'normal', mb: 0.5 }}>
                        {course.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          maxHeight: 48,
                          overflow: 'hidden',
                          mb: 0.5,
                          display: 'block'
                        }}
                      >
                        {course.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Преподаватель: {course.instructor?.name || 'Не указан'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Rating value={course.rating || 0} readOnly precision={0.1} size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {course.rating || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip label={levelLabels[course.level] || course.level} size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                          {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                            ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
                          }}
                          onClick={e => { e.stopPropagation(); navigate(`/courses/${course._id}`); }}
                        >
                          Подробнее
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {pageCount > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, value) => {
                    setPage(value);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  color="primary"
                  size="large"
                  shape="rounded"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CourseList; 