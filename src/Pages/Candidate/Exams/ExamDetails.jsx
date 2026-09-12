import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaHome } from 'react-icons/fa';
import API from "../../../api";
import { requireLogin } from '../../../utils/requireLogin';
import { requirePremium } from '../../../utils/requirePremium';

const ExamDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [booking, setBooking] = useState(null);
    const [isStartEnabled, setIsStartEnabled] = useState(false);
    const [timeMessage, setTimeMessage] = useState("Checking exam time...");

    // Auth guard - check login first, then premium access
    useEffect(() => {
        (async () => {
            const isAuthenticated = await requireLogin(navigate);
            if (!isAuthenticated) return;
            
            const user = await requirePremium(navigate);
            if (!user) return;
            
            setIsAuthChecking(false);
        })();
    }, [navigate]);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get(`/api/exams/booking-details/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setBooking(res.data);
            } catch (err) {
                console.error("Failed to fetch booking:", err);
            }
        };

        fetchBooking();
    }, [id]);

    useEffect(() => {
        if (!booking) return;

        const parseAMPM = (timeStr) => {
            const [time, modifier] = timeStr.split(" ");
            if (!time || !modifier) return null;

            let [hours, minutes] = time.split(":").map(Number);
            if (modifier === "PM" && hours < 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;

            return [hours, minutes];
        };

        const checkTime = () => {
            try {
                const [hour, minute] = parseAMPM(booking.time) || [];
                const examDateTime = new Date(`${booking.date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);

                if (isNaN(examDateTime.getTime())) {
                    console.error("❌ Invalid exam date/time");
                    return;
                }

                const now = new Date();
                const examEndTime = new Date(examDateTime.getTime() + 45 * 60 * 1000);

                if (booking.status === "Passed" || booking.status === "Failed" || booking.status === 'Conducted') {
                    setIsStartEnabled(false);
                    setTimeMessage("✅ Exam already submitted");
                } else if (now >= examDateTime && now <= examEndTime) {
                    setIsStartEnabled(true);
                    setTimeMessage("You can start the exam now");
                } else if (now < examDateTime) {
                    setIsStartEnabled(false);
                    setTimeMessage("⏳ Exam not started yet");
                } else {
                    setIsStartEnabled(false);
                    setTimeMessage("⚠️ Exam time has passed");
                }
            } catch (error) {
                console.error("❌ Time check error:", error);
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 15000);
        return () => clearInterval(interval);
    }, [booking]);

    const handleStartExam = () => {
        if (booking.status === "Passed" || booking.status === "Failed") return;
        navigate(`/start-exam/${booking._id}`);
    };

    if (isAuthChecking || !booking) {
        return <div className="text-center py-5">{isAuthChecking ? "Checking access..." : "Loading..."}</div>;
    }

    return (
        <>
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1050 }}>
                <div className="container-fluid">
                    <Link to="/" className="navbar-brand d-flex align-items-center">
                        <img
                            src="/logo.jpeg"
                            alt="Company Logo"
                            style={{ height: "40px", marginRight: "10px" }}
                        />
                    </Link>
                    <div className="ms-auto">
                        <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
                            <FaHome className="me-1" />
                            <span className="d-none d-sm-inline">Dashboard</span>
                            <span className="d-inline d-sm-none">Home</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Exam Details */}
            <div className="container py-5">
                <div className="card shadow p-4">
                    <h4 className="mb-4">📋 Exam Details</h4>
                    <table className="table table-bordered">
                        <tbody>
                            <tr><th>Username</th><td>{booking.username}</td></tr>
                            <tr><th>Category</th><td>{booking.category}</td></tr>
                            <tr><th>Course</th><td>{booking.courseName}</td></tr>
                            <tr><th>Date</th><td>{booking.date}</td></tr>
                            <tr><th>Time</th><td>{booking.time}</td></tr>
                        </tbody>
                    </table>

                    {/* Result Badge */}
                    {(booking.status === "Passed" || booking.status === "Failed" || booking.status === "Missed") && (
                        <div
                            className="alert mt-4"
                            style={{
                                backgroundColor:
                                    booking.status === "Passed"
                                        ? "#d1e7dd"
                                        : booking.status === "Failed"
                                            ? "#f8d7da"
                                            : "#fff3cd",
                            }}
                        >
                            <h5
                                className={`fw-bold ${booking.status === "Passed"
                                    ? "text-success"
                                    : booking.status === "Failed"
                                        ? "text-danger"
                                        : "text-warning"
                                    }`}
                            >
                                {booking.status === "Passed"
                                    ? "✅ Passed"
                                    : booking.status === "Failed"
                                        ? "❌ Failed"
                                        : "⚠️ Missed"}
                            </h5>

                            {booking.status !== "Missed" ? (
                                <>
                                    <p className="mb-1">
                                        <strong>Score:</strong> {booking.score} / {booking.totalMarks}
                                    </p>
                                    <p className="mb-0">
                                        <strong>Status:</strong> {booking.status}
                                    </p>
                                </>
                            ) : (
                                <p className="mb-0">
                                    <strong>This exam was missed and cannot be taken now.</strong>
                                </p>
                            )}
                        </div>
                    )}


                    {/* Start Exam Button */}
                    <div className="text-end mt-3">
                        <p className="text-muted mb-2">{timeMessage}</p>
                        <button
                            className="btn btn-success"
                            onClick={handleStartExam}
                            disabled={!isStartEnabled || booking.status === "Passed" || booking.status === "Failed"}
                        >
                            Start Exam
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExamDetails;
