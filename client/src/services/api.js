import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL
});

// Добавление токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Отправляем запрос:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    console.log('Токен:', token ? 'Присутствует' : 'Отсутствует');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Ошибка при отправке запроса:', error);
    return Promise.reject(error);
  }
);

// Обработка ошибок
api.interceptors.response.use(
  (response) => {
    console.log('Получен ответ:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Ошибка при получении ответа:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function handleApiError(error) {
  if (error.response && error.response.data && error.response.data.message) {
    return new Error(error.response.data.message);
  }
  return new Error(error.message || 'Произошла ошибка при обращении к API');
}

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me')
};

export const messagesAPI = {
  sendMessage: (data) => api.post('/messages', data),
  getMessages: () => api.get('/messages'),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`)
};

export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => {
    const config = {
      headers: {
        'Content-Type': courseData instanceof FormData ? 'multipart/form-data' : 'application/json'
      }
    };
    return api.put(`/courses/${id}`, courseData, config);
  },
  delete: (id) => api.delete(`/courses/${id}`),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  addReview: (id, reviewData) => api.post(`/courses/${id}/reviews`, reviewData),
  getEnrolledCourses: () => api.get('/courses/enrolled'),
  getTeacherCourses: () => api.get('/courses/my/created'),
  getStudentProgress: async (studentId, courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/progress/${studentId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  getCourseProgress: async (courseId, studentId) => {
    try {
      const response = await api.get(`/courses/${courseId}/progress/${studentId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  updateLessonProgress: async (courseId, lessonId, progress) => {
    try {
      const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/progress`, { progress });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  updateProgress: async (courseId, progressData) => {
    try {
      const response = await api.put(`/courses/${courseId}/progress`, progressData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  leaveCourse: (courseId) => {
    return api.post(`/courses/${courseId}/leave`);
  }
};

export const lessonsAPI = {
  getByCourse: (courseId) => api.get(`/lessons/course/${courseId}`),
  getById: (id) => api.get(`/lessons/${id}`),
  create: (lessonData) => api.post('/lessons', lessonData),
  update: (id, lessonData) => api.put(`/lessons/${id}`, lessonData),
  delete: (id) => api.delete(`/lessons/${id}`),
  complete: (id) => api.post(`/lessons/${id}/complete`)
};

export const quizAPI = {
  getQuiz: async (id) => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  submitQuiz: async (id, answers) => {
    const response = await api.post(`/quizzes/${id}/submit`, { answers });
    return response.data;
  }
};

export default api; 