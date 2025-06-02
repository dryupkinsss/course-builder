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
  Notifications as NotificationsIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { coursesAPI } from '../../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [coursesProgress, setCoursesProgress] = useState({});
  const [stats, setStats] = useState({
    completedLessons: 0,
    totalLessons: 0,
    certificates: 0
  });
  const [completedCourses, setCompletedCourses] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const response = await coursesAPI.getEnrolledCourses();
      setEnrolledCourses(response.data);
      
      // Получаем прогресс для каждого курса
      const progressPromises = response.data.map(async (course) => {
        try {
          const progress = await coursesAPI.getCourseProgress(course._id, user._id);
          return { courseId: course._id, progress };
        } catch (err) {
          console.error(`Ошибка при получении прогресса для курса ${course._id}:`, err);
          return { courseId: course._id, progress: null };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const progressMap = progressResults.reduce((acc, { courseId, progress }) => {
        if (progress) {
          acc[courseId] = progress;
        }
        return acc;
      }, {});
      setCoursesProgress(progressMap);
      
      // Подсчет статистики
      let completedLessons = 0;
      let totalLessons = 0;
      let completedCoursesCount = 0;

      response.data.forEach(course => {
        const progress = user?.progress?.find(p => p.course.toString() === course._id.toString());
        if (progress) {
          completedLessons += progress.completedLessons?.length || 0;
          totalLessons += course.lessons?.length || 0;
          
          // Проверяем, завершен ли курс (прогресс 100%)
          if (progress.totalProgress === 100) {
            completedCoursesCount++;
          }
        } else {
          totalLessons += course.lessons?.length || 0;
        }
      });

      setCompletedCourses(completedCoursesCount);
      setStats({
        completedLessons,
        totalLessons,
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

  const hasStartedCourse = (courseId) => {
    const progress = user?.progress?.find(p => p.course.toString() === courseId.toString());
    if (!progress) return false;
    return progress.completedLessons?.length > 0 || progress.totalProgress > 0;
  };

  const getNextLessonId = (course) => {
    if (!course.lessons || course.lessons.length === 0) return null;
    
    const progress = user?.progress?.find(p => p.course.toString() === course._id.toString());
    if (!progress) return course.lessons[0]?._id;
    
    const completedLessons = progress.completedLessons || [];
    const nextLesson = course.lessons.find(lesson => !completedLessons.includes(lesson._id));
    return nextLesson?._id || course.lessons[0]?._id;
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
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Завершенные курсы
              </Typography>
              <Typography variant="h4">
                {completedCourses} / {enrolledCourses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12} sm={6} md={4}>
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
            startIcon={<MessageIcon />}
            onClick={() => navigate('/messages')}
          >
            Сообщения
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => {
                      const nextLessonId = getNextLessonId(course);
                      if (nextLessonId) {
                        navigate(`/courses/${course._id}/lessons/${nextLessonId}`);
                      } else {
                        console.warn('Нет доступных уроков в курсе');
                      }
                    }}
                    sx={{ mr: 1 }}
                  >
                    {hasStartedCourse(course._id) ? 'Продолжить обучение' : 'Начать обучение'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      if (window.confirm('Вы уверены, что хотите покинуть этот курс?')) {
                        try {
                          await coursesAPI.leaveCourse(course._id);
                          setEnrolledCourses(enrolledCourses.filter(c => c._id !== course._id));
                        } catch (err) {
                          setError('Ошибка при попытке покинуть курс');
                        }
                      }
                    }}
                  >
                    Покинуть курс
                  </Button>
                </Box>
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