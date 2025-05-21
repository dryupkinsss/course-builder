import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box
} from '@mui/material';

const Home = () => {
  const features = [
    {
      title: 'Создавайте курсы',
      description: 'Разрабатывайте и публикуйте свои онлайн-курсы с помощью нашего удобного конструктора.',
      image: 'https://source.unsplash.com/random/400x300?education'
    },
    {
      title: 'Обучайтесь',
      description: 'Получайте доступ к качественным курсам от опытных преподавателей.',
      image: 'https://source.unsplash.com/random/400x300?learning'
    },
    {
      title: 'Отслеживайте прогресс',
      description: 'Следите за своим обучением и получайте сертификаты о прохождении курсов.',
      image: 'https://source.unsplash.com/random/400x300?certificate'
    }
  ];

  return (
    <Box>
      {/* Hero секция */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
          >
            Создавайте и проходите онлайн-курсы
          </Typography>
          <Typography
            variant="h5"
            align="center"
            paragraph
          >
            Платформа для создания и прохождения онлайн-курсов с удобным интерфейсом
            и всеми необходимыми инструментами для эффективного обучения.
          </Typography>
          <Box
            sx={{
              mt: 4,
              display: 'flex',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              size="large"
              component={RouterLink}
              to="/courses"
            >
              Начать обучение
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              component={RouterLink}
              to="/courses/create"
            >
              Создать курс
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Секция с преимуществами */}
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={feature.image}
                  alt={feature.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 