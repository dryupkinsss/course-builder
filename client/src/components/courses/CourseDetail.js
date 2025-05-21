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
  CardMedia
} from '@mui/material';
import {
  PlayArrow,
  AccessTime,
  Person,
  School,
  Star
} from '@mui/icons-material';
import { coursesAPI } from '../../services/api';

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

  useEffect(() => {
    fetchCourse();
  }, [id]);

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
      navigate(`/lessons/${course.lessons[0]._id}`);
    } catch (err) {
      setError('Ошибка при записи на курс');
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

  if (!course) {
    return null;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Основная информация о курсе */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={course.thumbnail || 'https://source.unsplash.com/random?course'}
              alt={course.title}
            />
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {course.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={course.rating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({course.rating})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {course.reviews?.length || 0} отзывов
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={course.category} />
                <Chip label={course.level} />
              </Box>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Чему вы научитесь:
              </Typography>
              <List>
                {course.learningObjectives?.map((objective, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={objective} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Боковая панель */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleEnroll}
              sx={{ mb: 2 }}
            >
              {isAuthenticated ? 'Записаться на курс' : 'Войти для записи'}
            </Button>
            <List>
              <ListItem>
                <ListItemText
                  primary="Длительность"
                  secondary={`${course.totalDuration} часов`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Уроков"
                  secondary={course.lessons?.length || 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Студентов"
                  secondary={course.enrolledStudents || 0}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Список уроков */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Содержание курса
            </Typography>
            <List>
              {course.lessons?.map((lesson, index) => (
                <React.Fragment key={lesson._id}>
                  <ListItem>
                    <ListItemText
                      primary={`${index + 1}. ${lesson.title}`}
                      secondary={`${lesson.duration} минут`}
                    />
                  </ListItem>
                  {index < course.lessons.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Отзывы */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Отзывы студентов
            </Typography>
            {isAuthenticated && (
              <Box component="form" onSubmit={handleReviewSubmit} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Оставить отзыв
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Rating
                    name="rating"
                    value={Number(review.rating)}
                    onChange={handleReviewChange}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="comment"
                  label="Ваш отзыв"
                  value={review.comment}
                  onChange={handleReviewChange}
                  sx={{ mb: 2 }}
                />
                {reviewError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {reviewError}
                  </Alert>
                )}
                <Button type="submit" variant="contained">
                  Отправить отзыв
                </Button>
              </Box>
            )}
            <List>
              {course.reviews?.map((review) => (
                <React.Fragment key={review._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography component="span" variant="subtitle1">
                            {review.user.name}
                          </Typography>
                          <Rating
                            value={review.rating}
                            readOnly
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={review.comment}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CourseDetail; 