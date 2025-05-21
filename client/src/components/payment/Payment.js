import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { paymentAPI } from '../../services/api';

const Payment = ({ course, onSuccess, onCancel }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    promoCode: ''
  });
  const [discount, setDiscount] = useState(null);
  const [finalPrice, setFinalPrice] = useState(course?.price || 0);

  // Функция для маскирования номера карты
  const maskCardNumber = (number) => {
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Функция для валидации номера карты
  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  // Функция для валидации CVV
  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  // Функция для валидации срока действия
  const validateExpiryDate = (date) => {
    if (!/^\d{2}\/\d{2}$/.test(date)) return false;
    const [month, year] = date.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(month) < 1 || parseInt(month) > 12) return false;
    if (parseInt(year) < currentYear) return false;
    if (parseInt(year) === currentYear && parseInt(month) < currentMonth) return false;
    
    return true;
  };

  useEffect(() => {
    if (discount) {
      const discountedPrice = discount.type === 'percentage'
        ? course.price * (1 - discount.value / 100)
        : course.price - discount.value;
      setFinalPrice(Math.max(0, discountedPrice));
    } else {
      setFinalPrice(course?.price || 0);
    }
  }, [discount, course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'cardNumber') {
      processedValue = maskCardNumber(value.replace(/\D/g, '').slice(0, 16));
    } else if (name === 'expiryDate') {
      processedValue = value
        .replace(/\D/g, '')
        .replace(/^(\d{2})/, '$1/')
        .slice(0, 5);
    } else if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handlePromoCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await paymentAPI.validatePromoCode(formData.promoCode);
      setDiscount(response.data);
      setError('');
    } catch (err) {
      setError('Недействительный промокод');
      setDiscount(null);
    }
  };

  const validateForm = () => {
    if (paymentMethod === 'card') {
      if (!validateCardNumber(formData.cardNumber)) {
        setError('Неверный номер карты');
        return false;
      }
      if (!validateCVV(formData.cvv)) {
        setError('Неверный CVV код');
        return false;
      }
      if (!validateExpiryDate(formData.expiryDate)) {
        setError('Неверный срок действия карты');
        return false;
      }
      if (!formData.cardName.trim()) {
        setError('Введите имя владельца карты');
        return false;
      }
    }
    return true;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const paymentData = {
        courseId: course._id,
        amount: finalPrice,
        paymentMethod,
        ...formData,
        promoCode: formData.promoCode || undefined
      };

      const response = await paymentAPI.processPayment(paymentData);
      onSuccess(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Ошибка при обработке платежа';
      setError(errorMessage);
      setLoading(false);
      
      // Если ошибка связана с платежной системой, возвращаемся на шаг ввода данных
      if (errorMessage.includes('платеж') || errorMessage.includes('карт')) {
        setActiveStep(1);
      }
    }
  };

  const steps = ['Выбор способа оплаты', 'Ввод данных', 'Подтверждение'];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <FormLabel component="legend">Выберите способ оплаты</FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <FormControlLabel
                value="card"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon />
                    <Typography>Банковская карта</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="bank"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BankIcon />
                    <Typography>Банковский перевод</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>
        );

      case 1:
        return (
          <Box component="form" sx={{ mt: 3 }}>
            {paymentMethod === 'card' ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Номер карты"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Имя на карте"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Срок действия"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="CVV"
                    name="cvv"
                    type="password"
                    value={formData.cvv}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Реквизиты для оплаты:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Банк: Example Bank
                  <br />
                  ИНН: 1234567890
                  <br />
                  БИК: 123456789
                  <br />
                  Расчетный счет: 12345678901234567890
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Промокод
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Введите промокод"
                  name="promoCode"
                  value={formData.promoCode}
                  onChange={handleChange}
                />
                <Button
                  variant="outlined"
                  onClick={handlePromoCodeSubmit}
                  disabled={!formData.promoCode}
                >
                  Применить
                </Button>
              </Box>
              {discount && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Промокод применен! Скидка: {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                </Alert>
              )}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Подтверждение оплаты
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Курс: {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course.description}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Стоимость курса:</Typography>
                  <Typography>${course.price}</Typography>
                </Box>
                {discount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Скидка:</Typography>
                    <Typography color="error">
                      -${course.price - finalPrice}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Итого к оплате:</Typography>
                  <Typography variant="h6">${finalPrice}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Оплата курса
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
          >
            Назад
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handlePaymentSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
            >
              {loading ? 'Обработка...' : 'Оплатить'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setActiveStep(prev => prev + 1)}
            >
              Далее
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Payment; 