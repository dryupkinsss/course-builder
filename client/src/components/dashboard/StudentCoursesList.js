import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { coursesAPI } from '../../services/api';
import { Box, Grid, Card, CardContent, Typography, Button, CircularProgress, Alert, Avatar, Container } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StarIcon from '@mui/icons-material/Star';

const StudentCoursesList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?._id) {
      coursesAPI.getEnrolledCourses()
        .then(res => setCourses(res.data))
        .catch(() => setError('Ошибка при загрузке курсов'))
        .finally(() => setLoading(false));
    }
  }, [user?._id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Мои курсы</Typography>
        <Grid container spacing={3}>
          {courses.length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ ml: 2, mt: 2 }}>
              Вы еще не записаны ни на один курс.
            </Typography>
          )}
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
                      <StarIcon sx={{ fontSize: 18, color: '#ffb300' }} />
                      <Typography variant="body2">{course.rating || 0}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => navigate(`/courses/${course._id}`)}
                      sx={{ borderRadius: 2, fontWeight: 600, background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)', color: '#fff', textTransform: 'none', width: '100%', mt: 1, ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' } }}
                    >
                      Перейти к курсу
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', width: '100%' }}
                      onClick={async () => {
                        if (window.confirm('Вы уверены, что хотите покинуть этот курс?')) {
                          await coursesAPI.leaveCourse(course._id);
                          setCourses(courses.filter(c => c._id !== course._id));
                        }
                      }}
                    >
                      Покинуть курс
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

export default StudentCoursesList; 