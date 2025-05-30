import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Функция для группировки уроков и тестов по модулям
const groupLessonsAndQuizzesByModule = (lessons, quizzes) => {
  const modules = [];
  const maxOrder = Math.max(
    ...lessons.map(l => l.order || 0),
    ...quizzes.map(q => q.order || 0)
  );
  for (let i = 1; i <= maxOrder; i++) {
    const moduleLessons = lessons.filter(l => l.order === i);
    const moduleQuizzes = quizzes.filter(q => q.order === i);
    if (moduleLessons.length > 0 || moduleQuizzes.length > 0) {
      modules.push({
        title: `Модуль ${i}`,
        lessons: moduleLessons,
        quizzes: moduleQuizzes
      });
    }
  }
  return modules;
};

const CourseView = () => {
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    if (course && course.lessons && course.quizzes) {
      const groupedModules = groupLessonsAndQuizzesByModule(course.lessons, course.quizzes);
      setModules(groupedModules);
    }
  }, [course]);

  return (
    <div>
      {modules.map((module, idx) => (
        <Box key={idx} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {module.title}
          </Typography>
          {module.lessons.map((lesson, lessonIdx) => (
            <Paper key={lessonIdx} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">{lesson.title}</Typography>
              <Typography variant="body2">{lesson.description}</Typography>
              {lesson.video && (
                <Box sx={{ mt: 2 }}>
                  <video controls width="100%">
                    <source src={lesson.video} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </Box>
              )}
            </Paper>
          ))}
          {module.quizzes.map((quiz, quizIdx) => (
            <Paper key={quizIdx} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">{quiz.title}</Typography>
              <Typography variant="body2">{quiz.description}</Typography>
              {/* Здесь можно добавить логику для отображения вопросов теста */}
            </Paper>
          ))}
        </Box>
      ))}
    </div>
  );
};

export default CourseView; 