import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { promotionsAPI } from '../../services/api';

const Promotions = () => {
  const { user } = useSelector((state) => state.auth);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    startDate: '',
    endDate: '',
    maxUses: '',
    minPurchase: '',
    courses: []
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await promotionsAPI.getAll();
      setPromotions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке промокодов');
      setLoading(false);
    }
  };

  const handleOpenDialog = (promotion = null) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        maxUses: promotion.maxUses,
        minPurchase: promotion.minPurchase,
        courses: promotion.courses
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        code: '',
        type: 'percentage',
        value: '',
        startDate: '',
        endDate: '',
        maxUses: '',
        minPurchase: '',
        courses: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromotion(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      startDate: '',
      endDate: '',
      maxUses: '',
      minPurchase: '',
      courses: []
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPromotion) {
        await promotionsAPI.update(editingPromotion._id, formData);
        setSuccess('Промокод успешно обновлен');
      } else {
        await promotionsAPI.create(formData);
        setSuccess('Промокод успешно создан');
      }
      handleCloseDialog();
      fetchPromotions();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при сохранении промокода');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот промокод?')) {
      try {
        await promotionsAPI.delete(id);
        setSuccess('Промокод успешно удален');
        fetchPromotions();
      } catch (err) {
        setError('Ошибка при удалении промокода');
      }
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccess('Промокод скопирован в буфер обмена');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Промокоды и скидки
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Создать промокод
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Статистика */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Активные промокоды
              </Typography>
              <Typography variant="h3">
                {promotions.filter(p => new Date(p.endDate) > new Date()).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Всего использовано
              </Typography>
              <Typography variant="h3">
                {promotions.reduce((sum, p) => sum + p.uses, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Средняя скидка
              </Typography>
              <Typography variant="h3">
                {promotions.length > 0
                  ? `${(promotions.reduce((sum, p) => sum + p.value, 0) / promotions.length).toFixed(1)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Таблица промокодов */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Код</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Значение</TableCell>
                  <TableCell>Действует до</TableCell>
                  <TableCell>Использований</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {promotion.code}
                        <IconButton
                          size="small"
                          onClick={() => handleCopyCode(promotion.code)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {promotion.type === 'percentage' ? 'Процент' : 'Фиксированная сумма'}
                    </TableCell>
                    <TableCell>
                      {promotion.type === 'percentage'
                        ? `${promotion.value}%`
                        : `$${promotion.value}`}
                    </TableCell>
                    <TableCell>{formatDate(promotion.endDate)}</TableCell>
                    <TableCell>
                      {promotion.uses} / {promotion.maxUses || '∞'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={new Date(promotion.endDate) > new Date() ? 'Активен' : 'Истек'}
                        color={new Date(promotion.endDate) > new Date() ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(promotion)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(promotion._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Диалог создания/редактирования промокода */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPromotion ? 'Редактировать промокод' : 'Создать промокод'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Код промокода"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Тип скидки</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Тип скидки"
                  >
                    <MenuItem value="percentage">Процент</MenuItem>
                    <MenuItem value="fixed">Фиксированная сумма</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Значение"
                  name="value"
                  type="number"
                  value={formData.value}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Дата начала"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Дата окончания"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Максимум использований"
                  name="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Минимальная сумма покупки"
                  name="minPurchase"
                  type="number"
                  value={formData.minPurchase}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPromotion ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Promotions; 