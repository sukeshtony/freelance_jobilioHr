import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaHome } from 'react-icons/fa';
import API, { API_BASE_URL } from "../../../api";
import {
    FiArrowLeft,
    FiDownload,
    FiUser,
    FiMail,
    FiCalendar,
    FiBriefcase,
    FiDollarSign,
    FiMapPin,
    FiFileText,
} from "react-icons/fi";

const JobApplicationDetails = () => {
    const { id } = useParams();
    const [application, setApplication] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchApp = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await API.get(`/api/jobs/job-applications/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApplication(res.data.application);
            } catch (err) {
                console.error("Failed to fetch application:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApp();
    }, [id]);

    if (isLoading) {
        return (
            <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3">Loading application details...</p>
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger text-center">
                    Failed to load application details.
                </div>
                <div className="text-center">
                    <Link to="/career-dashboard" className="btn btn-outline-secondary">
                        <FiArrowLeft className="me-2" /> Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const { job, resume, appliedAt, userName, email } = application;

    return (
        <div className="container my-5">
            <div className="d-flex justify-content-end mb-3">
                <Link to="/career-dashboard" className="btn btn-primary rounded-pill px-3 px-md-4 d-flex align-items-center">
                    <FaHome className="me-1" />
                    <span className="d-none d-sm-inline">Dashboard</span>
                    <span className="d-inline d-sm-none">Home</span>
                </Link>
            </div>

            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-1">Application Details</h4>
                    <small>Candidate: {userName}</small>
                </div>

                <div className="card-body">
                    <div className="row gx-4">
                        <div className="col-md-6 mb-4">
                            <h5><FiUser className="me-2 text-primary" /> Candidate Info</h5>
                            <ul className="list-unstyled mt-3">
                                <li><strong>Name:</strong> {userName}</li>
                                <li><strong>Email:</strong> <a href={`mailto:${email}`}>{email}</a></li>
                                <li><strong>Applied On:</strong> <FiCalendar className="ms-2 text-secondary" />{" "}
                                    {new Date(appliedAt).toLocaleString()}</li>
                            </ul>
                        </div>

                        <div className="col-md-6 mb-4">
                            <h5><FiBriefcase className="me-2 text-primary" /> Job Info</h5>
                            <ul className="list-unstyled mt-3">
                                <li><strong>Title:</strong> {job.jobTitle}</li>
                                <li><strong>Company:</strong> {job.companyName}</li>
                                <li><strong>Location:</strong> <FiMapPin className="ms-2 text-secondary" /> {job.location}</li>
                                <li><strong>Salary:</strong> <FiDollarSign className="ms-2 text-secondary" /> {job.salary || 'Not specified'}</li>
                                <li><strong>Type:</strong> {job.jobType}</li>
                            </ul>
                        </div>
                    </div>

                    <hr />

                    <h5><FiFileText className="me-2 text-secondary" /> Resume</h5>

                    {resume ? (
                        <>
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mt-3">
                                <div>
                                    <p className="mb-1"><strong>{resume.originalName}</strong></p>
                                    <p className="text-muted">{resume.mimetype} • {(resume.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <div>
                                    <a
                                        href={`${API_BASE_URL}/api/jobs/resumes/${resume.filename}`}
                                        className="btn btn-success"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <FiDownload className="me-2" /> Download
                                    </a>
                                </div>
                            </div>

                            {resume.mimetype === "application/pdf" && (
                                <div className="mt-4">
                                    <object
                                        data={`${API_BASE_URL}/api/jobs/resumes/${resume.filename}`}
                                        type="application/pdf"
                                        width="100%"
                                        height="600px"
                                    >                                        <p>
                                            Your browser does not support viewing PDFs. You can{" "}
                                            <a href={`${API_BASE_URL}/api/jobs/resumes/${resume.filename}`} target="_blank" rel="noopener noreferrer">
                                                download the resume here
                                            </a>.
                                        </p>
                                    </object>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="alert alert-warning mt-3">
                            No resume uploaded by the candidate.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobApplicationDetails;