import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { coursesAPI } from '../../services/api';
import { Box, Grid, Card, CardContent, Typography, Button, CircularProgress, Alert, Avatar, Container } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';

const TeacherCoursesList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?._id) {
      coursesAPI.getTeacherCourses()
        .then(res => setCourses(res.data))
        .catch(() => setError('Ошибка при загрузке курсов'))
        .finally(() => setLoading(false));
    }
  }, [user?._id]);

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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Все курсы</Typography>
        <Grid container spacing={3}>
          {courses.map(course => (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <Card sx={{ maxWidth: 250, minWidth: 0, height: 320, display: 'flex', flexDirection: 'column', borderRadius: 4, boxShadow: 4, bgcolor: '#fff', mx: 'auto' }}>
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
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flex: 1 }}
                      >
                        Изменить
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteCourse(course._id)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flex: 1 }}
                      >
                        Удалить
                      </Button>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/courses/${course._id}`)}
                      sx={{ borderRadius: 2, fontWeight: 600, background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)', color: '#fff', textTransform: 'none', width: '100%', mt: 1, ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' } }}
                    >
                      Подробнее
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherCoursesList; 