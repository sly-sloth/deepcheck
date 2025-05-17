import './App.css';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import CreateExam, { TeacherExamPage } from './components/CreateExam';
import { Homepage } from './components/ExamHome';
import TeacherExamList from './components/TeacherExamList';
import StudentLanding from './components/StudentLanding';
import StudentExamList from './components/StudentExamList';
import StudentExamWindow from './components/StudentExamWindow';
import StudentExamResult from './components/StudentExamResult';
import StudentExamLoading from './components/StudentExamLoading';
import Login from './components/Login';
import Signup from './components/Signup';
import ViewExam from './components/ViewExam';
import StudentExamHistory from './components/StudentExamHistory';
import Profile from './components/Profile';
import TeacherDashboard from './components/TeacherDashboard';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminExams from './components/AdminExams';
import AdminAttempts from './components/AdminAttempts';
import AdminPanel from './components/AdminPanel';
import 'bootstrap/dist/css/bootstrap.css';

function EditExamWrapper() {
  const { examId } = useParams();
  return <CreateExam mode="edit" examId={examId} />;
}

function App() {
  return (
    <Router>
      <NavBar />
      <div className="container mt-3">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Homepage />} />
          <Route path="/create-exam" element={<TeacherExamPage />} />
          <Route path="/edit-exam/:examId" element={<EditExamWrapper />} />
          <Route path="/view-exam/:examId" element={<ViewExam />} />
          <Route path="/teacher/exams" element={<TeacherExamList />} />
          <Route path="/student" element={<StudentLanding />} />
          <Route path="/student/exams" element={<StudentExamList />} />
          <Route path="/student/exam/:examId" element={<StudentExamWindow />} />
          <Route path="/student/exam/:examId/loading" element={<StudentExamLoading />} />
          <Route path="/student/exam/:examId/result" element={<StudentExamResult />} />
          <Route path="/student/history" element={<StudentExamHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/exams" element={<AdminExams />} />
          <Route path="/admin/attempts" element={<AdminAttempts />} />
          <Route path="/admin/dashboard/users" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
