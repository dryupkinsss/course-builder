import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { certificatesAPI } from '../../services/api';

const Certificates = () => {
  const { user } = useSelector((state) => state.auth);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      const response = await certificatesAPI.getAll();
      setCertificates(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке сертификатов');
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId) => {
    try {
      const response = await certificatesAPI.download(certificateId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Ошибка при скачивании сертификата');
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Пожалуйста, войдите в систему для доступа к сертификатам
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#1976d2' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 4 }}>
      <Container maxWidth="lg">
        {/* Заголовок */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 2, p: 2, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.8)', boxShadow: 2 }}>
            <TrophyIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#18181b' }}>
              Мои сертификаты
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ color: '#666', maxWidth: 600, mx: 'auto' }}>
            Ваши достижения и подтверждения успешного прохождения курсов
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {certificates.length === 0 ? (
          <Fade in>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: 2, bgcolor: '#fff', maxWidth: 600, mx: 'auto' }}>
              <TrophyIcon sx={{ fontSize: 60, color: '#e0e7ff', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                У вас пока нет сертификатов
              </Typography>
              <Typography color="text.secondary">
                Завершите курсы, чтобы получить сертификаты об успешном прохождении
              </Typography>
            </Paper>
          </Fade>
        ) : (
          <Grid container spacing={3}>
            {certificates.map((certificate, index) => (
              <Grid item xs={12} sm={6} md={4} key={certificate._id}>
                <Zoom in style={{ transitionDelay: `${index * 100}ms` }}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 4, 
                      boxShadow: 2, 
                      bgcolor: '#fff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: '#e0e7ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <PdfIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#18181b' }}>
                          {certificate.course.title}
                        </Typography>
                        <Chip 
                          size="small" 
                          label="Выдан" 
                          color="success" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: '#4ade80',
                            color: '#fff'
                          }} 
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AssignmentIcon sx={{ fontSize: 16, color: '#666', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Номер: {certificate.certificateNumber}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ fontSize: 16, color: '#666', mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Выдан: {new Date(certificate.issueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />
                    
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(certificate._id)}
                      fullWidth
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 600,
                        py: 1.2,
                        background: 'linear-gradient(90deg, #1976d2 30%, #7c3aed 100%)',
                        color: '#fff',
                        boxShadow: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 4,
                          background: 'linear-gradient(90deg, #1565c0 30%, #6d28d9 100%)'
                        }
                      }}
                    >
                      Скачать PDF
                    </Button>
                  </Paper>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Certificates; 