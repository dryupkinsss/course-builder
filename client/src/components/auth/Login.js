import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { authAPI } from '../../services/api';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const response = await authAPI.login(formData);
      dispatch(loginSuccess(response.data));
      navigate('/dashboard');
    } catch (err) {
      dispatch(loginFailure(
        err.response?.data?.message || 'Ошибка при входе в систему'
      ));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 4 }}>
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Paper elevation={4} sx={{ p: 3, borderRadius: 4, boxShadow: 4, mt: 6, maxWidth: 420, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: -1, color: '#18181b' }}>
            Вход в систему
          </Typography>
          <Typography align="center" sx={{ color: 'text.secondary', mb: 2 }}>
            Добро пожаловать! Введите свои данные для входа
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 1.5, borderRadius: 3, bgcolor: '#f5f7fa' }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 2, borderRadius: 3, bgcolor: '#f5f7fa' }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 1,
                mb: 1.5,
                py: 1.2,
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 3,
                background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                color: '#fff',
                boxShadow: 2,
                textTransform: 'none',
                letterSpacing: 0.2,
                ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Войти'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button
                component={RouterLink}
                to="/register"
                variant="text"
                sx={{ color: '#1976d2', fontWeight: 600, textTransform: 'none', fontSize: 16 }}
              >
                Нет аккаунта? Зарегистрируйтесь
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 