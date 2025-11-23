import React, { useState, useEffect, useRef } from 'react';
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
import { messagesAPI } from '../../services/api';
import { useSelector } from 'react-redux';
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
  const { user } = useSelector((state) => state.auth);
  const [latestMessages, setLatestMessages] = useState([]);
  const notificationsRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      fetchData();
      // Загрузка последних входящих сообщений
      const fetchLatestMessages = async () => {
        try {
          const response = await messagesAPI.getMessages();
          // Фильтруем только входящие сообщения
          const incoming = response.data.filter(msg => msg.recipient?._id === user?._id);
          // Сортируем по дате (новые сверху)
          incoming.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          let messages = incoming.slice(0, 5); // Показываем только 5 последних

          // Получаем курсы для поиска последней записи
          const coursesResp = await coursesAPI.getTeacherCourses();
          let lastEnroll = null;
          let lastEnrollDate = null;
          coursesResp.data.forEach(course => {
            if (Array.isArray(course.enrolledStudents) && course.enrolledStudents.length > 0) {
              const student = course.enrolledStudents[course.enrolledStudents.length - 1];
              // Если есть enrolledAt, используем его, иначе updatedAt курса
              const enrolledAt = student.enrolledAt || course.updatedAt;
              if (!lastEnrollDate || new Date(enrolledAt) > new Date(lastEnrollDate)) {
                lastEnroll = {
                  student,
                  courseTitle: course.title,
                  enrolledAt
                };
                lastEnrollDate = enrolledAt;
              }
            }
          });
          if (lastEnroll) {
            messages = [
              {
                _id: 'enroll-notification',
                subject: `Новая запись на курс`,
                sender: lastEnroll.student,
                createdAt: lastEnroll.enrolledAt,
                content: `Пользователь ${lastEnroll.student.name || lastEnroll.student.email} записался на курс "${lastEnroll.courseTitle}"`
              },
              ...messages
            ];
          }
          setLatestMessages(messages);
        } catch (e) {
          // Не критично, если не загрузили
        }
      };
      fetchLatestMessages();
    }
  }, [user?._id]);

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
        totalRevenue: response.data.reduce((sum, course) => {
          const teacherShare = 0.4; // 40% от стоимости курса
          return sum + (course.price * (course.enrolledStudents?.length || 0) * teacherShare);
        }, 0),
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 6 }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, justifyContent: 'space-between' }}>
          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: -1 }}>
              Панель преподавателя
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 4 }}>
              Управляйте своими курсами, следите за статистикой и общайтесь со студентами
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
                icon: <PeopleIcon />, color: '#7c3aed', label: 'Всего студентов', value: stats.totalStudents
              }, {
                icon: <SchoolOutlinedIcon />, color: '#1976d2', label: 'Всего курсов', value: stats.totalCourses
              }, {
                icon: <MonetizationOnIcon />, color: '#00bfae', label: 'Доход', value: stats.totalRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
              }, {
                icon: <StarIcon />, color: '#ffb300', label: 'Средний рейтинг', value: stats.averageRating
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
            <Grid container spacing={3}>
              {courses.slice(0, 5).map((course) => (
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
                    <Box sx={{ position: 'relative', height: 180, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
                      <img
                        src={course.thumbnail ? `http://localhost:5000/${course.thumbnail}` : 'https://source.unsplash.com/random?course'}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, minHeight: 36, maxHeight: 36, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {course.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0, mt: -0.5 }}>
                          <PeopleIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                          <Typography variant="body2" sx={{ mr: 2 }}>{course.enrolledStudents?.length || 0}</Typography>
                          <StarIcon sx={{ fontSize: 18, color: '#ffb300' }} />
                          <Typography variant="body2">{course.rating || 0}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/courses/${course._id}/edit`)}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              flex: 1
                            }}
                          >
                            Изменить
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteCourse(course._id)}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              flex: 1
                            }}
                          >
                            Удалить
                          </Button>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/courses/${course._id}`)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                            color: '#fff',
                            textTransform: 'none',
                            width: '100%',
                            mt: 1,
                            ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
                          }}
                        >
                          Подробнее
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {courses.length > 6 && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    onClick={() => navigate('/dashboard/teacher')}
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
              {courses.length <= 6 && courses.slice(5, 6).map((course) => (
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
                    <Box sx={{ position: 'relative', height: 180, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
                      <img
                        src={course.thumbnail ? `http://localhost:5000/${course.thumbnail}` : 'https://source.unsplash.com/random?course'}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, minHeight: 36, maxHeight: 36, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {course.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0, mt: -0.5 }}>
                          <PeopleIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                          <Typography variant="body2" sx={{ mr: 2 }}>{course.enrolledStudents?.length || 0}</Typography>
                          <StarIcon sx={{ fontSize: 18, color: '#ffb300' }} />
                          <Typography variant="body2">{course.rating || 0}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/courses/${course._id}/edit`)}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              flex: 1
                            }}
                          >
                            Изменить
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteCourse(course._id)}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              flex: 1
                            }}
                          >
                            Удалить
                          </Button>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/courses/${course._id}`)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                            color: '#fff',
                            textTransform: 'none',
                            width: '100%',
                            mt: 1,
                            ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
                          }}
                        >
                          Подробнее
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {/* Последние сообщения/уведомления */}
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 6, mb: 2 }}>
              Последние сообщения и уведомления
            </Typography>
            <Paper ref={notificationsRef} sx={{ p: 3, borderRadius: 4, boxShadow: 2, bgcolor: '#fff' }}>
              {latestMessages.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Нет новых сообщений
                </Typography>
              ) : (
                <List>
                  {latestMessages.map((msg) => (
                    <ListItem key={msg._id} alignItems="flex-start" sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#f8fafc', transition: 'box-shadow 0.2s', ':hover': { boxShadow: 3, bgcolor: '#e0e7ff' } }}>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600 }}>{msg.subject || 'Сообщение'}</Typography>}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {msg.content?.slice(0, 80)}{msg.content?.length > 80 ? '...' : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(msg.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
          {/* Sidebar теперь справа */}
          <Box sx={{ minWidth: 220, maxWidth: 260, mb: { xs: 4, md: 0 }, order: { xs: 2, md: 2 } }}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3, bgcolor: '#fff', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#7c3aed' }}>
                Навигация
              </Typography>
              <List>
                <ListItem
                  button
                  onClick={() => {
                    if (window.location.pathname === '/dashboard/teacher') {
                      window.location.reload();
                    } else {
                      navigate('/dashboard/teacher');
                    }
                  }}
                >
                  <ListItemText primary="Мои курсы" />
                </ListItem>
                <ListItem button onClick={() => navigate('/students')}>
                  <ListItemText primary="Студенты" />
                </ListItem>
                <ListItem button onClick={() => navigate('/messages')}>
                  <ListItemText primary="Сообщения" />
                  <MessageIcon sx={{ ml: 1, color: '#7c3aed' }} />
                </ListItem>
                <ListItem button onClick={() => {
                  if (notificationsRef.current) {
                    notificationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}>
                  <ListItemText primary="Уведомления" />
                  <NotificationsIcon sx={{ ml: 1, color: '#7c3aed' }} />
                </ListItem>
              </List>
            </Paper>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/courses/create')}
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
              Создать курс
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default TeacherDashboard; 