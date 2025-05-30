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
  Chip,
  LinearProgress
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
  ArrowForward as ArrowForwardIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { lessonsAPI, coursesAPI } from '../../services/api';

const LessonDetail = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Инициализация состояния с безопасными значениями по умолчанию
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState({ lessons: [] });
  const [lesson, setLesson] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(-1);
  const [comment, setComment] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!courseId || !lessonId) {
        setError('Отсутствует ID курса или урока');
        setLoading(false);
        return;
      }

      try {
        const [courseResponse, lessonResponse] = await Promise.all([
          coursesAPI.getById(courseId),
          lessonsAPI.getById(lessonId)
        ]);

        const courseData = courseResponse.data;
        const lessonData = lessonResponse.data;

        // Находим индекс текущего урока
        const lessonIndex = courseData.lessons.findIndex(l => l._id === lessonId);

        if (isMounted) {
          setCourse(courseData);
          setLesson(lessonData);
          setCurrentLessonIndex(lessonIndex);

          // Получаем прогресс по уроку
          try {
            const progressResponse = await coursesAPI.getStudentProgress(user._id, courseId);
            const lessonProgress = progressResponse.data.lessons.find(
              l => l._id === lessonId
            );
            if (lessonProgress) {
              setProgress(lessonProgress.progress);
              setIsCompleted(lessonProgress.status === 'completed');
            }
          } catch (err) {
            console.error('Ошибка при получении прогресса:', err);
          }
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        if (isMounted) {
          setError(err.response?.data?.message || 'Произошла ошибка при загрузке данных');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId]);

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
      
      // Обновляем прогресс до 100%
      await updateProgress(100);
    } catch (err) {
      setError('Ошибка при отметке урока как пройденного');
    }
  };

  const navigateToLesson = (index) => {
    if (!course?.lessons || !Array.isArray(course.lessons)) {
      console.error('Невозможно выполнить навигацию: отсутствуют данные курса или уроков');
      return;
    }

    if (index >= 0 && index < course.lessons.length) {
      const lesson = course.lessons[index];
      if (lesson?._id) {
        navigate(`/courses/${courseId}/lessons/${lesson._id}`);
      }
    }
  };

  function getVideoUrl(path) {
    if (!path) return '';
    let cleanPath = path.replace(/^\\+|^\/+/g, '');
    cleanPath = cleanPath.replace(/\\\\/g, '/').replace(/\\/g, '/');
    // Если путь уже начинается с uploads/, не добавляем ничего
    if (!cleanPath.startsWith('uploads/')) {
      // Если путь содержит videos/, добавляем uploads/ перед ним
      if (cleanPath.startsWith('videos/')) {
        cleanPath = 'uploads/' + cleanPath;
      } else {
        cleanPath = 'uploads/videos/' + cleanPath;
      }
    }
    // Убираем /api из базового URL, если есть
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
    return `${baseUrl}/${cleanPath}`;
  }

  const renderLessonsList = () => {
    if (!Array.isArray(course?.lessons)) {
      console.error('Lessons is not an array:', course?.lessons);
      return (
        <ListItem>
          <ListItemText primary="Ошибка формата данных" />
        </ListItem>
      );
    }

    if (course.lessons.length === 0) {
      return (
        <ListItem>
          <ListItemText primary="Уроки отсутствуют" />
        </ListItem>
      );
    }

    return course.lessons.map((l, index) => {
      if (!l?._id) {
        console.error('Invalid lesson data:', l);
        return null;
      }

      return (
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
              primary={l.title || 'Урок ' + (index + 1)}
              secondary={l.duration ? `${l.duration} минут` : ''}
            />
          </ListItem>
          {index < course.lessons.length - 1 && <Divider />}
        </React.Fragment>
      );
    }).filter(Boolean);
  };

  const updateProgress = async (newProgress) => {
    try {
      await coursesAPI.updateLessonProgress(courseId, lessonId, newProgress);
      setProgress(newProgress);
      
      // Если прогресс 100%, отмечаем урок как завершенный
      if (newProgress === 100) {
        await handleComplete();
      }
    } catch (err) {
      setError('Ошибка при обновлении прогресса');
    }
  };

  const renderContent = () => {
    console.log('Rendering content with state:', {
      loading,
      error,
      course,
      lesson,
      currentLessonIndex
    });

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      );
    }

    if (!lesson?.title) {
      console.log('Lesson data is missing or invalid:', lesson);
      return (
        <Box p={3}>
          <Alert severity="warning">Урок не найден</Alert>
        </Box>
      );
    }

    const isTeacher = isAuthenticated && user?.role === 'teacher';
    const isStudent = isAuthenticated && user?.role === 'student';
    const hasNextLesson = currentLessonIndex < (course?.lessons?.length || 0) - 1;
    const hasPrevLesson = currentLessonIndex > 0;

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

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 3 }}>
              {lesson.video ? (
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
                    src={getVideoUrl(lesson.video)}
                  />
                </Box>
              ) : (
                <Box mb={3}>
                  <Alert severity="info">
                    Видео для этого урока отсутствует
                  </Alert>
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Описание урока
              </Typography>
              <Typography variant="body1" paragraph>
                {lesson.description || 'Описание отсутствует'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  icon={<PlayIcon />}
                  label={`${lesson.duration || 0} минут`}
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

            {Array.isArray(lesson.resources) && lesson.resources.length > 0 && (
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
                {renderLessonsList()}
              </List>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigateToLesson(currentLessonIndex - 1)}
            disabled={!hasPrevLesson}
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
            disabled={!hasNextLesson}
          >
            Следующий урок
          </Button>
        </Box>

        {/* Добавляем индикатор прогресса */}
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Прогресс прохождения урока
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 10, borderRadius: 5, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary" align="right">
            {progress}%
          </Typography>
        </Box>

        {/* Кнопки для обновления прогресса */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={() => updateProgress(Math.min(progress + 25, 100))}
            disabled={progress >= 100}
          >
            Отметить как частично пройденный
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => updateProgress(100)}
            disabled={progress >= 100}
          >
            Отметить как пройденный
          </Button>
        </Box>

        {Array.isArray(lesson.comments) && lesson.comments.length > 0 && (
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
        )}
      </Container>
    );
  };

  return renderContent();
};

export default LessonDetail; 