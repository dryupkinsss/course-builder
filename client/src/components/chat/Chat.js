import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Badge,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { chatAPI } from '../../services/api';
import DOMPurify from 'dompurify';

const Chat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке списка чатов');
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data);
    } catch (err) {
      setError('Ошибка при загрузке сообщений');
    }
  };

  const sanitizeMessage = (message) => {
    return DOMPurify.sanitize(message, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href']
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const sanitizedMessage = sanitizeMessage(newMessage);
    if (!sanitizedMessage) {
      setError('Сообщение содержит недопустимые символы');
      return;
    }

    try {
      const response = await chatAPI.sendMessage(selectedConversation._id, {
        content: sanitizedMessage
      });
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      setError('Ошибка при отправке сообщения');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка размера файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10MB');
      return;
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Недопустимый тип файла');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await chatAPI.sendFile(selectedConversation._id, formData);
      setMessages(prev => [...prev, response.data]);
    } catch (err) {
      setError('Ошибка при загрузке файла');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Оптимизация рендеринга сообщений
  const renderMessage = useCallback((message) => (
    <Box
      key={message._id}
      sx={{
        display: 'flex',
        justifyContent: message.sender._id === user._id ? 'flex-end' : 'flex-start'
      }}
    >
      <Paper
        sx={{
          p: 1,
          maxWidth: '70%',
          bgcolor: message.sender._id === user._id ? 'primary.main' : 'grey.100',
          color: message.sender._id === user._id ? 'white' : 'text.primary'
        }}
      >
        {message.file ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFileIcon />
            <Typography variant="body2">
              {message.file.name}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="body1"
            dangerouslySetInnerHTML={{ __html: sanitizeMessage(message.content) }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
            opacity: 0.7
          }}
        >
          {formatTime(message.createdAt)}
        </Typography>
      </Paper>
    </Box>
  ), [user._id]);

  // Мемоизация списка сообщений
  const messagesList = useMemo(() => (
    messages.map(renderMessage)
  ), [messages, renderMessage]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 100px)' }}>
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Список чатов */}
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: 320,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 320,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%'
            }
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Чаты</Typography>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
          <Divider />
          <List sx={{ overflow: 'auto' }}>
            {conversations.map((conversation) => (
              <ListItem
                key={conversation._id}
                button
                selected={selectedConversation?._id === conversation._id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  if (isMobile) setDrawerOpen(false);
                }}
              >
                <ListItemAvatar>
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={!conversation.unreadCount}
                  >
                    <Avatar src={conversation.participant.avatar}>
                      {conversation.participant.name[0]}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={conversation.participant.name}
                  secondary={conversation.lastMessage?.content}
                  primaryTypographyProps={{
                    fontWeight: conversation.unreadCount ? 'bold' : 'normal'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Область чата */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Заголовок чата */}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Avatar
                  src={selectedConversation.participant.avatar}
                  sx={{ mr: 2 }}
                >
                  {selectedConversation.participant.name[0]}
                </Avatar>
                <Typography variant="h6">
                  {selectedConversation.participant.name}
                </Typography>
              </Box>

              {/* Сообщения */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                {messagesList}
                <div ref={messagesEndRef} />
              </Box>

              {/* Форма отправки сообщения */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 1
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  color="primary"
                >
                  <AttachFileIcon />
                </IconButton>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  size="small"
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Выберите чат для начала общения
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default React.memo(Chat); 