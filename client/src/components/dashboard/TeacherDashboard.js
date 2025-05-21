import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { coursesAPI } from '../../services/api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLessons: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await coursesAPI.getTeacherCourses();
      setCourses(response.data);
      
      // Подсчет статистики
      let totalStudents = 0;
      let totalLessons = 0;
      let totalRevenue = 0;
      let totalRating = 0;
      let ratingCount = 0;

      response.data.forEach(course => {
        totalStudents += course.students?.length || 0;
        totalLessons += course.lessons?.length || 0;
        totalRevenue += (course.price || 0) * (course.students?.length || 0);
        
        if (course.rating) {
          totalRating += course.rating;
          ratingCount++;
        }
      });

      setStats({
        totalStudents,
        totalLessons,
        totalRevenue,
        averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0
      });
      
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      try {
        await coursesAPI.delete(courseId);
        setCourses(courses.filter(course => course._id !== courseId));
      } catch (err) {
        setError('Ошибка при удалении курса');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Панель управления
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего студентов
              </Typography>
              <Typography variant="h4">
                {stats.totalStudents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего уроков
              </Typography>
              <Typography variant="h4">
                {stats.totalLessons}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Общий доход
              </Typography>
              <Typography variant="h4">
                ${stats.totalRevenue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Средний рейтинг
              </Typography>
              <Typography variant="h4">
                {stats.averageRating}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Действия */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/courses/create')}
          >
            Создать курс
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/students')}
          >
            Управление студентами
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/analytics')}
          >
            Аналитика
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MessageIcon />}
            onClick={() => navigate('/messages')}
          >
            Сообщения
          </Button>
        </Grid>
      </Grid>

      {/* Список курсов */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Мои курсы
        </Typography>
        <List>
          {courses.map((course) => (
            <React.Fragment key={course._id}>
              <ListItem>
                <ListItemText
                  primary={course.title}
                  secondary={`${course.students?.length || 0} студентов • ${course.lessons?.length || 0} уроков`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => navigate(`/courses/${course._id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Последние уведомления */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Последние уведомления
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Новый студент записался на курс"
              secondary="2 часа назад"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Получен новый отзыв"
              secondary="5 часов назад"
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default TeacherDashboard; 