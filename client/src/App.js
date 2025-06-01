import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import store from './store';
import { authAPI } from './services/api';
import { loginSuccess } from './store/slices/authSlice';

// Компоненты
import Navbar from './components/layout/Navbar';
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CourseList from './components/courses/CourseList';
import CourseDetail from './components/courses/CourseDetail';
import CourseCreate from './components/courses/CourseCreate';
import LessonDetail from './components/lessons/LessonDetail';
import LessonCreate from './components/lessons/LessonCreate';
import Dashboard from './components/dashboard/Dashboard';
import CourseEdit from './components/courses/CourseEdit';
import Students from './components/students/Students';
import Messages from './components/messages/Messages';
import QuizComponent from './components/quiz/QuizComponent';

// Создание темы
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrentUser()
        .then(response => {
          store.dispatch(loginSuccess({
            user: response.data,
            token
          }));
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/courses" element={<CourseList />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/courses/create" element={<CourseCreate />} />
              <Route path="/courses/:id/edit" element={<CourseEdit />} />
              <Route path="/courses/:courseId/lessons/create" element={<LessonCreate />} />
              <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/quiz/:id" element={<QuizComponent />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
