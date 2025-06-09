import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  useMediaQuery
} from '@mui/material';
import { AccountCircle, Menu as MenuIcon, Notifications, Message, Settings } from '@mui/icons-material';
import BookIcon from '@mui/icons-material/MenuBook';
import { logout } from '../../store/slices/authSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMenu, setMobileMenu] = React.useState(false);
  const isMd = useMediaQuery('(min-width:900px)');

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/');
  };

  const navigation = [
    { name: 'Каталог', href: '/courses' },
    { name: 'Мои курсы', href: '/dashboard', show: isAuthenticated && user?.role !== 'teacher' },
    { name: 'Преподавание', href: '/dashboard', show: isAuthenticated && user?.role === 'teacher' },
    { name: 'О нас', href: '/about' }
  ];

  return (
    <AppBar position="sticky" elevation={0} sx={{
      bgcolor: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e3e6ee',
      boxShadow: '0 2px 12px 0 rgba(80,80,180,0.04)',
      zIndex: 1201
    }}>
      <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', mr: 4 }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #1976d2 60%, #7c3aed 100%)',
            borderRadius: 2,
            p: 1,
            mr: 1
          }}>
            <BookIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: 24,
              letterSpacing: 0.5
            }}
          >
            Course Builder
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        {isMd && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
            {navigation.filter(item => item.show === undefined || item.show).map(item => (
              <Button
                key={item.name}
                component={RouterLink}
                to={item.href}
                sx={{
                  color: '#222',
                  fontWeight: 500,
                  fontSize: 16,
                  textTransform: 'none',
                  px: 2,
                  borderRadius: 2,
                  transition: 'color 0.2s, background 0.2s',
                  ':hover': {
                    color: '#1976d2',
                    background: 'rgba(25, 118, 210, 0.07)'
                  }
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        )}

        {/* User Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          {isAuthenticated && (
            <IconButton color="primary" sx={{ position: 'relative' }}>
              <Badge badgeContent={3} color="error" overlap="circular">
                <Notifications sx={{ color: '#555' }} />
              </Badge>
            </IconButton>
          )}
          {/* Messages */}
          {isAuthenticated && (
            <IconButton color="primary" onClick={() => navigate('/messages')}>
              <Message sx={{ color: '#555' }} />
            </IconButton>
          )}
          {/* Profile */}
          {isAuthenticated ? (
            <>
              <IconButton onClick={handleMenu} sx={{ ml: 1 }}>
                {user?.avatar ? (
                  <Avatar src={user.avatar} alt={user.name} sx={{ width: 36, height: 36 }} />
                ) : (
                  <AccountCircle sx={{ fontSize: 36, color: '#555' }} />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem component={RouterLink} to="/dashboard" onClick={handleClose}>Личный кабинет</MenuItem>
                <MenuItem component={RouterLink} to="/certificates" onClick={handleClose}>Сертификаты</MenuItem>
                {user?.role === 'teacher' && (
                  <MenuItem component={RouterLink} to="/courses/create" onClick={handleClose}>Создать курс</MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                component={RouterLink}
                to="/login"
                sx={{ color: '#1976d2', fontWeight: 600, textTransform: 'none', borderRadius: 2, px: 2 }}
              >
                Войти
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                sx={{ color: '#fff', background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)', fontWeight: 600, textTransform: 'none', borderRadius: 2, px: 2, ml: 1, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)', ':hover': { background: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' } }}
              >
                Регистрация
              </Button>
            </>
          )}
        </Box>

        {/* Mobile menu button */}
        {!isMd && (
          <IconButton onClick={() => setMobileMenu(!mobileMenu)} sx={{ ml: 1 }}>
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
      {/* Mobile Navigation */}
      {!isMd && mobileMenu && (
        <Box sx={{ px: 2, pb: 2, bgcolor: 'rgba(255,255,255,0.97)', borderBottom: '1px solid #e3e6ee' }}>
          {navigation.filter(item => item.show === undefined || item.show).map(item => (
            <Button
              key={item.name}
              component={RouterLink}
              to={item.href}
              sx={{
                color: '#222',
                fontWeight: 500,
                fontSize: 16,
                textTransform: 'none',
                px: 2,
                borderRadius: 2,
                width: '100%',
                justifyContent: 'flex-start',
                my: 0.5,
                transition: 'color 0.2s, background 0.2s',
                ':hover': {
                  color: '#1976d2',
                  background: 'rgba(25, 118, 210, 0.07)'
                }
              }}
              onClick={() => setMobileMenu(false)}
            >
              {item.name}
            </Button>
          ))}
        </Box>
      )}
    </AppBar>
  );
};

export default Navbar; 