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
  LinearProgress,
  Link
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
import { lessonsAPI, coursesAPI, certificatesAPI } from '../../services/api';
import QuizComponent from '../quiz/QuizComponent';
import { Link as RouterLink } from 'react-router-dom';

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
  const [lessonsProgress, setLessonsProgress] = useState({});
  const [courseProgress, setCourseProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizzesProgress, setQuizzesProgress] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!courseId || !lessonId) {
        setError('Отсутствует ID курса или урока');
        setLoading(false);
        return;
      }

      if (!user || !user._id) {
        setLoading(false);
        return;
      }

      try {
        // Сначала получаем прогресс, чтобы иметь актуальные данные
        const progressResponse = await coursesAPI.getStudentProgress(user._id, courseId);
        console.log('Progress Response:', progressResponse); // Debug log
        
        if (isMounted) {
          // Устанавливаем общий прогресс курса
          setCourseProgress(progressResponse.totalProgress);
          
          // Создаем карту прогресса уроков
          const progressMap = {};
          progressResponse.lessons.forEach(l => {
            progressMap[l._id] = {
              progress: l.progress,
              status: l.status,
              lastAccessed: l.lastAccessed,
              completedAt: l.completedAt
            };
          });
          setLessonsProgress(progressMap);

          // Создаем карту прогресса тестов
          const quizProgressMap = {};
          if (Array.isArray(progressResponse.quizzes)) {
            progressResponse.quizzes.forEach(q => {
              console.log('Quiz Progress:', q); // Debug log
              quizProgressMap[q.quiz] = {
                progress: q.progress,
                status: q.status,
                lastAccessed: q.lastAccessed,
                completedAt: q.completedAt,
                quizAttempts: q.quizAttempts
              };
            });
          }
          console.log('Quiz Progress Map:', quizProgressMap); // Debug log
          setQuizzesProgress(quizProgressMap);

          // Устанавливаем прогресс текущего урока
          const currentLessonProgress = progressMap[lessonId];
          if (currentLessonProgress) {
            setProgress(currentLessonProgress.progress);
            setIsCompleted(currentLessonProgress.status === 'completed');
          }
        }

        // Затем получаем данные курса и урока
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
  }, [courseId, lessonId, user]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    // Здесь будет запрос к API для отправки комментария
    console.log('New comment:', comment);
    setComment('');
  };

  const handleComplete = async () => {
    if (!user || !user._id) {
      setError('Необходимо авторизоваться');
      return;
    }

    try {
      // 1. Вызываем метод complete для урока
      const response = await lessonsAPI.complete(lessonId);
      
      // Обновляем прогресс урока
      setProgress(100);
      setIsCompleted(true);
      
      // Обновляем прогресс в lessonsProgress
      const updatedLessonsProgress = {
        ...lessonsProgress,
        [lessonId]: {
          progress: 100,
          status: 'completed',
          lastAccessed: new Date().toISOString(),
          completedAt: new Date().toISOString()
        }
      };
      setLessonsProgress(updatedLessonsProgress);
      
      // Обновляем общий прогресс курса
      setCourseProgress(response.totalProgress);

      // 2. Обновляем прогресс курса на сервере
      await coursesAPI.updateProgress(courseId, {
        progress: response.totalProgress,
        lessons: Object.entries(updatedLessonsProgress).map(([id, data]) => ({
          lessonId: id,
          progress: data.progress,
          status: data.status,
          lastAccessed: data.lastAccessed,
          completedAt: data.completedAt
        }))
      });

      // 3. Получаем актуальный прогресс курса
      const progressResponse = await coursesAPI.getStudentProgress(user._id, courseId);
      
      // Обновляем состояние с актуальными данными
      setCourseProgress(progressResponse.totalProgress);
      
      // Обновляем прогресс уроков
      const progressMap = {};
      progressResponse.lessons.forEach(l => {
        progressMap[l._id] = {
          progress: l.progress,
          status: l.status,
          lastAccessed: l.lastAccessed,
          completedAt: l.completedAt
        };
      });
      setLessonsProgress(progressMap);

      // 4. Если прогресс 100%, создаем сертификат
      if (progressResponse.totalProgress === 100) {
        try {
          await certificatesAPI.create(courseId);
        } catch (certError) {
          console.error('Error creating certificate:', certError);
          // Не показываем ошибку пользователю, так как это не критично
        }
      }
      
      // Проверяем наличие теста
      if (response.quiz && !response.quizCompleted) {
        setShowQuiz(true);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      setError('Ошибка при завершении урока');
    }
  };

  const handleQuizComplete = (result) => {
    setQuizCompleted(true);
    setShowQuiz(false);
    // Обновляем прогресс курса после завершения теста
    if (result.progress) {
      setCourseProgress(result.progress.totalProgress);
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

    // Создаем массив всех элементов (уроки + тесты)
    const allItems = [];
    
    // Добавляем уроки и их тесты
    course.lessons.forEach((lesson, index) => {
      // Добавляем урок
      allItems.push({
        ...lesson,
        type: 'lesson'
      });

      // Находим тест для этого урока (берем тест с соответствующим индексом)
      const quiz = course.quizzes?.[index];
      if (quiz) {
        allItems.push({
          ...quiz,
          type: 'quiz',
          title: quiz.title,
          duration: 0
        });
      }
    });

    if (allItems.length === 0) {
      return (
        <ListItem>
          <ListItemText primary="Уроки и тесты отсутствуют" />
        </ListItem>
      );
    }

    return allItems.map((item, index) => {
      let isCompleted = false;
      if (item.type === 'lesson') {
        const lessonProgress = lessonsProgress[item._id];
        isCompleted = lessonProgress?.status === 'completed';
      } else if (item.type === 'quiz') {
        const quizProgress = quizzesProgress[item._id];
        console.log('Checking quiz progress for:', item._id, quizProgress); // Debug log
        
        // Проверяем наличие попыток в обоих местах
        const hasProgressAttempts = quizProgress?.quizAttempts && quizProgress.quizAttempts.length > 0;
        const hasQuizAttempts = course.quizzes?.find(q => q._id === item._id)?.attempts?.length > 0;
        
        // Тест считается пройденным, если есть хотя бы одна попытка в любом месте
        isCompleted = hasProgressAttempts || hasQuizAttempts;
      }

      return (
        <React.Fragment key={item._id}>
          <ListItem
            button
            selected={item._id === lessonId}
            onClick={() => {
              if (item.type === 'quiz') {
                const quizProgress = quizzesProgress[item._id];
                if (quizProgress?.status === 'completed' || 
                    quizProgress?.progress === 100 || 
                    (quizProgress?.quizAttempts && quizProgress.quizAttempts.length > 0)) {
                  // Если тест уже пройден, показываем сообщение
                  alert('Этот тест уже пройден');
                  return;
                }
                navigate(`/quiz/${item._id}`);
              } else {
                navigateToLesson(course.lessons.findIndex(l => l._id === item._id));
              }
            }}
            sx={{
              pl: item.type === 'quiz' ? 4 : 2, // Отступ для тестов
              backgroundColor: item.type === 'quiz' ? 'rgba(0, 0, 0, 0.02)' : 'inherit', // Фон для тестов
              borderLeft: item.type === 'quiz' ? '2px solid #1976d2' : 'none' // Добавляем линию слева для тестов
            }}
          >
            <ListItemIcon>
              {item._id === lessonId ? (
                <PlayIcon color="primary" />
              ) : (
                <CheckIcon
                  color={isCompleted ? 'success' : 'disabled'}
                />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span" sx={{
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    fontSize: '1rem',
                  }}>
                    {item.title}
                  </Typography>
                  {item.type === 'quiz' && (
                    <Chip
                      size="small"
                      label={isCompleted ? "Тест пройден" : "Тест"}
                      color={isCompleted ? "success" : "primary"}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
              secondary={item.type === 'lesson' && item.duration ? `${item.duration} минут` : ''}
            />
          </ListItem>
          {index < allItems.length - 1 && <Divider />}
        </React.Fragment>
      );
    });
  };

  const updateProgress = async (newProgress) => {
    if (!user || !user._id) {
      setError('Необходимо авторизоваться');
      return;
    }

    try {
      // Обновляем прогресс урока
      await coursesAPI.updateLessonProgress(courseId, lessonId, newProgress);
      setProgress(newProgress);
      
      // Обновляем прогресс в общем состоянии
      const updatedLessonsProgress = {
        ...lessonsProgress,
        [lessonId]: { 
          progress: newProgress, 
          status: newProgress === 100 ? 'completed' : 'in_progress',
          lastAccessed: new Date().toISOString(),
          completedAt: newProgress === 100 ? new Date().toISOString() : null
        }
      };
      setLessonsProgress(updatedLessonsProgress);

      // Обновляем общий прогресс курса
      const oldProgress = progress;
      const newCourseProgress = Math.round(((courseProgress * course.lessons.length - oldProgress + newProgress) / (course.lessons.length * 100)) * 100);
      setCourseProgress(newCourseProgress);

      // Обновляем прогресс курса на сервере
      await coursesAPI.updateProgress(courseId, {
        progress: newCourseProgress,
        lessons: Object.entries(updatedLessonsProgress).map(([id, data]) => ({
          lessonId: id,
          progress: data.progress,
          status: data.status,
          lastAccessed: data.lastAccessed,
          completedAt: data.completedAt
        }))
      });
      
      // Если прогресс 100%, обновляем состояние завершенности
      if (newProgress === 100) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Ошибка при обновлении прогресса:', err);
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Заголовок */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          height: '64px'
        }}>
          <IconButton onClick={() => navigate(`/courses/${courseId}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              lineHeight: 1.2,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {lesson.title}
          </Typography>
          {isTeacher && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}/edit`)}
              sx={{ 
                ml: 'auto',
                minWidth: '160px',
                height: '40px'
              }}
            >
              Редактировать
            </Button>
          )}
        </Box>

        {/* Прогресс курса */}
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mr: 2, minWidth: '120px' }}>
              Прогресс курса
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '40px' }}>
              {courseProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={courseProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }}
          />
        </Paper>

        {/* Сообщение о завершении курса */}
        {courseProgress === 100 && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: '1.1rem'
              }
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Поздравляем! 🎉
            </Typography>
            <Typography>
              Вы успешно завершили курс "{course.title}"! Теперь вы можете{' '}
              <Link 
                component={RouterLink} 
                to="/certificates" 
                sx={{ 
                  color: 'inherit',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                получить сертификат о прохождении курса
              </Link>
              {' '}в личном кабинете в разделе сертификаты.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3} alignItems="flex-start">
          {/* Навигация слева */}
          <Grid item xs={12} md={3}>
            <Paper 
              sx={{ 
                p: 2, 
                height: 'calc(100vh - 200px)', 
                position: 'sticky',
                top: 20,
                overflow: 'auto',
                borderRadius: 2,
                boxShadow: 2,
                minWidth: '240px',
                maxWidth: '320px',
                width: '100%',
                '& .MuiListItem-root': {
                  minHeight: '48px',
                  px: 1
                }
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600, 
                  px: 1,
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Навигация
              </Typography>
              <List sx={{ p: 0 }}>
                {renderLessonsList()}
              </List>
            </Paper>
          </Grid>

          {/* Основной контент по центру */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 2, 
              boxShadow: 2,
              minHeight: '500px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}>
              {lesson.video ? (
                <Box sx={{ 
                  position: 'relative', 
                  paddingTop: '56.25%',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <video
                    controls
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '8px'
                    }}
                    src={getVideoUrl(lesson.video)}
                  />
                </Box>
              ) : (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Alert severity="info" sx={{ width: '100%' }}>
                    Видео для этого урока отсутствует
                  </Alert>
                </Box>
              )}
            </Paper>

            {/* Кнопки навигации по урокам */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 3,
              gap: 2
            }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigateToLesson(currentLessonIndex - 1)}
                disabled={!hasPrevLesson}
                sx={{ 
                  borderRadius: 2,
                  minWidth: '160px',
                  height: '40px'
                }}
              >
                Предыдущий урок
              </Button>
              {isStudent && !isCompleted && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleComplete}
                  sx={{ 
                    borderRadius: 2,
                    minWidth: '200px',
                    height: '40px'
                  }}
                >
                  Отметить как пройденный
                </Button>
              )}
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigateToLesson(currentLessonIndex + 1)}
                disabled={!hasNextLesson}
                sx={{ 
                  borderRadius: 2,
                  minWidth: '160px',
                  height: '40px'
                }}
              >
                Следующий урок
              </Button>
            </Box>
          </Grid>

          {/* Правая колонка с описанием и ресурсами */}
          <Grid item xs={12} md={3} sx={{ alignSelf: 'flex-start' }}>
            <Box sx={{ width: 340, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Paper sx={{ 
                p: 2, 
                borderRadius: 2, 
                boxShadow: 2,
                minHeight: '200px',
                maxHeight: '220px',
                height: '220px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  Описание урока
                </Typography>
                <Box sx={{
                  flex: 1,
                  minHeight: '60px',
                  maxHeight: '100px',
                  overflow: 'auto',
                  mb: 2
                }}>
                  <Typography 
                    variant="body1" 
                    paragraph
                    sx={{
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-line',
                      m: 0,
                      width: '100%'
                    }}
                  >
                    {lesson.description || 'Описание отсутствует'}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                  mt: 'auto',
                  flexShrink: 0
                }}>
                  <Chip
                    icon={<PlayIcon />}
                    label={`${lesson.duration || 0} минут`}
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                  {isCompleted && (
                    <Chip
                      icon={<CheckIcon />}
                      label="Пройден"
                      color="success"
                      sx={{ borderRadius: 1 }}
                    />
                  )}
                </Box>
              </Paper>

              {Array.isArray(lesson.resources) && lesson.resources.length > 0 && (
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  boxShadow: 2,
                  minHeight: '200px',
                  maxHeight: '220px',
                  height: '220px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    Дополнительные ресурсы
                  </Typography>
                  <Box sx={{ flex: 1, overflow: 'auto', minHeight: '60px', maxHeight: '140px' }}>
                    <List>
                      {lesson.resources.map((resource, index) => (
                        <ListItem 
                          key={index}
                          sx={{ 
                            p: 1,
                            minHeight: '48px',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              borderRadius: 1
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: '40px' }}>
                            <LinkIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '90px',
                                  fontSize: '0.95rem'
                                }}
                              >
                                {resource}
                              </Typography>
                            }
                            secondary="Ссылка на ресурс"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            href={resource}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ 
                              borderRadius: 1,
                              minWidth: '100px',
                              height: '32px'
                            }}
                          >
                            Открыть
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Paper>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Комментарии */}
        {Array.isArray(lesson.comments) && lesson.comments.length > 0 && (
          <Paper sx={{ 
            p: 3, 
            mt: 4, 
            borderRadius: 2, 
            boxShadow: 2,
            minHeight: '200px'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                height: '40px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Комментарии
            </Typography>
            <List>
              {lesson.comments.map((comment, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    alignItems="flex-start" 
                    sx={{ 
                      px: 0,
                      minHeight: '80px'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: '40px' }}>
                      <CommentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          minHeight: '24px'
                        }}>
                          <Typography 
                            component="span" 
                            variant="subtitle2" 
                            sx={{ fontWeight: 600 }}
                          >
                            {comment.user}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {comment.date}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ 
                            display: 'block', 
                            mt: 0.5,
                            minHeight: '40px'
                          }}
                        >
                          {comment.text}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < lesson.comments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Box 
              component="form" 
              onSubmit={handleCommentSubmit} 
              sx={{ 
                mt: 2,
                minHeight: '120px'
              }}
            >
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
                sx={{ 
                  borderRadius: 2,
                  minWidth: '160px',
                  height: '40px'
                }}
              >
                Отправить
              </Button>
            </Box>
          </Paper>
        )}

        {/* Тест */}
        {showQuiz && !quizCompleted && lesson?.quiz && (
          <Box mt={4}>
            <QuizComponent
              id={lesson.quiz._id}
              onComplete={handleQuizComplete}
            />
          </Box>
        )}
      </Container>
    );
  };

  return renderContent();
};

export default LessonDetail; 