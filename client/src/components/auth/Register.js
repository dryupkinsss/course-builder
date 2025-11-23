import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { authAPI } from '../../services/api';
import { loginSuccess } from '../../store/slices/authSlice';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isTeacher = params.get('role') === 'teacher';
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accessCode: ''
  });
  const [formError, setFormError] = useState('');

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
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Пожалуйста, введите ФИО');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Пароли не совпадают');
      return;
    }
    if (isTeacher && formData.accessCode !== '597238') {
      setFormError('Неверный код-доступа для преподавателя');
      return;
    }

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: isTeacher ? 'teacher' : 'student'
      });
      localStorage.setItem('token', response.data.token);
      // Получаем полные данные пользователя
      const userResponse = await authAPI.getCurrentUser();
      dispatch(loginSuccess({
        user: userResponse.data,
        token: response.data.token
      }));
      navigate('/dashboard');
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Ошибка при регистрации'
      );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)', py: 4 }}>
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Paper elevation={4} sx={{ p: 3, borderRadius: 4, boxShadow: 4, mt: 6, maxWidth: 420, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: -1, color: '#18181b' }}>
            {isTeacher ? 'Регистрация преподавателя' : 'Регистрация студента'}
          </Typography>
          <Typography align="center" sx={{ color: 'text.secondary', mb: 2 }}>
            {isTeacher ? 'Для регистрации преподавателя требуется код-доступа' : 'Заполните форму для создания аккаунта студента'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="name"
              label="ФИО"
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 1.5, borderRadius: 3, bgcolor: '#f5f7fa' }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
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
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 1.5, borderRadius: 3, bgcolor: '#f5f7fa' }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Подтвердите пароль"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              sx={{ mb: 1.5, borderRadius: 3, bgcolor: '#f5f7fa' }}
            />
            {isTeacher && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="accessCode"
                label="Код-доступа преподавателя"
                type="text"
                id="accessCode"
                value={formData.accessCode}
                onChange={handleChange}
                disabled={loading}
                sx={{ mb: 2, borderRadius: 3, bgcolor: '#f3e8ff', border: '1px solid #7c3aed' }}
                InputLabelProps={{ style: { color: '#7c3aed' } }}
              />
            )}
            {formError && (
              <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>
            )}
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
                background: isTeacher ? 'linear-gradient(90deg, #7c3aed 60%, #1976d2 100%)' : 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
                color: '#fff',
                boxShadow: 2,
                textTransform: 'none',
                letterSpacing: 0.2,
                ':hover': { background: isTeacher ? 'linear-gradient(90deg, #6d28d9 60%, #1565c0 100%)' : 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' }
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
            </Button>
            {!isTeacher && (
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="text"
                  sx={{ color: '#1976d2', fontWeight: 600, textTransform: 'none', fontSize: 16 }}
                >
                  Уже есть аккаунт? Войдите
                </Button>
              </Box>
            )}
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register; 