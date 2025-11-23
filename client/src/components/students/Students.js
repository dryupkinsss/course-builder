import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  InputAdornment,
  Avatar,
  Grid,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  MenuItem,
  Tooltip,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Delete as DeleteIcon, Person as PersonIcon, Quiz as QuizIcon } from '@mui/icons-material';
import { coursesAPI } from '../../services/api';

const Students = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await coursesAPI.getTeacherCourses();
      setCourses(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      setLoading(false);
    }
  };

  // Подгрузка прогресса для каждого студента по каждому курсу
  useEffect(() => {
    const loadProgress = async () => {
      if (!courses.length) return;
      setProgressLoading(true);
      const updatedCourses = await Promise.all(
        courses.map(async (course) => {
          if (!Array.isArray(course.enrolledStudents)) return course;
          const updatedStudents = await Promise.all(
            course.enrolledStudents.map(async (student) => {
              try {
                const progressData = await coursesAPI.getStudentProgress(student._id, course._id);
                return { 
                  ...student, 
                  progress: progressData?.totalProgress ?? 0,
                  quizzes: progressData?.quizzes || []
                };
              } catch {
                return { ...student, progress: 0, quizzes: [] };
              }
            })
          );
          return { ...course, enrolledStudents: updatedStudents };
        })
      );
      setCourses(updatedCourses);
      setProgressLoading(false);
    };
    loadProgress();
    // eslint-disable-next-line
  }, [courses.length]);

  // Собираем студентов с их курсами и тестами
  const students = useMemo(() => {
    const map = {};
    courses.forEach(course => {
      (course.enrolledStudents || []).forEach(student => {
        if (!map[student._id]) {
          map[student._id] = {
            ...student,
            courses: []
          };
        }
        
        map[student._id].courses.push({
          courseId: course._id,
          title: course.title,
          progress: student.progress || 0,
          enrolledAt: student.enrolledAt || new Date().toISOString(),
          quizzes: student.quizzes || []
        });
      });
    });
    return Object.values(map);
  }, [courses]);

  // Фильтрация и поиск
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.courses.some(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCourse = filterCourse ? student.courses.some(c => c.courseId === filterCourse) : true;
      return matchesSearch && matchesCourse;
    });
  }, [students, searchTerm, filterCourse]);

  if (loading || progressLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
        Студенты ваших курсов
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          variant="outlined"
          placeholder="Поиск по студентам или курсам..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <TextField
          select
          label="Курс"
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Все курсы</MenuItem>
          {courses.map(course => (
            <MenuItem key={course._id} value={course._id}>{course.title}</MenuItem>
          ))}
        </TextField>
      </Box>
      {filteredStudents.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Нет студентов, соответствующих фильтру
        </Alert>
      )}
      <Grid container spacing={3}>
        {filteredStudents.map(student => (
          <Grid item xs={12} sm={6} md={4} key={student._id}>
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 4, bgcolor: '#fff', display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#7c3aed', width: 56, height: 56, fontSize: 28 }}>
                  {student.name?.[0] || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{student.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{student.email}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {student.courses.map(course => (
                  <Paper key={course.courseId} sx={{ p: 2, mb: 1, bgcolor: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)', borderRadius: 3, boxShadow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={course.title} color="primary" size="small" sx={{ fontWeight: 600, bgcolor: '#7c3aed', color: '#fff' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        Записан: {new Date(course.enrolledAt).toLocaleDateString('ru-RU')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LinearProgress variant="determinate" value={course.progress || 0} sx={{ height: 8, borderRadius: 4, flex: 1, bgcolor: '#e0e7ff' }} />
                      <Typography variant="body2" sx={{ minWidth: 32, fontWeight: 600 }}>{course.progress || 0}%</Typography>
                    </Box>
                    {course.quizzes && course.quizzes.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                        {course.quizzes.map((quiz, idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <QuizIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {quiz.title}
                            </Typography>
                            {quiz.lastAttempt ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ 
                                  color: quiz.lastAttempt.passed ? '#2e7d32' : '#d32f2f',
                                  fontWeight: 600 
                                }}>
                                  {quiz.lastAttempt.score}/{quiz.lastAttempt.maxScore}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({quiz.attempts.length} попытка)
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Не пройден
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Tooltip title="Удалить">
                  <IconButton color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Students; 