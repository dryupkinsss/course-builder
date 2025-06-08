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
  CardContent,
  Avatar
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { coursesAPI, messagesAPI, certificatesAPI } from '../../services/api';

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
  const [latestMessage, setLatestMessage] = useState(null);
  const [latestCertificate, setLatestCertificate] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    // Загрузка последнего сообщения
    const fetchLatestMessage = async () => {
      try {
        const response = await messagesAPI.getMessages();
        const incoming = response.data.filter(msg => msg.recipient?._id === user?._id);
        incoming.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLatestMessage(incoming[0] || null);
      } catch {}
    };
    // Загрузка последнего сертификата
    const fetchLatestCertificate = async () => {
      try {
        const response = await certificatesAPI.getAll();
        const certs = response.data;
        if (Array.isArray(certs) && certs.length > 0) {
          certs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLatestCertificate(certs[0]);
        }
      } catch {}
    };
    if (user?._id) {
      fetchLatestMessage();
      fetchLatestCertificate();
    }
  }, [user?._id]);

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 6 }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* Sidebar */}
          <Box sx={{ width: 260, minWidth: 200, flexShrink: 0, mb: { xs: 4, md: 0 }, order: { xs: 1, md: 1 } }}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3, bgcolor: '#fff', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1976d2' }}>
                Навигация
              </Typography>
              <List>
                <ListItem button onClick={() => navigate('/dashboard/courses')}>
                  <PlayArrowIcon sx={{ mr: 2, color: '#7c3aed' }} />
                  <ListItemText primary="Мои курсы" />
                </ListItem>
                <ListItem button onClick={() => navigate('/certificates')}>
                  <StarIcon sx={{ mr: 2, color: '#ffb300' }} />
                  <ListItemText primary="Сертификаты" />
                </ListItem>
                <ListItem button onClick={() => navigate('/messages')}>
                  <MessageIcon sx={{ mr: 2, color: '#1976d2' }} />
                  <ListItemText primary="Сообщения" />
                </ListItem>
                <ListItem button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                  <NotificationsIcon sx={{ mr: 2, color: '#7c3aed' }} />
                  <ListItemText primary="Уведомления" />
                </ListItem>
              </List>
            </Paper>
          <Button
            variant="contained"
            onClick={() => navigate('/courses')}
              sx={{
                width: '100%',
                borderRadius: 3,
                fontWeight: 700,
                py: 1.3,
                background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                color: '#fff',
                textTransform: 'none',
                fontSize: 16,
                letterSpacing: 0.2,
                boxShadow: 2,
                mt: 2,
                ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
              }}
            >
              Записаться на курсы
          </Button>
          </Box>
          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: -1 }}>
              Панель студента
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 4 }}>
              Следите за своим прогрессом, сертификатами и общайтесь с преподавателями
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}
            {/* Статистика */}
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                mb: 4,
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: { xs: 'center', md: 'flex-start' }
              }}
            >
              {[{
                icon: <AssignmentIcon />, color: '#1976d2', label: 'Завершено курсов', value: completedCourses + ' / ' + enrolledCourses.length
              }, {
                icon: <StarIcon />, color: '#ffb300', label: 'Сертификаты', value: stats.certificates
              }, {
                icon: <PlayArrowIcon />, color: '#7c3aed', label: 'Активные курсы', value: enrolledCourses.length
              }].map((item, idx) => (
                <Card
                  key={idx}
                  sx={{
                    minWidth: 150,
                    maxWidth: 180,
                    flex: '1 1 0',
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 4,
                    boxShadow: 4,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Avatar sx={{ bgcolor: item.color, mr: 2, width: 36, height: 36 }}>
                    {item.icon}
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom sx={{ fontWeight: 500, fontSize: 15 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Box>
      {/* Список курсов */}
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Мои курсы
      </Typography>
            {enrolledCourses.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Вы не записаны на курсы
              </Alert>
            )}
            <Grid container spacing={3}>
              {(enrolledCourses.length > 6 ? enrolledCourses.slice(0, 5) : enrolledCourses).map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Card
                    sx={{
                      width: '100%',
                      maxWidth: 250,
                      minWidth: 250,
                      height: 320,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      boxShadow: 4,
                      bgcolor: '#fff',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      ':hover': { boxShadow: 8, transform: 'translateY(-4px)' },
                      mx: 'auto'
                    }}
                  >
                    <Box sx={{ height: 120, overflow: 'hidden', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                      <img
                        src={course.thumbnail ? `http://localhost:5000/${course.thumbnail}` : 'https://source.unsplash.com/random?course'}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                      />
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: 18 }} noWrap>{course.title}</Typography>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {course.description}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ height: 8, bgcolor: '#e0e7ff', borderRadius: 4, overflow: 'hidden', mb: 0.5 }}>
                          <Box sx={{ width: `${coursesProgress[course._id]?.totalProgress || 0}%`, height: '100%', bgcolor: '#7c3aed', borderRadius: 4 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {coursesProgress[course._id]?.totalProgress || 0}%
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => navigate(`/courses/${course._id}/lessons/${getNextLessonId(course)}`)}
                        sx={{ borderRadius: 3, fontWeight: 600, py: 1, mt: 1, background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)', color: '#fff', textTransform: 'none', fontSize: 15 }}
                      >
                        {hasStartedCourse(course._id) ? 'Продолжить' : 'Начать'}
                  </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {enrolledCourses.length > 6 && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    onClick={() => navigate('/dashboard/courses')}
                    sx={{
                      width: '100%',
                      maxWidth: 250,
                      minWidth: 250,
                      height: 320,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      boxShadow: 4,
                      bgcolor: '#f3f4f6',
                      cursor: 'pointer',
                      mx: 'auto',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      ':hover': { boxShadow: 8, transform: 'translateY(-4px)', bgcolor: '#e5e7eb' }
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#888', textAlign: 'center', width: '100%' }}>
                      Показать все
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
            {/* Последние уведомления */}
            <Box id="notifications" sx={{ mt: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Последние сообщения и уведомления
              </Typography>
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 2, bgcolor: '#fff' }}>
                {(!latestMessage && !latestCertificate) ? (
                  <Typography variant="body2" color="text.secondary">
                    Нет новых сообщений
                  </Typography>
                ) : (
                  <List>
                    {latestMessage && (
                      <ListItem alignItems="flex-start" sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#f8fafc', transition: 'box-shadow 0.2s', ':hover': { boxShadow: 3, bgcolor: '#e0e7ff' } }}>
                        <ListItemText
                          primary={<Typography sx={{ fontWeight: 600 }}>Сообщение</Typography>}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {latestMessage.content?.slice(0, 80)}{latestMessage.content?.length > 80 ? '...' : ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(latestMessage.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    )}
                    {latestCertificate && (
                      <ListItem alignItems="flex-start" sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#f8fafc', transition: 'box-shadow 0.2s', ':hover': { boxShadow: 3, bgcolor: '#e0e7ff' } }}>
                        <ListItemText
                          primary={<Typography sx={{ fontWeight: 600 }}>Сертификат</Typography>}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                Получен новый сертификат по курсу "{latestCertificate.courseTitle}"
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(latestCertificate.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </>
                          }
                        />
            </ListItem>
                    )}
      </List>
                )}
              </Paper>
            </Box>
          </Box>
        </Box>
    </Container>
    </Box>
  );
};

export default StudentDashboard; 