import React from 'react';
import './App.css';
import './responsive.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import OAuthCallback from './components/OAuthCallback';
import Terms from './Pages/Terms';
import Privacy from './Pages/Privacy';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';


// Candidates Routes
import Home from './components/Home';
import CommonLogin from './components/CommonLogin';
import CandidateLogin from './Pages/Candidate/Authentication/CandidateLogin';
import CandidateRegister from './Pages/Candidate/Authentication/CandidateRegister';
import CandidateDashboard from './Pages/Candidate/Dashboard/CandidateDashboard';
import CareerDashboard from './Pages/Candidate/Dashboard/CareerDashboard';
import InterviewBooking from './Pages/Candidate/Interviews/InterviewBooking';
import UpdateProfileForm from './components/UpdateProfile';
import UpdateProfileAi from './components/UpdateProfileAi';
import ProfilePage from "./components/ProfilePage";
import ChangePassword from './components/ChangePassword';
import ExamBookingPage from './Pages/Candidate/Exams/ExamBookingPage';
import ExamDetails from './Pages/Candidate/Exams/ExamDetails';
import StartExam from './Pages/Candidate/Exams/StartExam';
import GenerateResume from './Pages/Candidate/GenerateResume';
import InterviewDetails from './Pages/Candidate/Interviews/InterviewDetails';
import CoursesPage from './Pages/Candidate/Courses/CareerCertificate';
import EnrollNow from './Pages/Candidate/Courses/EnrollNow';
import MyCourses from './Pages/Candidate/Courses/MyCourses';
import Certificate from './Pages/Candidate/Courses/Certificate';
import CampusJobDrives from './Pages/Candidate/Jobs/CampusJobDrives';
import JobDetailsPage from './Pages/Candidate/Jobs/JobDetailsPage';

// Home
import HowItWorks from './components/HowItWorks';


// Client Routes
import ClientRegister from './Pages/Client/ClientRegister';
import ClientLogin from './Pages/Client/ClientLogin';
import NaukriClientPortal from './Pages/Client/NaukriClientPortal';
import RequestCredits from './Pages/Client/RequestCredits';
import Dashboard from './Pages/Client/Dashboard';
import CandidateResume from './Pages/Client/CandidateResume';
import PostJob from './Pages/Client/PostJob';
import ManageJobs from './Pages/Client/ManageJobs';
import Responses from './Pages/Client/Responses';
import AllJobs from './Pages/Client/AllJobs';
import AdminClients from './Pages/Admin/AdminClient';
import CompanyDetailsForm from './Pages/Client/CompanyDetailsForm';
import MyRequirements from './Pages/Client/MyRequirements';
import SentCandidates from './Pages/Client/SentCandidates';
import ClientCandidates from './Pages/Client/Candidates';

// Admin Pages
import AdminDashboard from './Pages/Admin/AdminDashboard';
import Candidates from './Pages/Admin/Candidates';
import Interviews from './Pages/Admin/Interviews';
import Courses from './Pages/Admin/Courses';
import Exams from './Pages/Admin/Exams';
import CourseDetails from './Pages/Admin/CourseDetails';
import CourseTest from './Pages/Admin/CourseTest';
import CandidateProfile from './Pages/Admin/CandidateProfile';
import Interviewers from './Pages/Admin/Interviewers';
import CourseStudents from './Pages/Admin/CourseStudents';
import AdminAllJobs from './Pages/Admin/AllJobs';
import JobApplications from './Pages/Admin/JobApplications';
import AdminInstructor from './Pages/Admin/Instructor';
import PendingFeedback from './Pages/Admin/FeedbackPending';
import Details from './Pages/Admin/Details';
import Feedbacker from './Pages/Admin/Feedbacker';
import CreditRequests from './Pages/Admin/CreditRequests';
import UserCredits from './Pages/Admin/UserCredits';
import Requirements from './Pages/Admin/Requirements';
import AdminProfileUpdate from "./Pages/Admin/AdminProfile";


import ForgotPassword from './Pages/Client/ForgotPassword';
import CandidateForgotPassword from './Pages/Candidate/Authentication/CandidateForgotPassword';
import AdminContactUs from './Pages/Admin/ContactUs';

// Interviewer
import InterviewerDashboard from './Pages/Interviewer/InterviewerDashboard';
import ScheduledInterviews from './Pages/Interviewer/Interviews';
import InterviewerProfile from './Pages/Interviewer/InterviewerProfile';

// Instructor
import InstructorDashboard from './Pages/Instructor/InstructorDashboard';
import InstructorCourses from './Pages/Instructor/Courses';
import InstructorCourseDetails from './Pages/Instructor/CourseDetails';
import InstructorProfile from './Pages/Instructor/InstructorProfile';
import InstructorCourseTest from './Pages/Instructor/CourseTest';
import InstructorCourseStudents from './Pages/Instructor/CourseStudents';

// Feedbacker
import FeedbackerDashboard from './Pages/Feedbacker/FeedbackerDashboard';
import ScheduledFeedback from './Pages/Feedbacker/ScheduledFeedback';
import FeedbackerProfile from './Pages/Feedbacker/FeedbackerProfile';
import StudentDetails from './Pages/Feedbacker/Details';


function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/Bingus" element={<CommonLogin />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/candidate/login" element={<CandidateLogin />} />
        <Route path="/candidate/register" element={<CandidateRegister />} />
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/register" element={<ClientRegister />} />
        <Route path="/client/company-details" element={<CompanyDetailsForm />} />


        {/* home */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/candidate/forgot-password" element={<CandidateForgotPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
                 <Route path="/about" element={<AboutUs />} />
         <Route path="/contact" element={<ContactUs />} />
         <Route path="/candidate-profile/:id" element={<CandidateProfile />} />

        {/* candidate */}

        <Route path="/sent-candidates" element={<SentCandidates />} />


        {/* Candidate Protected Routes */}
        <Route path="/dashboard/candidate" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <CandidateDashboard />
          </ProtectedRoute>
        } />
        <Route path="/career-dashboard" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <CareerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/interview-booking" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <InterviewBooking />
          </ProtectedRoute>
        } />
        <Route path="/update-profile" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <UpdateProfileForm />
          </ProtectedRoute>
        } />
        <Route path="/update-profile-ai" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <UpdateProfileAi />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/change-password" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <ChangePassword />
          </ProtectedRoute>
        } />
        <Route path="/exam-booking" element={
          <ProtectedRoute allowedRoles={['Candidate','instructor']}>
            <ExamBookingPage />
          </ProtectedRoute>
        } />
        <Route path="/exam-details/:id" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <ExamDetails />
          </ProtectedRoute>
        } />
        <Route path="/start-exam/:bookingId" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <StartExam />
          </ProtectedRoute>
        } />
        <Route path="/resume-builder" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <GenerateResume />
          </ProtectedRoute>
        } />
        <Route path="/interview-details/:interviewId" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <InterviewDetails />
          </ProtectedRoute>
        } />
        <Route path="/career-certificate" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <CoursesPage />
          </ProtectedRoute>
        } />
        <Route path="/enroll/:id" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <EnrollNow />
          </ProtectedRoute>
        } />
        <Route path="/my-courses" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <MyCourses />
          </ProtectedRoute>
        } />
        <Route path="/certificate" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <Certificate />
          </ProtectedRoute>
        } />
        <Route path="/campus-job-drives" element={
          <ProtectedRoute allowedRoles={['Candidate']}>
            <CampusJobDrives />
          </ProtectedRoute>
        } />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />


        {/* Client Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/naukri-client-portal" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <NaukriClientPortal />
          </ProtectedRoute>
        } />
        <Route path="/post-job" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <PostJob />
          </ProtectedRoute>
        } />
        <Route path="/manage-jobs" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <ManageJobs />
          </ProtectedRoute>
        } />
        <Route path="/responses/:jobId" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <Responses />
          </ProtectedRoute>
        } />
        <Route path="/request-credits" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <RequestCredits />
          </ProtectedRoute>
        } />

        <Route path="/CandidateResume/:id" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <CandidateResume />
          </ProtectedRoute>
        } />

        <Route path="/Candidates" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <ClientCandidates />
          </ProtectedRoute>
        } />


        <Route path="/my-requirements" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <MyRequirements />
          </ProtectedRoute>
        } />
        <Route path="all-jobs" element={<AllJobs />} />


        {/* Interviewer Protected Routes */}
        <Route path="/interviewer" element={
          <ProtectedRoute allowedRoles={['interviewer']}>
            <InterviewerDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="interviews" replace />} />
          <Route path="interviews" element={<ScheduledInterviews />} />
          <Route path="profile/:id" element={<InterviewerProfile />} />
        </Route>

        {/* Instructor Protected Routes */}
        <Route path="/instructor" element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="Courses" replace />} />
          <Route path="Courses" element={<InstructorCourses />} />
          <Route path="profile/:id" element={<InstructorProfile />} />
          <Route path="details/:id" element={<InstructorCourseDetails />} />
          <Route path="details/:id/test" element={<InstructorCourseTest />} />
          <Route path="details/:id/students" element={<InstructorCourseStudents />} />
        </Route>

        {/* Feedbacker Protected Routes */}
        <Route path="/feedbacker" element={
          <ProtectedRoute allowedRoles={['feedbacker']}>
            <FeedbackerDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="scheduled" replace />} />
          <Route path="scheduled" element={<ScheduledFeedback />} />
          <Route path="details/:id" element={<StudentDetails />} />
          <Route path="profile/:id" element={<FeedbackerProfile />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="candidates" />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="courses" element={<Courses />} />
          <Route path="exams" element={<Exams />} />
          <Route path="courses/:id" element={<CourseDetails />} />
          <Route path="courses/:id/test" element={<CourseTest />} />
          <Route path="/admin/candidates/:id" element={<CandidateProfile />} />
          <Route path="interviewers" element={<Interviewers />} />
          <Route path="/admin/courses/:courseId/students" element={<CourseStudents />} />
          <Route path="/admin/jobs" element={<AdminAllJobs />} />
          <Route path="/admin/jobs/applications/:jobId" element={<JobApplications />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="Instructors" element={<AdminInstructor />} />
          <Route path="Conducted-Candidates" element={<PendingFeedback />} />
          <Route path="/admin/details/:id" element={<Details />} />
          <Route path="/admin/contactus" element={<AdminContactUs />} />
          <Route path="/admin/profile" element={<AdminProfileUpdate />} />
          <Route path="/admin/credit-requests" element={<CreditRequests />} />
          <Route path="Feedback_Providers" element={<Feedbacker />} />
          <Route path="/admin/user-credits" element={<UserCredits />} />
          <Route path="/admin/requirements" element={<Requirements />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
