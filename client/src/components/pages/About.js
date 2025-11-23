import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';

const About = () => {
  return (
    <Box sx={{ minHeight: '80vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 6 }}>
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 4, boxShadow: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Разработчик Седнев Андрей, группа 43ИС
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default About; 