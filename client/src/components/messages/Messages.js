import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { coursesAPI, messagesAPI } from '../../services/api';

const Messages = () => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [selectedDialog, setSelectedDialog] = useState(null);
  const [sending, setSending] = useState(false);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const dialogs = useMemo(() => {
    const dialogMap = {};
    messages.forEach(msg => {
      const isSender = msg.sender?._id === user?._id;
      const other = isSender ? msg.recipient : msg.sender;
      if (!other?._id) return;
      if (!dialogMap[other._id]) dialogMap[other._id] = [];
      dialogMap[other._id].push(msg);
    });
    // Сортировка по дате последнего сообщения
    return Object.entries(dialogMap)
      .map(([id, msgs]) => ({
        user: msgs[0].sender._id === user._id ? msgs[0].recipient : msgs[0].sender,
        messages: msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      }))
      .sort((a, b) => new Date(b.messages[b.messages.length-1].createdAt) - new Date(a.messages[a.messages.length-1].createdAt));
  }, [messages, user]);
  const selectedDialogObj = useMemo(() => {
    const found = dialogs.find(d => d.user._id === selectedDialog);
    if (found) return found;
    if (selectedDialog) {
      const userObj = recipients.find(r => r._id === selectedDialog);
      if (userObj) return { user: userObj, messages: [] };
    }
    return undefined;
  }, [dialogs, selectedDialog, recipients]);
  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchRecipients();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedDialogObj?.messages?.length]);

  useEffect(() => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }
  }, [selectedDialogObj?.messages?.length]);

  const fetchMessages = async () => {
    try {
      const response = await messagesAPI.getMessages();
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке сообщений');
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      if (user?.role === 'student') {
        const response = await coursesAPI.getEnrolledCourses();
        const teachers = response.data
          .map(course => course.instructor)
          .filter((instructor, idx, arr) => instructor && arr.findIndex(i => i._id === instructor._id) === idx);
        setRecipients(teachers);
      } else {
        const response = await coursesAPI.getTeacherCourses();
        const allStudents = response.data.reduce((acc, course) => {
          if (Array.isArray(course.enrolledStudents)) {
            course.enrolledStudents.forEach(student => {
              if (!acc.find(s => s._id === student._id)) {
                acc.push(student);
              }
            });
          }
          return acc;
        }, []);
        setRecipients(allStudents);
      }
    } catch (err) {
      setError('Ошибка при загрузке списка получателей');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDialogObj) return;
    setSending(true);
    try {
      await messagesAPI.sendMessage({
        recipient: selectedDialogObj.user._id,
        subject: '',
        content: newMessage
      });
      setNewMessage('');
      await fetchMessages();
      setSelectedDialog(selectedDialogObj.user._id);
    } catch (err) {
      setError('Ошибка при отправке сообщения');
    } finally {
      setSending(false);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 0, borderRadius: 4, boxShadow: 3, bgcolor: '#f5f7fa', display: 'flex', minHeight: 600, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box sx={{ width: 320, bgcolor: 'background.paper', borderRight: '1px solid #e5e7eb', display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb', bgcolor: 'linear-gradient(90deg, #e0e7ff 60%, #f3e8ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Диалоги</Typography>
            <Button variant="contained" size="small" sx={{ borderRadius: 2, fontWeight: 600, background: 'linear-gradient(90deg, #1976d2 60%, #7c3aed 100%)', color: '#fff', textTransform: 'none', ml: 2, minWidth: 0, px: 2, py: 0.5 }} onClick={() => setOpenNewDialog(true)}>
              +
            </Button>
          </Box>
          <List sx={{ p: 0 }}>
            {dialogs.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', p: 3 }}>Нет диалогов</Typography>
            )}
            {dialogs.map(dialog => {
              const lastMsg = dialog.messages[dialog.messages.length-1];
              const isUnread = lastMsg.recipient?._id === user._id && !lastMsg.read;
              return (
                <ListItem
                  key={dialog.user._id}
                  button
                  selected={selectedDialog === dialog.user._id}
                  onClick={() => setSelectedDialog(dialog.user._id)}
                  sx={{
                    borderLeft: selectedDialog === dialog.user._id ? '4px solid #7c3aed' : '4px solid transparent',
                    bgcolor: selectedDialog === dialog.user._id ? '#f3e8ff' : 'inherit',
                    transition: 'background 0.2s'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={dialog.user.avatar || ''} sx={{ bgcolor: '#7c3aed' }}>
                      {dialog.user.name?.[0] || <PersonIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 600 }}>{dialog.user.name}</Typography>}
                    secondary={<Typography variant="body2" color="text.secondary" noWrap>{lastMsg.content?.slice(0, 32) || 'Без сообщения'}</Typography>}
                  />
                  {isUnread && <Box sx={{ width: 10, height: 10, bgcolor: '#7c3aed', borderRadius: '50%', ml: 1 }} />}
                </ListItem>
              );
            })}
          </List>
        </Box>
        {/* Main chat area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb', bgcolor: 'linear-gradient(90deg, #e0e7ff 60%, #f3e8ff 100%)', display: 'flex', alignItems: 'center', minHeight: 72 }}>
            {selectedDialogObj ? (
              <>
                <Avatar src={selectedDialogObj.user.avatar || ''} sx={{ bgcolor: '#7c3aed', mr: 2 }}>
                  {selectedDialogObj.user.name?.[0] || <PersonIcon />}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedDialogObj.user.name}</Typography>
              </>
            ) : (
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>Выберите диалог</Typography>
            )}
          </Box>
          {/* Chat messages */}
          <Box ref={messagesBoxRef} sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 500 }}>
            {selectedDialogObj ? (
              selectedDialogObj.messages.map(msg => {
                const isMe = msg.sender?._id === user._id;
                return (
                  <Box key={msg._id} sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 2 }}>
                    <Avatar src={isMe ? user.avatar : selectedDialogObj.user.avatar || ''} sx={{ bgcolor: isMe ? '#1976d2' : '#7c3aed', width: 36, height: 36 }}>
                      {(isMe ? user.name : selectedDialogObj.user.name)?.[0] || <PersonIcon />}
                    </Avatar>
                    <Box sx={{ maxWidth: 400, bgcolor: isMe ? 'linear-gradient(90deg, #e0e7ff 60%, #f3e8ff 100%)' : '#fff', borderRadius: 3, boxShadow: 1, p: 2, minWidth: 60 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: isMe ? '#7c3aed' : 'text.primary' }}>{msg.content}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <Typography variant="body1" color="text.secondary">Выберите диалог для начала общения</Typography>
              </Box>
            )}
          </Box>
          {/* Input */}
          {selectedDialogObj && (
            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #e5e7eb', bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                size="small"
                sx={{ borderRadius: 3, bgcolor: '#f8fafc' }}
                disabled={sending}
              />
              <IconButton type="submit" color="primary" disabled={!newMessage.trim() || sending} sx={{ borderRadius: 2, bgcolor: 'linear-gradient(90deg, #e0e7ff 60%, #f3e8ff 100%)', boxShadow: 2, ':hover': { bgcolor: 'linear-gradient(90deg, #1565c0 60%, #6d28d9 100%)' } }}>
                <SendIcon sx={{ color: '#1976d2' }} />
              </IconButton>
            </Box>
          )}
        </Box>
      </Paper>
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      )}
      {/* Модалка выбора собеседника */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Новый диалог</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Выберите собеседника"
            value={selectedRecipient}
            onChange={e => setSelectedRecipient(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {recipients.map(r => (
              <MenuItem key={r._id} value={r._id}>{r.name} ({r.email})</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDialog(false)}>Отмена</Button>
          <Button
            onClick={() => {
              if (!selectedRecipient) return;
              const existingDialog = dialogs.find(d => d.user._id === selectedRecipient);
              setSelectedDialog(selectedRecipient);
              setOpenNewDialog(false);
            }}
            disabled={!selectedRecipient}
            variant="contained"
          >
            Открыть диалог
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Messages; 