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
  CardContent,
  Avatar
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
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StarIcon from '@mui/icons-material/Star';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
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
      let totalRating = 0;
      let ratingCount = 0;

      response.data.forEach(course => {
        // Подсчет студентов
        if (Array.isArray(course.enrolledStudents)) {
          totalStudents += course.enrolledStudents.length;
        }
        
        // Подсчет рейтинга
        if (course.rating) {
          totalRating += course.rating;
          ratingCount++;
        }
      });

      setStats({
        totalStudents,
        totalCourses: response.data.length,
        totalRevenue: response.data.reduce((sum, course) => sum + (course.price || 0), 0),
        averageRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Панель преподавателя
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: 4, boxShadow: 3, bgcolor: '#f5f7fa' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PeopleIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
                Всего студентов
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.totalStudents}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: 4, boxShadow: 3, bgcolor: '#f5f7fa' }}>
            <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
              <SchoolOutlinedIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
                Всего курсов
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.totalCourses}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: 4, boxShadow: 3, bgcolor: '#f5f7fa' }}>
            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
              <MonetizationOnIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
                Общий доход
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.totalRevenue} ₽
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: 4, boxShadow: 3, bgcolor: '#f5f7fa' }}>
            <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
              <StarIcon />
            </Avatar>
            <Box>
              <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 500 }}>
                Средний рейтинг
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.averageRating}
              </Typography>
            </Box>
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
            sx={{ borderRadius: 3, fontWeight: 600, py: 1.5, boxShadow: 2, transition: 'box-shadow 0.3s', ':hover': { boxShadow: 4 } }}
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
            sx={{ borderRadius: 3, fontWeight: 600, py: 1.5 }}
          >
            Управление студентами
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MessageIcon />}
            onClick={() => navigate('/messages')}
            sx={{ borderRadius: 3, fontWeight: 600, py: 1.5 }}
          >
            Сообщения
          </Button>
        </Grid>
      </Grid>

      {/* Список курсов */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mt: 4, mb: 2 }}>
        Мои курсы
      </Typography>
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course._id}>
            <Card sx={{ borderRadius: 4, boxShadow: 2, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <MenuBookOutlinedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course.enrolledStudents?.length || 0} студентов • {course.lessons?.length || 0} уроков
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/courses/${course._id}/edit`)}
                  sx={{ borderRadius: 2, fontWeight: 500 }}
                >
                  Редактировать
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteCourse(course._id)}
                  sx={{ borderRadius: 2, fontWeight: 500 }}
                >
                  Удалить
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Последние уведомления */}
      <Paper sx={{ p: 3, mt: 5, borderRadius: 4, boxShadow: 1, bgcolor: '#f5f7fa' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Последние уведомления
        </Typography>
        <List>
          <ListItem>
            <NotificationsIcon color="primary" sx={{ mr: 2 }} />
            <ListItemText
              primary="Новый студент записался на курс"
              secondary="2 часа назад"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <NotificationsIcon color="primary" sx={{ mr: 2 }} />
            <ListItemText
              primary="Курс опубликован"
              secondary="1 день назад"
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default TeacherDashboard; 