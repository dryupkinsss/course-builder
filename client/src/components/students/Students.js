import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { coursesAPI } from '../../services/api';

const Students = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [studentProgress, setStudentProgress] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await coursesAPI.getTeacherCourses();
      const formattedCourses = response.data.map(course => ({
        ...course,
        enrolledStudents: course.enrolledStudents.map(student => ({
          ...student,
          enrolledAt: student.enrolledAt || new Date().toISOString(),
          courseTitle: course.title
        }))
      }));
      setCourses(formattedCourses);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      setLoading(false);
    }
  };

  const fetchStudentProgress = async (studentId, courseId) => {
    try {
      const response = await coursesAPI.getStudentProgress(studentId, courseId);
      setStudentProgress(response.data);
    } catch (err) {
      setError('Ошибка при загрузке прогресса студента');
    }
  };

  const openProgressDialog = async (student) => {
    setSelectedStudent(student);
    setProgressDialogOpen(true);
    await fetchStudentProgress(student._id, student.courseId);
  };

  const filteredCourses = courses.filter(course => {
    const courseTitle = course.title.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    if (courseTitle.includes(searchLower)) return true;
    
    if (Array.isArray(course.enrolledStudents)) {
      return course.enrolledStudents.some(student => 
        student.name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  });

  // Проверяем, есть ли вообще студенты на всех курсах
  const totalStudents = courses.reduce((acc, course) => acc + (Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0), 0);

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
        Управление студентами
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Поиск по курсам и студентам..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Если нет ни одного студента вообще */}
      {totalStudents === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          На ваших курсах не обучается ни одного студента
        </Alert>
      )}

      {filteredCourses.map((course) => (
        <Paper key={course._id} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Записи на курс "{course.title}"
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Имя</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Дата записи</TableCell>
                  <TableCell>Прогресс</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(course.enrolledStudents) && course.enrolledStudents.length > 0 ? (
                  course.enrolledStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <Typography variant="body1">
                          {student.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        {new Date(student.enrolledAt || Date.now()).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={student.progress || 0} 
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                          <Typography variant="body2" color="text.secondary" align="right">
                            {student.progress || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Нет записанных студентов
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}

      {/* Диалог с детальным прогрессом */}
      <Dialog 
        open={progressDialogOpen} 
        onClose={() => setProgressDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Прогресс студента {selectedStudent?.name}
        </DialogTitle>
        <DialogContent>
          {studentProgress ? (
            <List>
              {studentProgress.lessons.map((lesson, index) => (
                <React.Fragment key={lesson._id}>
                  <ListItem>
                    <ListItemText
                      primary={`Урок ${index + 1}: ${lesson.title}`}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={lesson.progress} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Прогресс: {lesson.progress}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Последний доступ: {new Date(lesson.lastAccessed).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < studentProgress.lessons.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Students; 