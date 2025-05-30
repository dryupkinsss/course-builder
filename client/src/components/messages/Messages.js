import React, { useState, useEffect } from 'react';
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
  Grid,
  IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { coursesAPI, messagesAPI } from '../../services/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    content: ''
  });
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchMessages();
    fetchStudents();
  }, []);

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

  const fetchStudents = async () => {
    try {
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
      setStudents(allStudents);
    } catch (err) {
      setError('Ошибка при загрузке списка студентов');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await messagesAPI.sendMessage(newMessage);
      setNewMessage({ recipient: '', subject: '', content: '' });
      fetchMessages();
    } catch (err) {
      setError('Ошибка при отправке сообщения');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messagesAPI.deleteMessage(messageId);
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (err) {
      setError('Ошибка при удалении сообщения');
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
      <Typography variant="h4" gutterBottom>
        Сообщения
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Форма отправки сообщения */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Отправить сообщение
            </Typography>
            <form onSubmit={handleSendMessage}>
              <TextField
                select
                fullWidth
                label="Получатель"
                value={newMessage.recipient}
                onChange={(e) => setNewMessage({ ...newMessage, recipient: e.target.value })}
                margin="normal"
                SelectProps={{
                  native: true
                }}
                sx={{ mb: 2 }}
                InputLabelProps={{
                  shrink: true,
                  sx: { backgroundColor: 'white', px: 1 }
                }}
              >
                <option value="">Выберите студента</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Тема"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Сообщение"
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                margin="normal"
                multiline
                rows={4}
              />
              <Button
                type="submit"
                variant="contained"
                endIcon={<SendIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                Отправить
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Список сообщений */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              История сообщений
            </Typography>
            <List>
              {messages.map((message) => (
                <React.Fragment key={message._id}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteMessage(message._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={message.subject}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {message.recipient.name}
                          </Typography>
                          {` — ${message.content}`}
                          <br />
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            {new Date(message.createdAt).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Messages; 