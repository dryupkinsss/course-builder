import React from 'react';
import { useSelector } from 'react-redux';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />;
};

export default Dashboard; 