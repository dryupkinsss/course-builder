import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import store from './store';
import { authAPI } from './services/api';
import { loginSuccess, setUserDataLoaded } from './store/slices/authSlice';

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
import Certificates from './components/certificates/Certificates';
import Footer from './components/layout/Footer';
import TeacherCoursesList from './components/dashboard/TeacherCoursesList';
import StudentCoursesList from './components/dashboard/StudentCoursesList';
import About from './components/pages/About';

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
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          store.dispatch(loginSuccess({
            user: response.data,
            token
          }));
        } catch (error) {
          console.error('Ошибка при получении данных пользователя:', error);
          localStorage.removeItem('token');
          store.dispatch(setUserDataLoaded(true));
        }
      } else {
        store.dispatch(setUserDataLoaded(true));
      }
    };

    initializeApp();
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
              <Route path="/dashboard/teacher" element={<TeacherCoursesList />} />
              <Route path="/dashboard/courses" element={<StudentCoursesList />} />
              <Route path="/students" element={<Students />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/quiz/:id" element={<QuizComponent />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/about" element={<About />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
