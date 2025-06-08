import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Rating,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Avatar
} from '@mui/material';
import {
  PlayArrow,
  AccessTime,
  Person,
  School,
  Star,
  Add,
  Edit
} from '@mui/icons-material';
import { coursesAPI } from '../../services/api';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

const levelLabels = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый'
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [review, setReview] = useState({
    rating: 0,
    comment: ''
  });
  const [reviewError, setReviewError] = useState('');
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);

  // Проверяем, записан ли пользователь на курс
  const isEnrolled = () => {
    return isAuthenticated && course && course.enrolledStudents.some(
      student => student._id === user._id || student === user._id
    );
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (isEnrolled() && user) {
      fetchCourseProgress();
    }
  }, [isEnrolled, user, course]);

  const fetchCourse = async () => {
    try {
      const response = await coursesAPI.getById(id);
      setCourse(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке курса');
      setLoading(false);
    }
  };

  const fetchCourseProgress = async () => {
    try {
      if (!user || !user._id) return;
      const progress = await coursesAPI.getCourseProgress(id, user._id);
      setCourseProgress(progress);
    } catch (err) {
      console.error('Ошибка при получении прогресса:', err);
    }
  };

  const hasStartedCourse = () => {
    if (!courseProgress) return false;
    return courseProgress.lessons.some(lesson => lesson.progress > 0);
  };

  const getNextLessonId = () => {
    if (!course?.lessons || !Array.isArray(course.lessons) || course.lessons.length === 0) {
      console.error('No lessons available in course');
      return null;
    }
    
    // Если есть незавершенные уроки, возвращаем ID первого незавершенного
    if (courseProgress?.lessons) {
      const incompleteLesson = courseProgress.lessons.find(lesson => lesson.progress < 100);
      if (incompleteLesson) {
        return incompleteLesson._id;
      }
    }
    
    // Если все уроки завершены или нет прогресса, возвращаем ID первого урока
    return course.lessons[0]._id;
  };

  const handleStartLearning = () => {
    const nextLessonId = getNextLessonId();
    if (nextLessonId) {
      navigate(`/courses/${id}/lessons/${nextLessonId}`);
    } else {
      setError('В курсе нет доступных уроков');
    }
  };

  const handleReviewChange = (e) => {
    setReview({
      ...review,
      [e.target.name]: e.target.value
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!review.rating) {
      setReviewError('Пожалуйста, выберите оценку');
      return;
    }

    try {
      await coursesAPI.addReview(id, review);
      setReview({ rating: 0, comment: '' });
      setReviewError('');
      fetchCourse(); // Обновляем данные курса
    } catch (err) {
      setReviewError('Ошибка при отправке отзыва');
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await coursesAPI.enroll(id);
      setEnrollmentSuccess(true);
      // Обновляем данные курса после записи
      await fetchCourse();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === 'Вы уже записаны на этот курс') {
        setError('Вы уже записаны на этот курс. Перейдите к первому уроку.');
        setTimeout(() => {
          navigate(`/courses/${id}/lessons/${course.lessons[0]._id}`);
        }, 2000);
      } else {
        setError('Ошибка при записи на курс');
      }
    }
  };

  const handleLeaveCourse = async () => {
    try {
      await coursesAPI.leaveCourse(id);
      navigate('/dashboard');
    } catch (err) {
      setError('Ошибка при попытке покинуть курс');
    }
  };

  // Добавляем функцию для проверки, является ли пользователь создателем курса
  const isCourseCreator = () => {
    if (!isAuthenticated || !user || !course) return false;
    const instructorId = typeof course.instructor === 'object' ? course.instructor._id : course.instructor;
    return String(user._id) === String(instructorId);
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

  if (!course) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 6 }}>
      <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, sm: 4, md: 6 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          {course.title}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {enrollmentSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Вы успешно записались на курс!
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Sidebar */}
          <Box sx={{ width: 340, minWidth: 260, flexShrink: 0 }}>
            {/* Картинка курса */}
            <Box sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
              <CardMedia
                component="img"
                height="180"
                image={course.thumbnail ? `http://localhost:5000/${course.thumbnail}` : 'https://source.unsplash.com/random?course'}
                alt={course.title}
                sx={{ width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
              />
            </Box>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3, bgcolor: '#fff', mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Информация о курсе
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Преподаватель: {course.instructor?.name || 'Не указан'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Длительность: {course.duration || 'Не указана'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Уровень: {levelLabels[course.level] || course.level}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Рейтинг: {course.rating}
                </Typography>
              </Box>
              <Typography variant="h5" color="primary" sx={{ mt: 2, fontWeight: 700 }}>
                {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
              </Typography>
              {isEnrolled() ? (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleStartLearning}
                  sx={{
                    mt: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    py: 1.2,
                    boxShadow: 2,
                    background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                    color: '#fff',
                    textTransform: 'none',
                    fontSize: 16,
                    letterSpacing: 0.2,
                    transition: 'box-shadow 0.3s, background 0.2s',
                    ':hover': { boxShadow: 4, background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
                  }}
                >
                  {hasStartedCourse() ? 'Продолжить обучение' : 'Начать обучение'}
                </Button>
              ) :
                !isAuthenticated ? (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/login')}
                    fullWidth
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      fontWeight: 500,
                      py: 1,
                      px: 2,
                      minWidth: 0,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                      textTransform: 'none',
                      fontSize: 16,
                      letterSpacing: 0.2,
                      alignItems: 'center',
                      gap: 1,
                      transition: 'box-shadow 0.2s, background 0.2s',
                      background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                      color: '#fff',
                      '& .MuiButton-startIcon': {
                        mr: 1,
                      },
                    }}
                  >
                    Авторизоваться для записи на курс
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleEnroll}
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      fontWeight: 500,
                      py: 1,
                      px: 2,
                      minWidth: 0,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                      textTransform: 'none',
                      fontSize: 16,
                      letterSpacing: 0.2,
                      alignItems: 'center',
                      gap: 1,
                      transition: 'box-shadow 0.2s, background 0.2s',
                      whiteSpace: 'nowrap',
                      background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                      color: '#fff',
                      ':hover': {
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.18)',
                        background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)',
                      },
                      '& .MuiButton-startIcon': {
                        mr: 1,
                      },
                    }}
                  >
                    Записаться на курс
                  </Button>
                )
              }
            </Paper>

            {isEnrolled() && (
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3, bgcolor: '#fff' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Ваш прогресс
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2">
                    Завершено уроков: {courseProgress?.completedLessons?.length || 0} из {course.lessons.length}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLeaveCourse}
                  sx={{ borderRadius: 3, fontWeight: 600, py: 1.2 }}
                >
                  Покинуть курс
                </Button>
              </Paper>
            )}
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3, bgcolor: '#fff', mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Описание курса
              </Typography>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={course.category} size="small" />
                <Chip label={levelLabels[course.level] || course.level} size="small" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={course.rating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {course.rating}
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3, bgcolor: '#fff', mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Уроки курса
              </Typography>
              <List>
                {course.lessons.map((lesson, index) => (
                  <React.Fragment key={lesson._id}>
                    <ListItem
                      button
                      onClick={() => navigate(`/courses/${id}/lessons/${lesson._id}`)}
                      sx={{ borderRadius: 3, mb: 1, boxShadow: 1, bgcolor: '#f5f7fa', transition: 'box-shadow 0.2s', ':hover': { boxShadow: 3, bgcolor: '#e3f2fd' } }}
                    >
                      <ListItemText
                        primary={lesson.title}
                        secondary={lesson.description}
                      />
                    </ListItem>
                    {index < course.lessons.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3, bgcolor: '#fff' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Отзывы
              </Typography>
              {course.reviews && course.reviews.length > 0 ? (
                <List>
                  {course.reviews.map((review, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Rating value={review.rating} readOnly precision={0.5} />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                {review.user?.name || 'Аноним'}
                              </Typography>
                            </Box>
                          }
                          secondary={review.comment}
                        />
                      </ListItem>
                      {index < course.reviews.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Пока нет отзывов
                </Typography>
              )}
              {/* Форма для отправки отзыва */}
              {isEnrolled() && !isCourseCreator() && !(course.reviews || []).some(r => (r.user?._id || r.user) === user._id) && (
                <Box component="form" onSubmit={handleReviewSubmit} sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Оставить отзыв о курсе
                  </Typography>
                  <Rating
                    name="rating"
                    value={review.rating}
                    onChange={(_, value) => setReview({ ...review, rating: value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    name="comment"
                    label="Комментарий"
                    value={review.comment}
                    onChange={handleReviewChange}
                    multiline
                    minRows={2}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                  {reviewError && (
                    <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>
                  )}
                  <Button type="submit" variant="contained" sx={{ fontWeight: 600 }}>
                    Отправить отзыв
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CourseDetail; 