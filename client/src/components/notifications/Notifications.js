import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Box,
  CircularProgress,
  Button,
  Badge,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  School as SchoolIcon,
  Message as MessageIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { notificationsAPI } from '../../services/api';

const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      const response = await notificationsAPI.getAll({
        page: pageNum,
        limit: ITEMS_PER_PAGE
      });
      
      if (pageNum === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setUnreadCount(response.data.unreadCount);
      setHasMore(response.data.notifications.length === ITEMS_PER_PAGE);
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      setError('Ошибка при загрузке уведомлений');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setPage(prev => prev + 1);
    fetchNotifications(page + 1);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError('Ошибка при обновлении уведомления');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev =>
        prev.filter(notification => notification._id !== id)
      );
      if (!notifications.find(n => n._id === id)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError('Ошибка при удалении уведомления');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      handleMenuClose();
    } catch (err) {
      setError('Ошибка при обновлении уведомлений');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'course':
        return <SchoolIcon />;
      case 'message':
        return <MessageIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Уведомления
          {unreadCount > 0 && (
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{ ml: 2 }}
            >
              <NotificationsIcon />
            </Badge>
          )}
        </Typography>
        <Button
          variant="outlined"
          onClick={handleMenuOpen}
          startIcon={<NotificationsIcon />}
        >
          Действия
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMarkAllAsRead}>
            <CheckIcon sx={{ mr: 1 }} />
            Отметить все как прочитанные
          </MenuItem>
        </Menu>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper>
        <List>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Нет уведомлений"
                secondary="У вас пока нет новых уведомлений"
              />
            </ListItem>
          ) : (
            <>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'inherit' : 'action.hover'
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {notification.message}
                          </Typography>
                          <br />
                          {new Date(notification.createdAt).toLocaleString()}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      {!notification.read && (
                        <IconButton
                          edge="end"
                          onClick={() => handleMarkAsRead(notification._id)}
                          sx={{ mr: 1 }}
                        >
                          <CheckIcon />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(notification._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    startIcon={loadingMore ? <CircularProgress size={20} /> : null}
                  >
                    {loadingMore ? 'Загрузка...' : 'Загрузить еще'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </List>
      </Paper>
    </Container>
  );
};

export default React.memo(Notifications); 