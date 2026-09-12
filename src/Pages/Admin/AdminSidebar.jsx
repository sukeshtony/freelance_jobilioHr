import { NavLink } from "react-router-dom";
import { FaUser, FaBriefcase, FaChalkboardTeacher, FaTasks, FaGraduationCap } from "react-icons/fa";

const AdminSidebar = () => (
  <div className="bg-dark text-white vh-100 p-3" style={{ width: '250px', position: 'fixed' }}>
    <h5 className="text-center mb-4">Admin Panel</h5>
    <ul className="nav flex-column gap-3">
      <li><NavLink className="nav-link text-white" to="/admin/candidates"><FaUser className="me-2" />Candidates</NavLink></li>
      <li><NavLink className="nav-link text-white" to="/admin/interviews"><FaBriefcase className="me-2" />Interviews</NavLink></li>
      <li><NavLink className="nav-link text-white" to="/admin/courses"><FaChalkboardTeacher className="me-2" />Courses</NavLink></li>
      <li><NavLink className="nav-link text-white" to="/admin/interviewers"><FaTasks className="me-2" />Interviewers</NavLink></li>
      <li><NavLink className="nav-link text-white" to="/admin/exams"><FaGraduationCap className="me-2" />Exams</NavLink></li>
    </ul>
  </div>
);

export default AdminSidebar;