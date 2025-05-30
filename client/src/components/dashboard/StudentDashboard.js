import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { coursesAPI } from '../../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [stats, setStats] = useState({
    completedLessons: 0,
    totalLessons: 0,
    averageScore: 0,
    certificates: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const response = await coursesAPI.getEnrolledCourses();
      setEnrolledCourses(response.data);
      
      // Подсчет статистики
      let completedLessons = 0;
      let totalLessons = 0;
      let totalScore = 0;
      let scoreCount = 0;

      response.data.forEach(course => {
        const progress = user?.progress?.find(p => p.course.toString() === course._id.toString());
        if (progress) {
          completedLessons += progress.completedLessons?.length || 0;
          totalLessons += course.lessons?.length || 0;
          
          if (progress.quizScores) {
            progress.quizScores.forEach(score => {
              totalScore += score.score;
              scoreCount++;
            });
          }
        } else {
          totalLessons += course.lessons?.length || 0;
        }
      });

      setStats({
        completedLessons,
        totalLessons,
        averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        certificates: response.data.filter(course => {
          const progress = user?.progress?.find(p => p.course.toString() === course._id.toString());
          return progress && progress.completedLessons?.length === course.lessons?.length;
        }).length
      });
      
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Пожалуйста, войдите в систему для доступа к личному кабинету
        </Alert>
      </Container>
    );
  }

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
        Личный кабинет
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
                Пройдено уроков
              </Typography>
              <Typography variant="h4">
                {stats.completedLessons} / {stats.totalLessons}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Средний балл
              </Typography>
              <Typography variant="h4">
                {stats.averageScore}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Сертификаты
              </Typography>
              <Typography variant="h4">
                {stats.certificates}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Активные курсы
              </Typography>
              <Typography variant="h4">
                {enrolledCourses.length}
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
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate('/courses')}
          >
            Найти курсы
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/assignments')}
          >
            Задания
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<StarIcon />}
            onClick={() => navigate('/certificates')}
          >
            Сертификаты
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<NotificationsIcon />}
            onClick={() => navigate('/notifications')}
          >
            Уведомления
          </Button>
        </Grid>
      </Grid>

      {/* Список курсов */}
      <Typography variant="h5" gutterBottom>
        Мои курсы
      </Typography>
      <List>
        {enrolledCourses.map((course, index) => (
          <React.Fragment key={course._id}>
            <ListItem>
              <ListItemText
                primary={course.title}
                secondary={`${course.lessons?.length || 0} уроков`}
              />
              <ListItemSecondaryAction>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => {
                    if (Array.isArray(course.lessons) && course.lessons.length > 0 && course.lessons[0]?._id) {
                      navigate(`/courses/${course._id}/lessons/${course.lessons[0]._id}`);
                    } else {
                      // Можно добавить уведомление пользователю
                      console.warn('Нет доступных уроков в курсе');
                    }
                  }}
                >
                  Продолжить обучение
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            {index < enrolledCourses.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Container>
  );
};

export default StudentDashboard; 