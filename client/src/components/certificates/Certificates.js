import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Grid
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon
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
        <Alert severity="warning">
          Пожалуйста, войдите в систему для доступа к сертификатам
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, boxShadow: 3, bgcolor: '#f5f7fa', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Мои сертификаты
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {certificates.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, boxShadow: 2, bgcolor: '#fff' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              У вас пока нет сертификатов
            </Typography>
            <Typography color="textSecondary">
              Завершите курсы, чтобы получить сертификаты
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {certificates.map((certificate) => (
              <Grid item xs={12} sm={6} md={4} key={certificate._id}>
                <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 2, bgcolor: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PdfIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {certificate.course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Номер: {certificate.certificateNumber}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Дата выдачи: {new Date(certificate.issueDate).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(certificate._id)}
                    sx={{ borderRadius: 3, fontWeight: 600, py: 1.2, boxShadow: 2, transition: 'box-shadow 0.3s', ':hover': { boxShadow: 4 } }}
                  >
                    Скачать PDF
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Certificates; 