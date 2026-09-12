import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, Badge, Button, Spinner, Alert,
  Modal, Form, Navbar, Nav, Toast
} from 'react-bootstrap';
import {
  Briefcase, GeoAlt, CashStack, Building, Calendar, X, Check2, Person, Envelope, FileEarmark, Share
} from 'react-bootstrap-icons';
import DOMPurify from 'dompurify';
import API, { API_BASE_URL } from '../../../api';
import requireLogin from '../../../utils/requireLogin';

const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
};

const SiteHeader = ({ onDashboard }) => (
  <Navbar bg="white" expand="md" className="shadow-sm border-bottom" style={{ zIndex: 1100 }}>
    <Container fluid className="px-4">
      <Navbar.Brand as={Link} to="/">
        <img src="/logo.jpeg" alt="Logo" style={{ height: 36 }} />
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        <Nav className="align-items-center">
          <Nav.Link as={Link} to="/career-dashboard" className="d-flex align-items-center">
            <i className="bi bi-house-door-fill me-2" /> Dashboard
          </Nav.Link>
          <Nav.Link as={Link} to="/campus-job-drives" className="d-flex align-items-center">Jobs</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

const SiteFooter = () => (
  <footer className="mt-5 bg-white border-top">
    <Container fluid className="py-4 px-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div className="text-muted small">&copy; {new Date().getFullYear()} JobilioHR — All rights reserved.</div>
        <div className="d-flex gap-3 mt-2 mt-md-0">
          <Link to="/terms" className="text-muted small">Terms</Link>
          <Link to="/privacy" className="text-muted small">Privacy</Link>
          <a href="mailto:support@example.com" className="text-muted small">Support</a>
        </div>
      </div>
    </Container>
  </footer>
);

const JobDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showModeModal, setShowModeModal] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploadingResume(true);
    setUploadProgress(0);
    setUploadStatus('Uploading resume...');

    const formData = new FormData();
    formData.append("resume", file);

    try {
      // Simulate progress stages
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      setUploadStatus('Uploading resume...');
      const res = await fetch(`${API_BASE_URL}/api/resume/parser`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(95);
      setUploadStatus('Processing resume with AI...');

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setUploadProgress(100);
      setUploadStatus('Resume processed successfully!');

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500));

      setShowModeModal(false);
      setIsUploadingResume(false);

      navigate("/update-profile-ai?mode=ai", {
        state: { parsedData: data, resumeFile: file }
      });

    } catch (err) {
      console.error("Resume upload failed", err);
      setUploadStatus('Upload failed. Please try again.');
      alert(`Resume upload failed: ${err.message}`);
      setIsUploadingResume(false);
      setUploadProgress(0);
    }
  };

  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!job);
  const [error, setError] = useState('');

  // Apply flow state (copied / recreated from CampusJobDrives)
  const [profileProgress, setProfileProgress] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState({ message: '', type: '' });
  const [applicationData, setApplicationData] = useState({
    userName: '',
    email: '',
    resume: null,
    coverLetter: ''
  });
  const [appliedExternalJobs, setAppliedExternalJobs] = useState([]);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setShowCopyToast(true);
      // auto-hide after 1.8s
      setTimeout(() => setShowCopyToast(false), 1800);
    } catch (e) {
      console.error('Failed to copy link', e);
      setApplicationMessage({ message: 'Failed to copy link to clipboard.', type: 'danger' });
    }
  };

  // ensure we have current user / token available same as CampusJobDrives
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
      setCurrentUser(raw ? JSON.parse(raw) : null);
    } catch (e) {
      console.warn('Failed to parse currentUser from localStorage', e);
      setCurrentUser(null);
    }
  }, []);
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || null;

  // Auth guard for viewing job details
  useEffect(() => {
    requireLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    if (job) return;
    let mounted = true;
    const fetchJob = async () => {
      setLoading(true);
      try {
        // Decide endpoint order based on id shape:
        // If id looks like a Mongo ObjectId (24 hex) try internal endpoints first,
        // otherwise try aggregator/external endpoints first (common for aggregator ids).
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id));

        const internalPaths = [
          { path: `/api/jobs/${id}`, auth: false },
          { path: `/api/jobs/public/${id}`, auth: false },
          { path: `/api/job/${id}`, auth: false },
          // note: /api/jobs (list) requires auth in backend; mark auth:true so we skip it if no token
          { path: `/api/jobs?externalId=${id}`, auth: true }
        ];
        const aggregatorPaths = [
          // backend implements GET /api/external-jobs?query=... or ?externalId=... (no per-id route)
          { path: `/api/external-jobs?externalId=${id}`, auth: false },
          { path: `/api/external-jobs?query=${encodeURIComponent(String(id))}`, auth: false },
          // legacy variants (kept for safety)
          { path: `/api/aggregator/jobs?externalId=${id}`, auth: false },
          { path: `/api/aggregator/jobs?query=${encodeURIComponent(String(id))}`, auth: false }
        ];

        const tryPaths = isObjectId ? [...internalPaths, ...aggregatorPaths] : [...aggregatorPaths, ...internalPaths];

        let res = null;
        for (const pObj of tryPaths) {
          const p = pObj.path;
          const requiresAuth = Boolean(pObj.auth);
          // skip auth-only probes if we don't have a token
          if (requiresAuth && !token) {
            console.debug('Skipping auth-required path (no token):', p);
            continue;
          }
          const opts = requiresAuth && token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          try {
            console.debug('JobDetailsPage: trying', p);
            res = await API.get(p, opts);
            if (res && (res.status === 200 || res.status === 201)) break;
          } catch (e) {
            console.debug(`fetchJob: ${p} -> ${e?.response?.status || e.message}`);
            res = null;
          }
        }

        if (!res) {
          // No endpoint matched. Use location.state.job if available, otherwise show error.
          if (location.state?.job) {
            if (mounted) setJob(location.state.job);
          } else {
            if (mounted) setError('Job not found (404). Confirm backend route, aggregator route or job id.');
          }
          return;
        }

        // Normalize common response shapes and handle array responses
        let payload = res?.data?.data || res?.data?.job || res?.data || null;
        if (Array.isArray(payload)) payload = payload[0] || null;
        if (mounted) setJob(payload);
      } catch (err) {
        console.error('Unexpected error fetching job:', err);
        if (mounted) setError('Failed to load job details');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchJob();
    return () => { mounted = false; };
  }, [id, job]);

  // fetch user profile progress and check if already applied
  // Copy CandidateDashboard behaviour:
  //  - fetch current user (/api/auth/me) to prefill application data
  //  - fetch profile progress (/api/profile/progress) and normalize to 0-100
  //  - if no token, mark profileLoaded so apply flow shows login modal instead of blocking
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      const t = localStorage.getItem('token');
      if (!t) return;
      try {
        const res = await API.get('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } });
        if (!mounted) return;
        setCurrentUser(res.data.user || null);
        // prefill application form
        setApplicationData((prev) => ({
          ...prev,
          userName: res.data.user?.username || prev.userName,
          email: res.data.user?.email || prev.email
        }));
      } catch (err) {
        console.debug('fetchUser failed', err?.response?.status || err.message);
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchProgress = async () => {
      const t = localStorage.getItem('token');
      if (!t) {
        if (mounted) {
          setProfileProgress(0);
          setProfileLoaded(true);
        }
        return;
      }

      try {
        const res = await API.get('/api/profile/progress', { headers: { Authorization: `Bearer ${t}` } });
        if (!mounted) return;
        let progress = res?.data?.progress ?? res?.data?.data ?? 0;
        progress = Number(progress) || 0;
        if (progress > 0 && progress <= 1) progress = Math.round(progress * 100);
        progress = Math.min(100, Math.max(0, Math.round(progress)));
        setProfileProgress(progress);
      } catch (err) {
        console.debug('fetchProgress failed', err?.response?.status || err.message);
        // fallback: keep profileProgress at 0
      } finally {
        if (mounted) setProfileLoaded(true);
      }
    };
    fetchProgress();
    return () => { mounted = false; };
  }, [id]);

  // Handle external job application - create lead then redirect
  const handleExternalJobApply = async (job) => {
    try {
      console.log('Starting external job application process for:', job);

      // require auth & profile (caller already ensures this) — double-check
      if (!currentUser && !token) {
        setShowLoginModal(true);
        return;
      }
      if ((profileProgress || 0) < 70) {
        setShowProfileCompletionModal(true);
        return;
      }

      // Determine job origin: DB jobs typically have Mongo ObjectId (24 hex).
      // Only create leads for jobs coming from remote API/aggregator (non-ObjectId or explicit aggregator source).
      const idToCheck = job?._id ?? job?.id ?? '';
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(idToCheck));
      const isAggregatorSource = String(job?.source || '').toLowerCase() === 'aggregator';
      const shouldCreateLead = isAggregatorSource || !isObjectId;

      const externalUrl = job?.applyUrl || job?.externalLink || job?.external_url || job?.externalApplyUrl;

      if (externalUrl) {
        if (shouldCreateLead) {
          const leadPayload = {
            name: currentUser?.name || applicationData.userName,
            email: currentUser?.email || applicationData.email,
            phone: currentUser?.phone || '',
            jobId: idToCheck,
            jobTitle: job?.jobTitle || job?.title,
            companyName: job?.companyName || job?.company,
            source: 'external',
            ref: window.location.href
          };
          try {
            await API.post('/api/leads', leadPayload);
          } catch (e) {
            console.debug('lead creation failed (non-blocking):', e?.response?.data || e.message);
          }
        } else {
          console.debug('Skipping lead creation for DB job or internal job with external link:', idToCheck);
        }

        // Always redirect to external URL when provided
        window.open(externalUrl, '_blank', 'noopener,noreferrer');
        setApplicationMessage({ message: 'You have been redirected to external application site.', type: 'info' });
        return;
      }

      // If no external URL, nothing to do here
      setApplicationMessage({ message: 'No external application URL available.', type: 'warning' });
      return;
    } catch (err) {
      console.error('Error in handleExternalJobApply:', err);
      setApplicationMessage({ message: 'Failed to start external application.', type: 'danger' });
    }
  };

  // Ensure user is authenticated and has sufficient profile completion (same as CandidateDashboard)
  const ensureAuthAndProfile = (threshold = 70) => {
    // not logged in -> prompt login
    if (!token) {
      setShowLoginModal(true);
      return false;
    }
    // if profile check still in progress, don't enforce yet
    if (!profileLoaded) {
      setApplicationMessage({ message: 'Checking profile status — please try again in a moment.', type: 'info' });
      return false;
    }
    // logged in but profile incomplete -> prompt to complete profile
    if ((profileProgress || 0) < threshold) {
      setShowProfileCompletionModal(true);
      return false;
    }
    return true;
  };

  const onApplyButton = () => {
    // ensure auth and profile (70% default) before any apply action
    if (!ensureAuthAndProfile(70)) return;

    // Decide whether this is an aggregator/remote job or an internal DB job.
    // DB jobs typically have Mongo ObjectId (_id length 24 hex). Treat as internal even if they include applyUrl.
    const idToCheck = job?._id ?? job?.id ?? '';
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(idToCheck));
    const isAggregatorSource = String(job?.source || '').toLowerCase() === 'aggregator';
    const isAggregatorOrRemote = isAggregatorSource || !isObjectId;

    if (isAggregatorOrRemote) {
      // aggregator/remote jobs use lead+redirect flow
      handleExternalJobApply(job);
      return;
    }

    // Internal DB job: open the apply modal (even if job has an external applyUrl)
    if (hasApplied) return;
    setShowApplyModal(true);
  };

  const handleApplicationChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'resume') {
      setApplicationData((s) => ({ ...s, resume: files[0] || null }));
    } else {
      setApplicationData((s) => ({ ...s, [name]: value }));
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    // if job is external do not post internal application (open external link instead)
    // Normalize possible external URL fields
    const externalUrl = job?.applyUrl || job?.externalLink || job?.external_url || job?.externalApplyUrl;
    // Only treat as truly external when explicitly marked or sourced from aggregator
    const isExplicitExternal = Boolean(job?.isExternal) || job?.source === 'aggregator';
    if (isExplicitExternal && externalUrl) {
      // external aggregator jobs -> redirect to external site
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
      setApplicationMessage({ message: 'This job is applied on external site. You have been redirected.', type: 'info' });
      setShowApplyModal(false);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setApplicationMessage({ message: '', type: '' });

    try {
      const form = new FormData();
      form.append('userName', applicationData.userName);
      form.append('email', applicationData.email);
      if (applicationData.coverLetter) form.append('coverLetter', applicationData.coverLetter);
      if (applicationData.resume) form.append('resume', applicationData.resume);

      const res = await API.post(`/api/jobs/${id}/apply`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const success = res?.data?.success ?? true;
      if (success) {
        setApplicationMessage({ message: 'Application submitted successfully.', type: 'success' });
        setHasApplied(true);
        setShowApplyModal(false);

        // Prefer server-provided redirect, then job.applyUrl / externalLink fields
        const redirectUrl = res?.data?.redirectUrl || job?.applyUrl || job?.externalLink || job?.external_url;
        if (redirectUrl) {
          // small delay to let modal close / UI update
          setTimeout(() => {
            window.open(redirectUrl, '_blank', 'noopener,noreferrer');
          }, 300);
        }
      } else {
        setApplicationMessage({ message: res?.data?.message || 'Failed to submit application.', type: 'danger' });
      }
    } catch (err) {
      console.error(err);
      setApplicationMessage({ message: err?.response?.data?.message || 'Submission failed.', type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!job) return <Container className="py-5"><Alert variant="warning">Job not found.</Alert></Container>;

  return (
    <>
      <SiteHeader />
      <Container fluid className="py-4 px-4" style={{ background: '#f6f8fb', minHeight: 'calc(100vh - 160px)' }}>
        <Container style={{ maxWidth: 1100 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-1">
                  <li className="breadcrumb-item"><Link to="/campus-job-drives">Jobs</Link></li>
                  <li className="breadcrumb-item active" aria-current="page">{job.companyName}</li>
                </ol>
              </nav>
              <h3 className="mb-0">{job.jobTitle}</h3>
              <div className="text-muted small">{job.companyName} • {job.location || '—'}</div>
            </div>
            <div className="d-none d-md-flex gap-2">
              <Button variant="outline-secondary" onClick={copyLink}>
                <Share className="me-1" /> Share
              </Button>
            </div>
          </div>

          <Row className="g-4">
            <Col lg={8}>
              <Card className="shadow-sm rounded-4">
                <Card.Body>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Badge bg="light" text="dark" className="py-2 px-3"><Briefcase className="me-1" /> {job.jobType || 'N/A'}</Badge>
                    <Badge bg="light" text="dark" className="py-2 px-3"><GeoAlt className="me-1" /> {job.location || '—'}</Badge>
                    {job.salary && <Badge bg="success" className="py-2 px-3 text-white"><CashStack className="me-1" /> {job.salary}</Badge>}
                    <Badge bg="light" text="dark" className="py-2 px-3">Apply by {formatDate(job.applicationDeadline)}</Badge>
                  </div>

                  <hr />

                  <h5 className="mb-3">Job Description</h5>
                  <div className="mb-4 text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || job.summary || 'No description provided.') }} />

                  <h5 className="mb-3">Roles & Responsibilities</h5>
                  <Card className="bg-light border-0 mb-4">
                    <Card.Body>
                      {job.responsibility ? (
                        <ul className="mb-0">
                          {String(job.responsibility).split('\n').filter(Boolean).map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      ) : <div className="text-muted">No responsibilities provided.</div>}
                    </Card.Body>
                  </Card>

                  <h5 className="mb-3">Requirements</h5>
                  <Card className="bg-light border-0 mb-4">
                    <Card.Body>
                      {job.requirements ? (
                        <ul className="mb-0">
                          {String(job.requirements).split('\n').filter(Boolean).map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      ) : <div className="text-muted">No specific requirements listed.</div>}
                    </Card.Body>
                  </Card>

                  {job.keySkills?.length > 0 && (
                    <>
                      <h6 className="mb-2">Key Skills</h6>
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        {job.keySkills.map((s, i) => <Badge bg="info" key={i} className="text-dark">{s}</Badge>)}
                      </div>
                    </>
                  )}

                  {job.aboutCompany && (
                    <>
                      <h6 className="mb-2">About Company</h6>
                      <Card className="bg-light border-0 mb-4">
                        <Card.Body className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{job.aboutCompany}</Card.Body>
                      </Card>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm rounded-4" style={{ position: 'sticky', top: 100 }}>
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(58,123,213,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Building size={28} className="text-primary" />
                    </div>
                    <div>
                      <div className="fw-semibold">{job.companyName}</div>
                      <div className="small text-muted">{job.industryType || ''}</div>
                    </div>
                  </div>

                  <div className="small text-muted mb-3">
                    <div><strong>Posted:</strong> {formatDate(job.createdAt)}</div>
                    <div><strong>Apply by:</strong> {formatDate(job.applicationDeadline)}</div>
                    <div><strong>Vacancies:</strong> {job.vacancies || '—'}</div>
                  </div>

                  <div className="d-grid gap-2 mb-2">
                    {hasApplied ? (
                      <Button variant="success" disabled><Check2 className="me-2" /> Applied</Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={onApplyButton}
                      >
                        <Briefcase className="me-2" /> Apply Now
                      </Button>
                    )}
                    <Button variant="outline-secondary" onClick={() => navigate(-1)}>Back</Button>
                  </div>
                  <div className="small text-muted">
                    <div><strong>Employment type:</strong> {job.employmentType || job.jobType || 'Not specified'}</div>
                    <div><strong>Role:</strong> {job.role || '—'}</div>
                    <div><strong>Qualification:</strong> {job.qualification || '—'}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>

      {/* Mobile fixed apply bar */}
      {!hasApplied && (
        <div className="d-md-none fixed-bottom p-3" style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
          <Container style={{ maxWidth: 1100 }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">{job.jobTitle}</div>
                <div className="small text-muted">{job.companyName}</div>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" onClick={copyLink}>Share</Button>
                <Button
                  variant="primary"
                  onClick={onApplyButton}
                >
                  <Briefcase className="me-1" /> Apply
                </Button>
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Apply Modal */}
      <Modal show={showApplyModal} onHide={() => setShowApplyModal(false)} size="lg" centered>
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold">Apply for {job.jobTitle}</Modal.Title>
          <Button variant="link" onClick={() => setShowApplyModal(false)} className="p-1 rounded-circle"><X size={24} /></Button>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Card className="mb-4 border-0 bg-light">
            <Card.Body className="p-3">
              <Row>
                <Col md={6}>
                  <p className="mb-2"><GeoAlt className="me-2 text-muted" size={18} /> <span className="fw-medium">Location:</span> {job.location}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-2"><Briefcase className="me-2 text-muted" size={18} /> <span className="fw-medium">Type:</span> {job.jobType}</p>
                  {job.salary && <p className="mb-2"><CashStack className="me-2 text-muted" size={18} /> <span className="fw-medium">Salary:</span> {job.salary}</p>}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {applicationMessage.message && (
            <Alert variant={applicationMessage.type} className="rounded-3">{applicationMessage.message}</Alert>
          )}

          <Form onSubmit={handleApplicationSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="d-flex align-items-center fw-medium"><Person className="me-2" size={18} /> Full Name</Form.Label>
              <Form.Control type="text" name="userName" value={applicationData.userName} onChange={handleApplicationChange} placeholder="Your full name" required className="py-2 rounded-3" />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="d-flex align-items-center fw-medium"><Envelope className="me-2" size={18} /> Email Address</Form.Label>
              <Form.Control type="email" name="email" value={applicationData.email} onChange={handleApplicationChange} placeholder="Your email address" required className="py-2 rounded-3" />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="d-flex align-items-center fw-medium"><FileEarmark className="me-2" size={18} /> Resume/CV</Form.Label>
              <Form.Control type="file" name="resume" onChange={handleApplicationChange} accept=".pdf,.doc,.docx" required className="py-2 rounded-3" />
              <Form.Text className="text-muted small">PDF, DOC, or DOCX files (Max 5MB)</Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Cover Letter (optional)</Form.Label>
              <Form.Control as="textarea" rows={3} name="coverLetter" value={applicationData.coverLetter} onChange={handleApplicationChange} className="py-2 rounded-3" />
            </Form.Group>

            <div className="d-flex justify-content-end gap-3 pt-2">
              <Button variant="outline-secondary" onClick={() => setShowApplyModal(false)} disabled={isSubmitting} className="rounded-pill px-4">Cancel</Button>
              <Button variant="primary" type="submit" disabled={isSubmitting} className="rounded-pill px-4">
                {isSubmitting ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Submitting...</>) : (<> <Check2 className="me-1" /> Submit Application</>)}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Profile completion modal */}
      {/* Profile Completion Modal - same UI as CandidateDashboard */}
      <Modal show={showProfileCompletionModal} onHide={() => setShowProfileCompletionModal(false)} centered>
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="fw-bold text-warning">
            <i className="bi bi-star me-2"></i>
            Complete Your Profile
          </Modal.Title>
          <Button
            variant="link"
            onClick={() => setShowProfileCompletionModal(false)}
            className="p-1 rounded-circle"
          >
            <i className="bi bi-x-lg" />
          </Button>
        </Modal.Header>

        <Modal.Body className="pt-0">
          <div className="text-center mb-4">
            <div className="mb-3">
              <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3">
                <i className="bi bi-star text-warning" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
            <h5 className="fw-bold mb-3">Profile Completion Required</h5>
            <p className="text-muted mb-4">
              Your profile is currently <strong>{profileProgress}% complete</strong>. 
              To apply for jobs, you need to complete your profile first.
            </p>
          </div>

          <Card className="border-warning bg-warning bg-opacity-5 mb-4">
            <Card.Body className="p-3">
              <h6 className="fw-bold mb-3 text-warning">
                <i className="bi bi-check2 me-2"></i>
                What you need to complete:
              </h6>
              <ul className="list-unstyled mb-0 small">
                <li className="mb-2">
                  <i className="bi bi-check2 me-2 text-success"></i>
                  Personal information (Name, Email, Phone)
                </li>
                <li className="mb-2">
                  <i className="bi bi-check2 me-2 text-success"></i>
                  Professional title and objective
                </li>
                <li className="mb-2">
                  <i className="bi bi-check2 me-2 text-success"></i>
                  Skills and certifications
                </li>
                <li className="mb-2">
                  <i className="bi bi-check2 me-2 text-success"></i>
                  Work experience and education
                </li>
                <li className="mb-0">
                  <i className="bi bi-check2 me-2 text-success"></i>
                  Resume upload
                </li>
              </ul>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-center gap-3">
            <Button
              variant="outline-secondary"
              onClick={() => setShowProfileCompletionModal(false)}
              className="rounded-pill px-4"
            >
              Maybe Later
            </Button>
            <Button
              variant="warning"
              onClick={() => {
                setShowProfileCompletionModal(false);
                // keep same redirect behavior as CandidateDashboard
                setShowModeModal(true);
              }}
              className="rounded-pill px-4 d-flex align-items-center"
            >
              <i className="bi bi-star me-2"></i>
              Complete Profile
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Login prompt when unauthenticated user clicks Apply */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header className="border-0 pb-0 position-relative">
          <Modal.Title className="fw-bold w-100 text-center">Register and Login required</Modal.Title>
          <Button
            variant="link"
            onClick={() => setShowLoginModal(false)}
            className="p-1 rounded-circle position-absolute end-0 top-0 mt-2 me-2"
          >
            <X size={24} />
          </Button>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="text-center mb-3">
            <p className="mb-0">You must be logged in to apply for this job. Please register or log in to continue.</p>
          </div>
          <div className="d-flex justify-content-center gap-3 mt-3">
            <Button variant="outline-secondary" onClick={() => setShowLoginModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => navigate('/candidate/register', { state: { from: location } })}>Register</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Copy link toast */}
      <div aria-live="polite" aria-atomic="true" className="position-fixed" style={{ top: 16, right: 16, zIndex: 2000 }}>
        <Toast show={showCopyToast} onClose={() => setShowCopyToast(false)} delay={1800} autohide>
          <Toast.Body>Link copied to clipboard</Toast.Body>
        </Toast>
      </div>

      <SiteFooter />
      {showModeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="p-4"
            style={{
              background: "#fff",
              width: "90%",
              maxWidth: "900px",
              borderRadius: "20px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            {/* Loading Overlay */}
            {isUploadingResume && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 10,
                }}
              >
                <div className="mb-4">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: "4rem", height: "4rem", borderWidth: "0.4rem" }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>

                <h4 className="fw-bold mb-3 text-primary">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {uploadStatus}
                </h4>

                <div className="w-75 mb-3">
                  <div className="progress" style={{ height: "10px" }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{
                        width: `${uploadProgress}%`,
                        background: "linear-gradient(90deg, #4361ee 0%, #3a0ca3 100%)",
                      }}
                      aria-valuenow={uploadProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>

                <p className="text-muted text-center mb-2">
                  {uploadProgress}% complete
                </p>

                <div className="mt-3 text-center">
                  <div className="d-flex align-items-center justify-content-center gap-3 text-muted small">
                    <div className={uploadProgress > 0 ? "text-success" : ""}>
                      <i className={`bi ${uploadProgress > 0 ? "bi-check-circle-fill" : "bi-circle"} me-1`}></i>
                      Uploading
                    </div>
                    <div className={uploadProgress > 50 ? "text-success" : ""}>
                      <i className={`bi ${uploadProgress > 50 ? "bi-check-circle-fill" : "bi-circle"} me-1`}></i>
                      Processing
                    </div>
                    <div className={uploadProgress === 100 ? "text-success" : ""}>
                      <i className={`bi ${uploadProgress === 100 ? "bi-check-circle-fill" : "bi-circle"} me-1`}></i>
                      Complete
                    </div>
                  </div>
                </div>

                <p className="text-muted small mt-4 mb-0">
                  Please wait while we analyze your resume...
                </p>
              </div>
            )}

            <Container className="py-3">
              <div className="text-center mb-4">
                <h1 className="fw-bold mb-2">Choose Update Method</h1>
                <p className="text-muted fs-5">
                  Select how you want to complete your profile
                </p>
              </div>
      
              <Row className="g-4 justify-content-center">
                {/* AI-Based Upload */}
                <Col md={6} lg={5}>
                  <Card className="h-100 border-0 shadow-sm p-4 text-center">
                    <div
                      className="bg-primary bg-opacity-10 p-4 rounded-circle d-flex align-items-center justify-content-center mb-4 mx-auto"
                      style={{ width: "100px", height: "100px" }}
                    >
                      <i className="bi bi-robot fs-1 text-primary"></i>
                    </div>
                    <Card.Body>
                      <Card.Title className="fw-bold fs-3 mb-3">
                        AI-Based Update
                      </Card.Title>
                      <Card.Text className="text-muted mb-4 fs-5">
                        Upload your resume and let AI fill your profile automatically.
                      </Card.Text>
      
                      <input
                        type="file"
                        id="resumeInput"
                        accept=".pdf,.doc,.docx"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                        disabled={isUploadingResume}
                      />
      
                      <Button
                        variant="primary"
                        size="lg"
                        className="px-4 py-2 rounded-pill"
                        onClick={() =>
                          document.getElementById("resumeInput").click()
                        }
                        disabled={isUploadingResume}
                      >
                        <i className="bi bi-cloud-upload me-2"></i>
                        Upload Resume
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
      
                {/* Manual Update */}
                <Col md={6} lg={5}>
                  <Card className="h-100 border-0 shadow-sm p-4 text-center">
                    <div
                      className="bg-success bg-opacity-10 p-4 rounded-circle d-flex align-items-center justify-content-center mb-4 mx-auto"
                      style={{ width: "100px", height: "100px" }}
                    >
                      <i className="bi bi-pencil-square fs-1 text-success"></i>
                    </div>
                    <Card.Body>
                      <Card.Title className="fw-bold fs-3 mb-3">
                        Manual Update
                      </Card.Title>
                      <Card.Text className="text-muted mb-4 fs-5">
                        Fill out your profile details manually at your own pace comfortably.
                      </Card.Text>
      
                      <Button
                        variant="success"
                        size="lg"
                        className="px-4 py-2 rounded-pill"
                        onClick={() =>
                          navigate("/update-profile?mode=manual")
                        }
                        disabled={isUploadingResume}
                      >
                        <i className="bi bi-pencil me-2"></i>
                        Continue Manually
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
      
              {/* Cancel */}
              <div className="text-center mt-4">
                <button
                  className="btn btn-light px-4 py-2 rounded-pill"
                  onClick={() => setShowModeModal(false)}
                  disabled={isUploadingResume}
                >
                  Cancel
                </button>
              </div>
            </Container>
          </div>
        </div>
      )}
    </>
  );
};

export default JobDetailsPage;