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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  const [showCongrats, setShowCongrats] = useState(false);

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

      // 4. Если прогресс 100%, создаем сертификат и показываем поздравление
      if (progressResponse.totalProgress === 100) {
        try {
          await certificatesAPI.create(courseId);
          setShowCongrats(true);
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

  const renderSidebar = () => (
    <Paper elevation={2} sx={{ width: 280, minWidth: 200, maxWidth: 320, height: '100vh', borderRadius: 0, bgcolor: '#fff', borderRight: '1px solid #e0e7ff', display: { xs: 'none', md: 'block' }, position: 'sticky', top: 0 }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e7ff' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', letterSpacing: -1 }}>Содержание курса</Typography>
        </Box>
      <List sx={{ p: 0 }}>
        {renderLessonsList()}
      </List>
    </Paper>
  );

  const renderProgressCard = () => (
    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 2, bgcolor: '#fff', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181b' }}>{course.title || 'Курс'}</Typography>
        <Chip label={`${Object.values(lessonsProgress).filter(l => l.status === 'completed').length}/${course.lessons.length} уроков`} sx={{ bgcolor: '#e0e7ff', color: '#1976d2', fontWeight: 700 }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 600 }}>Прогресс курса</Typography>
        <Box sx={{ flex: 1 }}>
          <LinearProgress variant="determinate" value={courseProgress} sx={{ height: 8, borderRadius: 4, bgcolor: '#e0e7ff', '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)' } }} />
        </Box>
        <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 700, minWidth: 40 }}>{courseProgress}%</Typography>
      </Box>
    </Paper>
      );

  const renderLessonCard = () => {
    if (!lesson) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">Данные урока не загружены</Alert>
        </Box>
      );
    }
    const hasNextLesson = currentLessonIndex < (course?.lessons?.length || 0) - 1;
    const hasPrevLesson = currentLessonIndex > 0;
    return (
      <Paper sx={{ flex: 2.5, minWidth: 750, maxWidth: 750, p: 3, borderRadius: 4, boxShadow: 2, bgcolor: '#fff', mb: { xs: 2, md: 0 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', letterSpacing: -1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {lesson.type === 'test' ? '📝' : '📹'} {lesson.title}
          </Typography>
          {isCompleted && <Chip label="Пройдено" sx={{ bgcolor: '#4ade80', color: '#fff', fontWeight: 700 }} icon={<CheckIcon sx={{ color: '#fff' }} />} />}
        </Box>
        <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>Продолжительность: {lesson.duration || '—'} мин</Typography>
        {lesson.type !== 'test' && lesson.video ? (
          <Box sx={{ position: 'relative', paddingTop: '56.25%', background: 'linear-gradient(90deg, #e0e7ff 60%, #f8fafc 100%)', borderRadius: 3, overflow: 'hidden', boxShadow: 1, mb: 2 }}>
            <video controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 3 }} src={getVideoUrl(lesson.video)} />
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ color: '#7c3aed', fontWeight: 600 }}>
              {lesson.type === 'test' ? 'Тест по материалу урока' : 'Видео для этого урока отсутствует'}
            </Typography>
          </Box>
        )}
        {/* Кнопки навигации */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 2 }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigateToLesson(currentLessonIndex - 1)} disabled={!hasPrevLesson} sx={{ borderRadius: 2, minWidth: '140px', height: '38px', fontWeight: 600, fontSize: '0.8125rem', color: '#1976d2', borderColor: '#1976d2', background: '#f3f4f6', ':hover': { background: '#e0e7ff' } }}>Предыдущий урок</Button>
          {!isCompleted && (
            <Button variant="contained" onClick={handleComplete} sx={{ borderRadius: 2, minWidth: '180px', height: '38px', fontWeight: 600, fontSize: '0.8125rem', background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)', color: '#fff', boxShadow: 1, ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' } }} startIcon={<CheckIcon />}>Отметить как пройденный</Button>
              )}
          <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => navigateToLesson(currentLessonIndex + 1)} disabled={!hasNextLesson} sx={{ borderRadius: 2, minWidth: '140px', height: '38px', fontWeight: 600, fontSize: '0.8125rem', color: '#1976d2', borderColor: '#1976d2', background: '#f3f4f6', ':hover': { background: '#e0e7ff' } }}>Следующий урок</Button>
                </Box>
              </Paper>
    );
  };

  // Основной рендер
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', p: { xs: 1, md: 4 } }}>
      {/* Sidebar + контент */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', gap: 2, maxWidth: 1400, ml: { xs: 0, md: 2 } }}>
        {/* Sidebar */}
        {renderSidebar()}
        {/* Контент */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* ProgressCard — широкий, почти на всю страницу */}
          <Box sx={{ maxWidth: 1200, mb: 3 }}>{renderProgressCard()}</Box>
          {/* Grid: слева видео, справа описание/ресурсы */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, maxWidth: 1200 }}>
            {/* Видео и кнопки */}
            <Box sx={{ flex: 2.5, minWidth: 350, maxWidth: 900, mb: { xs: 2, md: 0 } }}>{renderLessonCard()}</Box>
            {/* Описание и ресурсы */}
            <Paper sx={{ flex: 1, minWidth: 220, maxWidth: 340, p: 3, borderRadius: 3, boxShadow: 1, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Описание урока */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181b', mb: 1 }}>Описание урока</Typography>
                <Typography variant="body1" sx={{ color: '#18181b', mb: 2, whiteSpace: 'pre-line' }}>{lesson?.description || 'Описание отсутствует'}</Typography>
              </Box>
              <Divider sx={{ my: 1, bgcolor: '#e0e7ff' }} />
              {/* Дополнительные ресурсы */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#18181b', mb: 1 }}>Дополнительные ресурсы</Typography>
                {(() => {
                  const resources = Array.isArray(lesson?.resources)
                    ? lesson.resources.map(r => typeof r === 'string' ? { url: r, title: r } : r)
                    : [];
                  return resources.length > 0 ? (
                    <List>
                      {resources.map((resource, index) => (
                        <ListItem key={index} alignItems="flex-start" sx={{ p: 1, minHeight: '44px', borderRadius: 2, mb: 1, bgcolor: '#fff', boxShadow: 0, '&:hover': { backgroundColor: '#e0e7ff' } }}>
                          <ListItemIcon sx={{ mt: 0.5 }}><AttachFileIcon color="primary" /></ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Link
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener"
                                  sx={{
                                    color: '#1976d2',
                                    fontWeight: 600,
                                    flex: 1,
                                    minWidth: 0,
                                    overflowWrap: 'anywhere'
                                  }}
                                >
                                  {resource.title || resource.url}
                                </Link>
                                {resource.url && (
                                  <Button
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener"
                                    size="small"
                                    variant="outlined"
                                sx={{
                                      borderRadius: 2,
                                      fontWeight: 600,
                                      color: '#1976d2',
                                      borderColor: '#1976d2',
                                  whiteSpace: 'nowrap',
                                      ml: 1
                                }}
                              >
                                    Перейти
                                  </Button>
                                )}
                              </Box>
                            }
                            secondary={resource.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#888', p: 1 }}>Нет дополнительных ресурсов</Typography>
                  );
                })()}
                  </Box>
                </Paper>
          </Box>
        </Box>
            </Box>
      
      {/* Модальное окно с поздравлением */}
      <Dialog
        open={showCongrats}
        onClose={() => setShowCongrats(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, color: '#1976d2' }}>
          Поздравляем! 🎉
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Вы успешно завершили курс "{course.title}"
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
              Ваш сертификат будет доступен в личном кабинете. Продолжайте развиваться и осваивать новые навыки!
                          </Typography>
                        </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button
                variant="contained"
            onClick={() => setShowCongrats(false)}
                sx={{ 
                  borderRadius: 2,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
              color: '#fff',
              px: 4
                }}
              >
            Отлично!
              </Button>
        </DialogActions>
      </Dialog>
          </Box>
    );
};

export default LessonDetail; 