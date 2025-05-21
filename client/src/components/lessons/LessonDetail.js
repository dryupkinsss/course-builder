import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  ListItemIcon,
  Divider,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { lessonsAPI, coursesAPI } from '../../services/api';

const LessonDetail = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [comment, setComment] = useState('');

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
      setLesson(lessonResponse.data);
      
      // Находим индекс текущего урока
      const index = courseResponse.data.lessons.findIndex(l => l._id === lessonId);
      setCurrentLessonIndex(index);
      
      // Проверяем, пройден ли урок
      if (isAuthenticated && user.role === 'student') {
        const completedLessons = user.completedLessons || [];
        setIsCompleted(completedLessons.includes(lessonId));
      }
      
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      setLoading(false);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    // Здесь будет запрос к API для отправки комментария
    console.log('New comment:', comment);
    setComment('');
  };

  const handleComplete = async () => {
    try {
      await lessonsAPI.complete(lessonId);
      setIsCompleted(true);
    } catch (err) {
      setError('Ошибка при отметке урока как пройденного');
    }
  };

  const navigateToLesson = (index) => {
    if (index >= 0 && index < course.lessons.length) {
      navigate(`/courses/${courseId}/lessons/${course.lessons[index]._id}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!course || !lesson) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Урок не найден
        </Alert>
      </Container>
    );
  }

  const isTeacher = isAuthenticated && user.role === 'teacher';
  const isStudent = isAuthenticated && user.role === 'student';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(`/courses/${courseId}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {lesson.title}
        </Typography>
        {isTeacher && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}/edit`)}
          >
            Редактировать
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
              <video
                controls
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
                src={lesson.videoUrl}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Описание урока
            </Typography>
            <Typography variant="body1" paragraph>
              {lesson.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                icon={<PlayIcon />}
                label={`${lesson.duration} минут`}
                variant="outlined"
              />
              {isCompleted && (
                <Chip
                  icon={<CheckIcon />}
                  label="Пройден"
                  color="success"
                />
              )}
            </Box>
          </Paper>

          {lesson.resources && lesson.resources.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Дополнительные ресурсы
              </Typography>
              <List>
                {lesson.resources.map((resource, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LinkIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={resource}
                      secondary="Ссылка на ресурс"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      href={resource}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Открыть
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Навигация по урокам
            </Typography>
            <List>
              {course.lessons.map((l, index) => (
                <React.Fragment key={l._id}>
                  <ListItem
                    button
                    selected={l._id === lessonId}
                    onClick={() => navigateToLesson(index)}
                  >
                    <ListItemIcon>
                      {l._id === lessonId ? (
                        <PlayIcon color="primary" />
                      ) : (
                        <CheckIcon
                          color={user?.completedLessons?.includes(l._id)
                            ? 'success'
                            : 'disabled'
                          }
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={l.title}
                      secondary={`${l.duration} минут`}
                    />
                  </ListItem>
                  {index < course.lessons.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigateToLesson(currentLessonIndex - 1)}
          disabled={currentLessonIndex === 0}
        >
          Предыдущий урок
        </Button>
        {isStudent && !isCompleted && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleComplete}
          >
            Отметить как пройденный
          </Button>
        )}
        <Button
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigateToLesson(currentLessonIndex + 1)}
          disabled={currentLessonIndex === course.lessons.length - 1}
        >
          Следующий урок
        </Button>
      </Box>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Комментарии
        </Typography>
        <List>
          {lesson.comments.map((comment, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  <CommentIcon />
                </ListItemIcon>
                <ListItemText
                  primary={comment.user}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {comment.text}
                      </Typography>
                      <br />
                      {comment.date}
                    </>
                  }
                />
              </ListItem>
              {index < lesson.comments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Оставьте комментарий..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendIcon />}
            disabled={!comment.trim()}
          >
            Отправить
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LessonDetail; 