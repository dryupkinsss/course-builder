import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Avatar,
  Paper,
  Rating,
  Chip,
  CircularProgress
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { coursesAPI } from '../../services/api';

const Home = () => {
  const [topCourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCourses = async () => {
      try {
        const response = await coursesAPI.getAll();
        const sortedCourses = response.data
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        setTopCourses(sortedCourses);
      } catch (error) {
        console.error('Error fetching top courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCourses();
  }, []);

  const features = [
    {
      title: 'Создавайте курсы',
      description: 'Разрабатывайте и публикуйте свои онлайн-курсы с помощью нашего удобного конструктора.',
      icon: <SchoolIcon sx={{ fontSize: 40, color: '#7c3aed' }} />,
      color: '#ede9fe'
    },
    {
      title: 'Обучайтесь',
      description: 'Получайте доступ к качественным курсам от опытных преподавателей.',
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      color: '#e0e7ff'
    },
    {
      title: 'Получайте сертификаты',
      description: 'Следите за своим обучением и получайте сертификаты о прохождении курсов.',
      icon: <EmojiEventsIcon sx={{ fontSize: 40, color: '#ffb300' }} />,
      color: '#fff7e6'
    }
  ];

  return (
    <Box>
      {/* Hero секция */}
      <Box
        sx={{
          background: 'linear-gradient(120deg, #7c3aed 0%, #1976d2 100%)',
          color: 'white',
          py: { xs: 7, md: 10 },
          mb: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container alignItems="center" spacing={6}>
            <Grid item xs={12} md={7}>
              <Typography
                component="h1"
                variant="h2"
                sx={{ fontWeight: 900, mb: 3, letterSpacing: -1, lineHeight: 1.1 }}
              >
                Создавайте и проходите онлайн-курсы
              </Typography>
              <Typography
                variant="h5"
                sx={{ mb: 4, color: 'rgba(255,255,255,0.92)' }}
              >
                Платформа для создания и прохождения онлайн-курсов с удобным интерфейсом и всеми необходимыми инструментами для эффективного обучения.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={RouterLink}
                  to="/courses"
                  sx={{ fontWeight: 700, borderRadius: 3, px: 4, py: 1.5, fontSize: 18, boxShadow: 3 }}
                >
                  Начать обучение
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={RouterLink}
                  to="/register?role=teacher"
                  sx={{ fontWeight: 700, borderRadius: 3, px: 4, py: 1.5, fontSize: 18, borderWidth: 2, ml: { xs: 0, md: 2 } }}
                >
                  Я преподаватель
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <img
                  src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80"
                  alt="Онлайн обучение"
                  style={{ width: 340, height: 340, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 32px rgba(80,80,180,0.18)' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
        {/* Декоративные круги */}
        <Box sx={{ position: 'absolute', top: -80, right: -120, width: 320, height: 320, bgcolor: '#fff', opacity: 0.08, borderRadius: '50%' }} />
        <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 260, height: 260, bgcolor: '#fff', opacity: 0.07, borderRadius: '50%' }} />
      </Box>

      {/* Recommended Courses Section */}
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, textAlign: 'center' }}>
          Рекомендуемые курсы
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            textAlign: 'center', 
            mb: 4, 
            color: 'text.secondary',
            fontSize: '1.1rem'
          }}
        >
          Курсы с наибольшим рейтингом
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid 
            container 
            spacing={4} 
            sx={{ 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'center',
              alignItems: 'stretch'
            }}
          >
            {topCourses.map((course) => (
              <Grid 
                item 
                key={course._id} 
                xs={12} 
                md={4} 
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Card
                  sx={{
                    width: '100%',
                    maxWidth: 360,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    boxShadow: 4,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    ':hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 8
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={course.thumbnail ? `http://localhost:5000/${course.thumbnail}` : 'https://source.unsplash.com/random?course'}
                      alt={course.title}
                      sx={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                    />
                    <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 1 }}>
                      <Chip 
                        label={course.category} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(124, 58, 237, 0.9)', 
                          color: '#fff', 
                          fontWeight: 600 
                        }} 
                      />
                      {course.bestseller && (
                        <Chip 
                          label="Бестселлер" 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(255, 179, 0, 0.9)', 
                            color: '#fff', 
                            fontWeight: 600 
                          }} 
                        />
                      )}
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                      {course.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {course.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={course.rating || 0} readOnly precision={0.5} />
                      <Typography variant="body2" color="text.secondary">
                        {course.rating?.toFixed(1) || '0.0'}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
                      </Typography>
                      <Button
                        variant="contained"
                        component={RouterLink}
                        to={`/courses/${course._id}`}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                          background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)'
                          }
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
        )}
      </Container>

      {/* Секция с преимуществами */}
      <Box sx={{ bgcolor: '#f8fafc', py: 8, mt: 8 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              mb: 6, 
              textAlign: 'center',
              color: '#000000'
            }}
          >
            Преимущества
          </Typography>
          <Grid 
            container 
            spacing={4} 
            sx={{ 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'center',
              alignItems: 'stretch'
            }}
          >
            {features.map((feature, index) => (
              <Grid 
                item 
                key={index} 
                xs={12} 
                md={4}
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Card
                  sx={{
                    width: '100%',
                    maxWidth: 360,
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 4,
                    boxShadow: 4,
                    bgcolor: feature.color,
                    transition: 'box-shadow 0.2s',
                    ':hover': { 
                      boxShadow: 8, 
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: '#fff', 
                      width: 72, 
                      height: 72, 
                      mt: 3, 
                      mb: 2, 
                      boxShadow: 2 
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', px: 3 }}>
                    <Typography 
                      gutterBottom 
                      variant="h5" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        mb: 2
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: '1rem',
                        lineHeight: 1.5
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 