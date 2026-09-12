import React, { useState, useEffect } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';

import {

  Spinner, Alert, Modal, Form, Button, Card, Badge,

  Container, Row, Col, ListGroup, Stack, Tab, Tabs,

  Accordion, InputGroup, Dropdown

} from 'react-bootstrap';

import { FaHome } from 'react-icons/fa';

import {

  Building, GeoAlt, Briefcase, Clock,

  CashStack, Person, Envelope, FileEarmark,

  Star, ArrowRight, X, Check2, People, Calendar, FileText, Layers,

  Funnel, Search, Filter, Sliders, Bookmark, BookmarkFill

} from 'react-bootstrap-icons';

import API, { API_BASE_URL } from '../../../api';
import requireLogin from '../../../utils/requireLogin';

import 'bootstrap/dist/css/bootstrap.min.css';



const CampusJobDrives = () => {
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
  const [activeFilter, setActiveFilter] = useState('all');

  const [jobs, setJobs] = useState([]);

  const [combinedJobs, setCombinedJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModeModal, setShowModeModal] = useState(false);
  const [error, setError] = useState('');

  const [currentUser, setCurrentUser] = useState(null);

  const [showApplyModal, setShowApplyModal] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);

  const [showJobDetails, setShowJobDetails] = useState(false);

  const [applicationData, setApplicationData] = useState({

    userName: '',

    email: '',

    resume: null

  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [applicationMessage, setApplicationMessage] = useState({ type: '', message: '' });

  const [savedJobs, setSavedJobs] = useState([]);

  const [appliedJobs, setAppliedJobs] = useState([]);

  const [appliedExternalJobs, setAppliedExternalJobs] = useState([]);

  const [profileProgress, setProfileProgress] = useState(0);

  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  // Auth guard (preserve return location)
  useEffect(() => {
    requireLogin(navigate);
  }, [navigate]);



  // Advanced filter states

  const [salaryRange, setSalaryRange] = useState([0, 100000000]); // Max value: 100 million

  const [selectedLocations, setSelectedLocations] = useState([]);

  const [companySearch, setCompanySearch] = useState('');

  const [jobSearch, setJobSearch] = useState('');

  const [selectedSkills, setSelectedSkills] = useState([]);

  const [showFilters, setShowFilters] = useState(false);



  // External jobs (Jooble + Remotive + Adzuna)

  const [externalJobs, setExternalJobs] = useState([]);

  const [externalJobsLoading, setExternalJobsLoading] = useState(true);

  const [externalJobsError, setExternalJobsError] = useState('');

  
  // External jobs search and filter
  const [externalSearchQuery, setExternalSearchQuery] = useState("developer");
  const [externalLocation, setExternalLocation] = useState("India");
  const [externalJobType, setExternalJobType] = useState("all");

  

  // Pagination states

  const [currentPage, setCurrentPage] = useState(1);

  const [jobsPerPage] = useState(12);

  const [displayedJobs, setDisplayedJobs] = useState([]);

  const [hasMoreJobs, setHasMoreJobs] = useState(false);



  useEffect(() => {

    console.log('=== CAMPUS JOB DRIVES USEEFFECT TRIGGERED ===');

    console.log('Calling fetchJobs...');

    fetchJobs();

    console.log('Calling fetchExternalJobs...');

    fetchExternalJobs();

    // Fetch current user from API (like Candidate Dashboard does)
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, user not logged in');
          setCurrentUser(null);
          setAppliedJobs([]);
          setProfileProgress(0);
          return;
        }

        const res = await API.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = res.data.user;
        console.log('User fetched from API:', user);
        setCurrentUser(user);

        // Prefill application data
        setApplicationData({
          userName: user?.username || user?.name || '',
          email: user?.email || '',
          resume: null
        });

        // Fetch applied jobs
        try {
          const appliedRes = await API.get('/api/jobs/applied', { headers: { Authorization: `Bearer ${token}` } });
          const jobIds = Array.isArray(appliedRes.data?.appliedJobs)
            ? appliedRes.data.appliedJobs.map(app => app.job?._id).filter(Boolean)
            : [];
          setAppliedJobs(jobIds);
        } catch (err) {
          console.error('Failed to fetch applied jobs:', err);
          setAppliedJobs([]);
        }

        // Fetch profile progress
        try {
          const progressRes = await API.get('/api/profile/progress', { headers: { Authorization: `Bearer ${token}` } });
          const progress = progressRes.data.progress || 0;
          console.log('Profile progress fetched:', progress);
          setProfileProgress(progress);
        } catch (err) {
          console.error('Failed to fetch profile progress:', err);
          setProfileProgress(0);
        }

      } catch (err) {
        console.error('Failed to fetch user:', err);
        // Fallback to localStorage if API call fails
        const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        setCurrentUser(user);
        if (user) {
          setApplicationData({
            userName: user.name || '',
            email: user.email || '',
            resume: null
          });
        }
      }
    };

    fetchUser();

    // Load saved jobs from localStorage (optional UI helper)

    const saved = localStorage.getItem('savedJobs') ? JSON.parse(localStorage.getItem('savedJobs')) : [];

    setSavedJobs(saved);

  }, []);



  // External jobs are now fetched via the useEffect that watches filter changes
  // (fetchExternalJobs is called when externalSearchQuery, externalLocation, or externalJobType changes)



  useEffect(() => {

    if (!loading && jobs.length > 0 && location.state?.openJobId) {

      const jobToOpen = jobs.find(j => j._id === location.state.openJobId);

      if (jobToOpen) {

        if (location.state.action === 'apply') {

          handleApplyClick(jobToOpen);

        } else {

          handleViewDetails(jobToOpen);

        }

        navigate('.', { replace: true, state: {} });

      }

    }

  }, [loading, jobs, location.state, navigate]);



  // Combine and randomize jobs when both website and external jobs are loaded

  useEffect(() => {

    const combineAndRandomizeJobs = () => {

      console.log('Combining jobs - jobs array:', jobs.length, jobs);
      console.log('Combining jobs - externalJobs array:', externalJobs.length, externalJobs);

      const websiteJobs = jobs.map(job => ({

        ...job,

        source: 'Website',

        isExternal: job.isExternalLink || false, // Use the isExternalLink field from API

        applyUrl: job.isExternalLink ? job.externalLink : null // Use external link if it's an external job

      }));



      const externalJobsNormalized = externalJobs.map(job => ({

        ...job,

        isExternal: true,

        _id: job.id, // Normalize ID for consistency

        jobTitle: job.title,

        companyName: job.company,

        jobType: job.type,

        location: job.location || 'Remote',

        description: job.description || job.summary || 'Job description not available',

        requirements: job.requirements || 'Requirements not specified',

        responsibilities: job.responsibilities || 'Responsibilities not specified',

        salary: job.salary || 'Salary not specified',

        experienceLevel: job.experience || 'Any',

        keySkills: job.skills || [],

        essentialHiringSkills: job.skills || [],

        aboutCompany: job.company_description || 'Company information not available',

        vacancies: job.vacancies || 'Not specified',

        applicationDeadline: null // External jobs don't have deadlines

      }));



      // Combine all jobs

      const allJobs = [...websiteJobs, ...externalJobsNormalized];

      

      // Randomize the order

      const shuffled = allJobs.sort(() => Math.random() - 0.5);

      

      console.log('Combined jobs:', {

        websiteJobs: websiteJobs.length,

        externalJobs: externalJobsNormalized.length,

        totalCombined: shuffled.length

      });

      console.log('Final combined jobs array:', shuffled);

      setCombinedJobs(shuffled);

    };



    if (!loading && !externalJobsLoading) {

      combineAndRandomizeJobs();

    }

  }, [jobs, externalJobs, loading, externalJobsLoading]);



  // Pagination is now handled after filtering - displayedJobs is no longer used for filtering

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, selectedLocations, companySearch, jobSearch, selectedSkills, salaryRange]);



  // Load more jobs function

  const loadMoreJobs = () => {

    setCurrentPage(prev => prev + 1);

  };



  // Reset pagination when filters change

  useEffect(() => {

    setCurrentPage(1);

  }, [activeFilter, selectedLocations, companySearch, jobSearch, selectedSkills, salaryRange]);



  // Fetch external jobs from backend aggregator

  const fetchExternalJobs = async () => {

    try {

      setExternalJobsLoading(true);

      setExternalJobsError('');

      

      const params = {

        query: externalSearchQuery || 'developer',

        limit: 1000

      };

      
      if (externalLocation) {
        params.location = externalLocation;
      }

      

      console.log('Fetching external jobs...');

      const res = await API.get('/api/external-jobs', { params });

      

      console.log('External jobs API response:', res.data);

      

      if (res.data?.success) {

        let jobs = res.data.jobs || [];

        console.log('External jobs received:', jobs.length);

        
        // Apply client-side filtering for job type
        if (externalJobType !== 'all') {
          jobs = jobs.filter(job => {
            if (!job.type) return false;
            
            const normalizedJobType = job.type.toLowerCase().trim();
            const normalizedFilterType = externalJobType.toLowerCase().trim();
            
            // Exact match or contains the filter type as a whole word
            return normalizedJobType === normalizedFilterType || 
                   normalizedJobType.split(/[\s-,]+/).includes(normalizedFilterType);
          });
        }

        setExternalJobs(jobs);

      } else {

        console.error('External jobs API error:', res.data?.error);

        setExternalJobsError(res.data?.error || 'Failed to load external jobs');

      }

    } catch (err) {

      console.error('Error fetching external jobs:', err);

      setExternalJobsError('Network error while loading external jobs');

    } finally {

      setExternalJobsLoading(false);

    }

  };

  
  // Search handler for external jobs
  const handleExternalSearch = () => {
    fetchExternalJobs();
  };

  // Re-fetch when filters change
  useEffect(() => {
    fetchExternalJobs();
  }, [externalSearchQuery, externalLocation, externalJobType]);



  const fetchJobs = async () => {

    try {

      setLoading(true);

      setError('');

      console.log('=== FETCHING WEBSITE JOBS ===');

      console.log('API base URL:', API.defaults.baseURL);

      const response = await API.get('/api/jobs/public', { params: { limit: 1000 } });

      

      console.log('Website jobs API response status:', response.status);

      console.log('Website jobs API response data:', response.data);

      console.log('Response success:', response.data?.success);

      console.log('Response data array:', response.data?.data);

      console.log('Response data length:', response.data?.data?.length);



      if (response.data?.success) {

        const uniqueJobs = response.data.data.filter(

          (job, index, self) => index === self.findIndex(j => j._id === job._id)

        );

        console.log('Website jobs after deduplication:', uniqueJobs.length);

        console.log('Website jobs sample:', uniqueJobs.slice(0, 2)); // Show first 2 jobs for debugging

        console.log('Setting jobs state with:', uniqueJobs);

        setJobs(uniqueJobs || []);

        console.log('Jobs state set successfully');

      } else {

        console.error('Website jobs API error:', response.data?.message);

        setError(response.data?.message || 'Failed to fetch jobs');

      }

    } catch (error) {

      console.error('Error fetching website jobs:', error);

      console.error('Error details:', error.response?.data);

      console.error('Error status:', error.response?.status);

      setError('Network error. Please try again.');

    } finally {

      setLoading(false);

      console.log('=== FETCH JOBS COMPLETED ===');

    }

  };



  // Helper function to check if job matches a specific type

  const isJobTypeMatch = (job, targetType) => {

    // Handle external jobs (they might have different field names)
    let jobType = '';
    
    if (job.isExternal) {
      // External jobs might use 'type' instead of 'jobType'
      jobType = (job.type || job.jobType || '').toLowerCase().trim().replace(/\s+/g, '');
    } else {
      // Internal jobs use 'jobType'
      jobType = (job.jobType || '').toLowerCase().trim().replace(/\s+/g, '');
    }

    if (!jobType) return false;

    

    switch (targetType) {

      case 'fulltime':

        return [

          'fulltime', 'full-time', 'fulltimeemployment', 'fulltimework',

          'fulltimejob', 'regular', 'permanent', 'ft', 'f/t'

        ].includes(jobType);

      

      case 'parttime':

        return [

          'parttime', 'part-time', 'parttimeemployment', 'parttimework',

          'parttimejob', 'pt', 'p/t', 'casual', 'flexible'

        ].includes(jobType);

      

      case 'internship':

        return [

          'internship', 'intern', 'trainee', 'traineeship', 'apprenticeship',

          'apprentice', 'studentjob', 'studentemployment', 'placement'

        ].includes(jobType);

      

      case 'contract':

        return [

          'contract', 'contractual', 'freelance', 'freelancer', 'consultant',

          'projectbased', 'fixedterm'

        ].includes(jobType);

      

      case 'temporary':

        return [

          'temporary', 'temp', 'temporaryemployment', 'temporarywork',

          'seasonal', 'shortterm', 'short-term'

        ].includes(jobType);

      

      case 'remote':

        return [

          'remote', 'remotework', 'workfromhome', 'wfh', 'telecommute',

          'virtual', 'online', 'distributed'

        ].includes(jobType);

      

      default:

        return false;

    }

  };



  // Calculate job counts for each type

  const getJobCounts = () => {

    // Use combinedJobs for counts to include both internal and external jobs
    const jobsToCount = combinedJobs.length > 0 ? combinedJobs : jobs;

    const counts = {

      all: jobsToCount.length,

      fulltime: jobsToCount.filter(job => isJobTypeMatch(job, 'fulltime')).length,

      parttime: jobsToCount.filter(job => isJobTypeMatch(job, 'parttime')).length,

      internship: jobsToCount.filter(job => isJobTypeMatch(job, 'internship')).length,

      contract: jobsToCount.filter(job => isJobTypeMatch(job, 'contract')).length,

      temporary: jobsToCount.filter(job => isJobTypeMatch(job, 'temporary')).length,

      remote: jobsToCount.filter(job => isJobTypeMatch(job, 'remote')).length

    };

    return counts;

  };



  const jobCounts = getJobCounts();

  

  // Force re-render when applied jobs change

  const appliedJobsKey = appliedJobs.join(',');



  // Extract unique values for filters

  // Use combinedJobs for filter options to include both internal and external jobs
  const jobsForFilters = combinedJobs.length > 0 ? combinedJobs : jobs;

  const allLocations = [...new Set(jobsForFilters.map(job => job.location).filter(Boolean))];

  const allSkills = [...new Set(

    jobsForFilters.flatMap(job => [...(job.keySkills || []), ...(job.essentialHiringSkills || [])])

  )];

  const allCompanies = [...new Set(jobsForFilters.map(job => job.companyName).filter(Boolean))];



  // Use combinedJobs (all jobs) for filtering, not displayedJobs (paginated subset)

  const baseJobs = combinedJobs.length > 0 ? combinedJobs : jobs;

  // Debug logging removed - issue was isExternalLink field handling
  const filteredJobs = baseJobs.filter(job => {

    // Base filter

    if (activeFilter !== 'all') {

      if (!isJobTypeMatch(job, activeFilter)) {
        return false;

      }

    }



    // Advanced filters

    if (selectedLocations.length > 0 && !selectedLocations.includes(job.location)) {
      return false;

    }



    if (companySearch && (!job.companyName || !job.companyName.toLowerCase().includes(companySearch.toLowerCase()))) {
      return false;

    }

    // Job search filter
    if (jobSearch) {
      const searchTerm = jobSearch.toLowerCase();
      const searchableFields = [
        job.jobTitle,
        job.companyName,
        job.description || job.jobDescription,
        job.requirements,
        job.responsibility || job.responsibilities,
        job.location,
        ...(job.keySkills || []),
        ...(job.essentialHiringSkills || [])
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }

    if (selectedSkills.length > 0) {

      const jobSkills = [...(job.keySkills || []), ...(job.essentialHiringSkills || [])];

      if (!selectedSkills.some(skill => jobSkills.includes(skill))) {
        return false;

      }

    }



    // Salary filter

    if (job.salary && job.salary.trim() !== '') {

      const salaryMatch = job.salary.match(/\d+/g);

      if (salaryMatch && salaryMatch.length > 0) {

        const minSalary = parseInt(salaryMatch[0]);

        if (!isNaN(minSalary) && (minSalary < salaryRange[0] || minSalary > salaryRange[1])) {

          return false;

        }

      }

    }



    return true;

  });







  const formatDate = (dateString) => {

    const options = { day: 'numeric', month: 'short', year: 'numeric' };

    return new Date(dateString).toLocaleDateString('en-US', options);

  };



  const isJobApplied = (jobId) => {
    return appliedJobs.includes(jobId);
  };

  // Added: only treat as "direct-redirect aggregator" when job is from external source (not Website)
  const isAggregatorJob = (job) => {
    return !!(job && job.isExternal && job.source !== 'Website');
  };



  const handleApplyClick = (job) => {

    if (!currentUser) {

      setApplicationMessage({

        type: 'danger',

        message: 'Please log in to apply for this job'

      });

      return;

    }



    // Check if profile is complete before allowing application

    if (profileProgress < 70) { // Using 70% as threshold for essential fields

      setShowProfileCompletionModal(true);

      return;

    }



    // Check if already applied

    if (isJobApplied(job._id)) {

      setApplicationMessage({

        type: 'warning',

        message: 'You have already applied for this job'

      });

      return;

    }



    setSelectedJob(job);

    setApplicationMessage({ type: '', message: '' });

    setShowApplyModal(true);

  };

  // Handle external job application - create lead then redirect
  const handleExternalJobApply = async (job) => {
    try {
      console.log('Starting external job application process for:', job);
      
      // Check if user is logged in
      if (!currentUser) {
        setApplicationMessage({ type: "danger", message: "Please login to apply for this job" });
        return;
      }

      // Check if profile is complete before allowing application
      if (profileProgress < 70) { // Using 70% as threshold for essential fields
        setShowProfileCompletionModal(true);
        return;
      }
      
      // Get user profile data for lead creation
      const userProfile = await API.get('/api/profile/progress');
      const profileData = userProfile.data.data;
      
      console.log('User profile data:', profileData);
      console.log('Profile data structure:', JSON.stringify(profileData, null, 2));
      
      // Extract user info from profile data - handle different possible structures
      const userName = profileData?.name || profileData?.userName || currentUser?.username || 'External Job Applicant';
      const userEmail = profileData?.email || currentUser?.email || 'external@job.com';
      const userPhone = profileData?.phone || profileData?.contact || '';
      
      console.log('Extracted user info:', { userName, userEmail, userPhone });
      
      const leadData = {
        name: userName,
        email: userEmail,
        phone: userPhone,
        source: 'external_job_application',
        jobId: null, // External jobs don't have internal job IDs
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        status: 'new',
        priority: 'medium',
        score: 40, // Lower score for external job applications
        tags: ['external_job', 'job_application'],
        externalJobUrl: job.applyUrl,
        notes: `External job application - Source: ${job.source || 'External API'}`
      };

      console.log('Lead data to send:', leadData);
      
      // Create a lead for external job application
      console.log('Sending lead creation request to /api/leads with data:', leadData);
      const leadResponse = await API.post('/api/leads', leadData);
      
      console.log('Lead creation response:', leadResponse.data);
      console.log('Lead created successfully for external job application');
      console.log('Lead ID:', leadResponse.data.lead?._id);
      
      // Mark external job as applied
      setAppliedExternalJobs(prev => [...prev, { 
        jobId: job._id, 
        appliedAt: new Date(),
        jobTitle: job.jobTitle,
        companyName: job.companyName
      }]);
      
      // Show success message
      setApplicationMessage({ 
        type: "success", 
        message: `Application submitted successfully! Lead created for ${job.companyName} - ${job.jobTitle}` 
      });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setApplicationMessage({ type: "", message: "" });
      }, 5000);
      
      // Redirect to external job URL
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
      
    } catch (error) {
      console.error('Error creating lead for external job:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      
      // Show error message to user
      setApplicationMessage({ 
        type: "danger", 
        message: `Failed to create lead: ${error.message || 'Unknown error'}` 
      });
      
      // Still redirect even if lead creation fails
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewDetails = (job) => {

    if (!job) return;
   // keep selected job locally
    setSelectedJob(job);
    setShowJobDetails(false);
    const id = job._id || job.id || String(job.jobTitle || 'job').replace(/\s+/g, '-').toLowerCase();
    navigate(`/jobs/${id}`, { state: { job } });
  };



  const handleApplicationChange = (e) => {

    const { name, value, files } = e.target;

    setApplicationData({

      ...applicationData,

      [name]: files ? files[0] : value

    });

  };



  const handleApplicationSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setApplicationMessage({
        type: 'danger',
        message: 'Please log in to apply'
      });
      return;
    }

    setIsSubmitting(true);
    setApplicationMessage({ type: '', message: '' });

    const formData = new FormData();
    formData.append('userName', applicationData.userName);
    formData.append('email', applicationData.email);
    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await API.post(
        `/api/jobs/${selectedJob._id}/apply`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
            // Note: do NOT set Content-Type here; browser sets multipart boundary
          }
        }
      );

      if (response.data) {
        setApplicationMessage({
          type: 'success',
          message: response.data.message || 'Application submitted successfully!'
        });

        // Mark job as applied immediately (deduplicate)
        setAppliedJobs(prev => {
          const prevIds = Array.isArray(prev) ? prev : [];
          if (prevIds.includes(selectedJob._id) || prevIds.some(p => p.jobId === selectedJob._id)) return prevIds;
          return [...prevIds, selectedJob._id];
        });
        
        // Close modal so list shows "Applied"
        setShowApplyModal(false);
        setSelectedJob(null);
        
        // Determine redirect URL (prefer server-provided so backend can inject user-specific params)
        const redirectUrl = response.data?.redirectUrl
          || response.data?.applyUrl
          || selectedJob?.applyUrl
          || selectedJob?.externalLink;

        if (redirectUrl) {
          const finalUrl = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;
          // open in new tab
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        }

        // clear form state
        setApplicationData({
          userName: currentUser?.name || currentUser?.username || '',
          email: currentUser?.email || '',
          resume: null
        });
        // clear message after short delay
        setTimeout(() => setApplicationMessage({ type: '', message: '' }), 2000);
      }
    } catch (error) {
      console.error('Error submitting application:', error);

      if (error.response?.data?.code === 'INCOMPLETE_PROFILE') {
        setApplicationMessage({
          type: 'warning',
          message: error.response.data.message || 'Please complete your profile before applying for jobs.'
        });
      } else {
        setApplicationMessage({
          type: 'danger',
          message: error.response?.data?.message || 'Network error. Please try again.'
        });
      }

      // fallback: if server returned redirect/apply url even on error, try opening it
      const fallback = error.response?.data?.redirectUrl || error.response?.data?.applyUrl;
      if (fallback) {
        const finalUrl = fallback.startsWith('http') ? fallback : `https://${fallback}`;
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsSubmitting(false);
    }

  };



  return (



    <>

      <nav className="navbar shadow-sm bg-white w-100 position-sticky top-0 border-bottom" style={{ zIndex: 1050 }}>

        <div className="container-fluid px-2 px-md-4">

          <img src="/logo.jpeg" alt="Logo" style={{ height: '35px' }} />

          <Link

            to="/career-dashboard"

            className="btn btn-primary rounded-pill px-3 px-md-4 ms-auto d-flex align-items-center"

            >

              <FaHome className="me-1" />

              <span className="d-none d-sm-inline">Dashboard</span>

              <span className="d-inline d-sm-none">Home</span>

          </Link>

        </div>

      </nav>



      <Container fluid className="px-lg-5 py-4 bg-light min-vh-100">



      {/* Job Details Modal */}

      <Modal show={showJobDetails} onHide={() => setShowJobDetails(false)} size="lg" fullscreen="md-down" centered>

        <Modal.Header closeButton className="border-0 pb-0">

          <div className="d-flex align-items-start">

            <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3 flex-shrink-0">

              <Building size={32} className="text-primary" />

            </div>

            <div>

              <Modal.Title className="fw-bold mb-1" style={{ fontSize: '1.5rem', color: '#2c3e50' }}>

                {selectedJob?.jobTitle}

              </Modal.Title>

              {selectedJob?.companyName && (

                <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>{selectedJob.companyName}</p>

              )}

            </div>

          </div>

        </Modal.Header>



        <Modal.Body className="pt-4">

          {selectedJob && (

            <>

              {/* Key Details Ribbon */}

              <div className="d-flex flex-wrap gap-2 mb-4">

                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">

                  <Briefcase className="text-primary me-2" size={16} />

                  <span className="fw-medium">{selectedJob.jobType}</span>

                </div>

                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">

                  <GeoAlt className="text-primary me-2" size={16} />

                  <span className="fw-medium">{selectedJob.location}</span>

                </div>

                {selectedJob.salary && (

                  <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">

                    <CashStack className="text-primary me-2" size={16} />

                    <span className="fw-medium text-success">{selectedJob.salary}</span>

                  </div>

                )}

                <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">

                  <Clock className="text-primary me-2" size={16} />

                  <span className="fw-medium">Apply by {formatDate(selectedJob.applicationDeadline)}</span>

                </div>

              </div>



              {/* Job Information Section */}

              <div className="mb-4">

                <h4 className="mb-3 d-flex align-items-center">

                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                    <FileText size={18} className="text-primary" />

                  </span>

                  Job Information

                </h4>



                <div className="ps-4 ms-3">

                  <div className="mb-3">

                    <div className="mb-2">

                      <span className="fw-medium me-2">Department:</span>

                      <span>{selectedJob.department || 'Not specified'}</span>

                    </div>

                    <div className="mb-2">

                      <span className="fw-medium me-2">Experience Level:</span>

                      <span>{selectedJob.experienceLevel || 'Any'}</span>

                    </div>

                    <div className="mb-2">

                      <span className="fw-medium me-2">Employment Type:</span>

                      <span>{selectedJob.employmentType || 'Not specified'}</span>

                    </div>

                    <div className="mb-2">

                      <span className="fw-medium me-2">Industry Type:</span>

                      <span>{selectedJob.industryType || 'Not specified'}</span>

                    </div>

                    <div className="mb-2">

                      <span className="fw-medium me-2">Role:</span>

                      <span>{selectedJob.role || 'Not specified'}</span>

                    </div>

                    <div className="mb-2">

                      <span className="fw-medium me-2">Role Category:</span>

                      <span>{selectedJob.roleCategory || 'Not specified'}</span>

                    </div>

                    {selectedJob.band && (

                      <div className="mb-2">

                        <span className="fw-medium me-2">Band:</span>

                        <span>{selectedJob.band}</span>

                      </div>

                    )}

                    {selectedJob.qualification && (

                      <div className="mb-2">

                        <span className="fw-medium me-2">Qualification:</span>

                        <span>{selectedJob.qualification}</span>

                      </div>

                    )}

                  </div>

                </div>

              </div>



              {/* Additional Information */}

              <div className="mb-4">

                <h4 className="mb-3 d-flex align-items-center">

                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                    <Calendar size={18} className="text-primary" />

                  </span>

                  Additional Information

                </h4>



                <div className="ps-4 ms-3">

                  <div className="mb-2">

                    <span className="fw-medium me-2">Posted On:</span>

                    <span>{formatDate(selectedJob.createdAt)}</span>

                  </div>

                  <div className="mb-2">

                    <span className="fw-medium me-2">Application Deadline:</span>

                    <span>{formatDate(selectedJob.applicationDeadline)}</span>

                  </div>

                  {selectedJob.shift && (

                    <div className="mb-2">

                      <span className="fw-medium me-2">Shift:</span>

                      <span>{selectedJob.shift}</span>

                    </div>

                  )}

                  {selectedJob.vacancies && (

                    <div className="mb-2">

                      <span className="fw-medium me-2">Vacancies:</span>

                      <span>{selectedJob.vacancies}</span>

                    </div>

                  )}

                </div>

              </div>



              {/* Job Description */}

              <div className="mb-4">

                <h4 className="mb-3 d-flex align-items-center">

                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                    <FileText size={18} className="text-primary" />

                  </span>

                  Job Description

                </h4>

                <div className="bg-light p-4 rounded-3">

                  {selectedJob.description || 'No description provided.'}

                </div>

              </div>



              {/* Responsibilities */}

              <div className="mb-4">

                <h4 className="mb-3 d-flex align-items-center">

                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                    <Layers size={18} className="text-primary" />

                  </span>

                  Responsibilities

                </h4>

                <div className="bg-light p-4 rounded-3">

                  {selectedJob.responsibility ? (

                    <ul className="mb-0">

                      {selectedJob.responsibility.split('\n').map((item, index) => (

                        item.trim() && <li key={index} className="mb-2">{item}</li>

                      ))}

                    </ul>

                  ) : (

                    'No responsibilities provided.'

                  )}

                </div>

              </div>



              {/* Requirements */}

              <div className="mb-4">

                <h4 className="mb-3 d-flex align-items-center">

                  <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                    <FileEarmark size={18} className="text-primary" />

                  </span>

                  Requirements

                </h4>

                <div className="bg-light p-4 rounded-3">

                  {selectedJob.requirements ? (

                    <ul className="mb-0">

                      {selectedJob.requirements.split('\n').map((item, index) => (

                        item.trim() && <li key={index} className="mb-2">{item}</li>

                      ))}

                    </ul>

                  ) : (

                    'No specific requirements listed.'

                  )}

                </div>

              </div>



              {/* Skills */}

              {selectedJob.essentialHiringSkills?.length > 0 && (

                <div className="mb-4">

                  <h4 className="mb-3 d-flex align-items-center">

                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                      <Star size={18} className="text-primary" />

                    </span>

                    Essential Hiring Skills

                  </h4>

                  <div className="d-flex flex-wrap gap-2">

                    {selectedJob.essentialHiringSkills.map((s, idx) => (

                      <Badge key={`ess-${idx}`} bg="primary" pill className="px-3 py-2">{s}</Badge>

                    ))}

                  </div>

                </div>

              )}



              {selectedJob.keySkills?.length > 0 && (

                <div className="mb-4">

                  <h4 className="mb-3 d-flex align-items-center">

                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                      <Layers size={18} className="text-primary" />

                    </span>

                    Key Skills

                  </h4>

                  <div className="d-flex flex-wrap gap-2">

                    {selectedJob.keySkills.map((s, idx) => (

                      <Badge key={`key-${idx}`} bg="info" pill className="px-3 py-2">{s}</Badge>

                    ))}

                  </div>

                </div>

              )}



              {/* About Company */}

              {selectedJob.aboutCompany && (

                <div className="mb-4">

                  <h4 className="mb-3 d-flex align-items-center">

                    <span className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">

                      <Building size={18} className="text-primary" />

                    </span>

                    About Company

                  </h4>

                  <div className="bg-light p-4 rounded-3">

                    {selectedJob.aboutCompany}

                  </div>

                </div>

              )}



              {/* Action Buttons */}

              <div className="d-flex justify-content-between gap-3 pt-4 border-top">

                <Button

                  variant="outline-secondary"

                  onClick={() => setShowJobDetails(false)}

                  className="rounded-pill px-4 py-2 d-flex align-items-center"

                >

                  <X className="me-2" size={18} />

                  Close

                </Button>

                {selectedJob.isExternal ? (
                  // External aggregator job - direct redirect (only when source !== 'Website')
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowJobDetails(false);
                      handleExternalJobApply(selectedJob);
                    }}
                    className="rounded-pill px-4 py-2 d-flex align-items-center"
                  >
                    <Briefcase className="me-2" size={18} />
                    Apply
                  </Button>
                ) : (
                 // NOTE: replace the top-level check with isAggregatorJob(selectedJob) call in render --
                 // keep this branch as the "internal (DB) job -> show modal first" flow.
                   // Internal job - show application modal
                   isJobApplied(selectedJob._id) ? (
                     <Button
                       variant="success"
                       disabled
                       className="rounded-pill px-4 py-2 d-flex align-items-center"
                     >
                       <Check2 className="me-2" size={18} />
                       Applied
                     </Button>
                   ) : (
                     <Button
                       variant="primary"
                       onClick={() => {
                         setShowJobDetails(false);
                         handleApplyClick(selectedJob);
                       }}
                       className="rounded-pill px-4 py-2 d-flex align-items-center"
                     >
                       <Briefcase className="me-2" size={18} />
                       Apply
                     </Button>
                   )
                 )}

              </div>

            </>

          )}

        </Modal.Body>

      </Modal>



      {/* Main Content */}

      <Row>

        <Col lg={12}>

          <div className="p-4 rounded-4 mb-4" style={{

            background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)',

            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'

          }}>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">

              <div>

                <h1 className="display-6 fw-bold text-white mb-2">Campus Recruitment</h1>

                <p className="lead text-white-50 mb-3 mb-md-0" style={{ opacity: 0.9 }}>

                  Discover your next career opportunity with leading companies

                </p>
                <br />

              </div>
              

              <Button

                variant="outline-light"

                className="d-lg-none rounded-pill px-4 py-2"

                onClick={() => setShowFilters(!showFilters)}

                style={{

                  backdropFilter: 'blur(10px)',

                  backgroundColor: 'rgba(255,255,255,0.2)',

                  borderColor: 'rgba(255,255,255,0.3)',

                  transition: 'all 0.3s ease'

                }}

              >

                <Filter className="me-2" /> {showFilters ? 'Hide Filters' : 'Show Filters'}

              </Button>

            </div>
            {/* Search and Filter Controls */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search jobs..."
                    value={externalSearchQuery}
                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleExternalSearch()}
                  />
                  <button
                    className="btn btn-outline-primary position-absolute end-0 top-0 h-100 border-0"
                    onClick={handleExternalSearch}
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>
              
              <div className="col-12 col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Location (optional)"
                  value={externalLocation}
                  onChange={(e) => setExternalLocation(e.target.value)}
                />
              </div>
              
              {/* Source filter removed per request */}
              
              <div className="col-12 col-md-3">
                <select
                  className="form-select"
                  value={externalJobType}
                  onChange={(e) => setExternalJobType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
          </div>


        </Col>


      </Row>



      <Row>

        {/* Filters Sidebar - Hidden on mobile unless toggled */}

        <Col lg={3} className={`mb-4 ${!showFilters ? 'd-none d-lg-block' : ''}`}>

          <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>

            <Card.Header className="bg-white border-0 py-3">

              <h5 className="mb-0 d-flex align-items-center">

                <Sliders className="me-2 text-primary" /> Advanced Filters

              </h5>

            </Card.Header>

            <Card.Body>

              <Accordion defaultActiveKey={['0', '1', '2', '3', '4', '5']} alwaysOpen>

                {/* Job Search */}
                <Accordion.Item eventKey="0" className="border-0 mb-3">
                  <Accordion.Header className="p-0 border-0 bg-light rounded-3">
                    <span className="fw-medium d-flex align-items-center">
                      <Search className="me-2 text-primary" size={16} />
                      Search Jobs
                    </span>
                  </Accordion.Header>
                  <Accordion.Body className="px-0 pt-3 pb-3">
                    <InputGroup className="mb-3">
                      <InputGroup.Text className="bg-light">
                        <Search size={14} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Search job titles, descriptions, skills..."
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        className="py-1"
                      />
                      {jobSearch && (
                        <Button
                          variant="link"
                          onClick={() => setJobSearch('')}
                          className="text-secondary"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </InputGroup>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Job Type Filter */}

                <Accordion.Item eventKey="1" className="border-0 mb-3">

                  <Accordion.Header className="p-0 border-0 bg-light rounded-3">

                    <span className="fw-medium d-flex align-items-center">

                      <Briefcase className="me-2 text-primary" size={16} />

                      Job Type

                    </span>

                  </Accordion.Header>

                  <Accordion.Body className="px-0 pt-3 pb-3">

                    <div className="d-flex flex-column gap-2">

                      <Button

                        variant={activeFilter === 'all' ? 'primary' : 'outline-secondary'}

                        onClick={() => setActiveFilter('all')}

                        className="d-flex justify-content-between align-items-center rounded-pill"

                      >

                        <span>All Jobs</span>

                        <Badge bg={activeFilter === 'all' ? 'light' : 'secondary'} text={activeFilter === 'all' ? 'dark' : 'white'} pill>

                          {jobCounts.all}

                        </Badge>

                      </Button>

                      <Button

                        variant={activeFilter === 'fulltime' ? 'primary' : 'outline-secondary'}

                        onClick={() => setActiveFilter('fulltime')}

                        className="d-flex justify-content-between align-items-center rounded-pill"

                      >

                        <span>Full-time</span>

                        <Badge bg={activeFilter === 'fulltime' ? 'light' : 'secondary'} text={activeFilter === 'fulltime' ? 'dark' : 'white'} pill>

                          {jobCounts.fulltime}

                        </Badge>

                      </Button>

                      <Button

                        variant={activeFilter === 'parttime' ? 'primary' : 'outline-secondary'}

                        onClick={() => setActiveFilter('parttime')}

                        className="d-flex justify-content-between align-items-center rounded-pill"

                      >

                        <span>Part-time</span>

                        <Badge bg={activeFilter === 'parttime' ? 'light' : 'secondary'} text={activeFilter === 'parttime' ? 'dark' : 'white'} pill>

                          {jobCounts.parttime}

                        </Badge>

                      </Button>

                      <Button

                        variant={activeFilter === 'internship' ? 'primary' : 'outline-secondary'}

                        onClick={() => setActiveFilter('internship')}

                        className="d-flex justify-content-between align-items-center rounded-pill"

                      >

                        <span>Internship</span>

                        <Badge bg={activeFilter === 'internship' ? 'light' : 'secondary'} text={activeFilter === 'internship' ? 'dark' : 'white'} pill>

                          {jobCounts.internship}

                        </Badge>

                      </Button>

                      <Button

                        variant={activeFilter === 'temporary' ? 'primary' : 'outline-secondary'}

                        onClick={() => setActiveFilter('temporary')}

                        className="d-flex justify-content-between align-items-center rounded-pill"

                      >

                        <span>Temporary</span>

                        <Badge bg={activeFilter === 'temporary' ? 'light' : 'secondary'} text={activeFilter === 'temporary' ? 'dark' : 'white'} pill>

                          {jobCounts.temporary}

                        </Badge>

                      </Button>

                      <Button

                        variant={activeFilter === 'contract' ? 'primary' : 'outline-secondary'}

                        onClick={() => setActiveFilter('contract')}

                        className="d-flex justify-content-between align-items-center rounded-pill"

                      >

                        <span>Contract</span>

                        <Badge bg={activeFilter === 'contract' ? 'light' : 'secondary'} text={activeFilter === 'contract' ? 'dark' : 'white'} pill>

                          {jobCounts.contract}

                        </Badge>

                      </Button>

                      <Button

                        variant={activeFilter === 'remote' ? 'primary' : 'outline-secondary'}

                        onClick={() => setActiveFilter('remote')}

                        className="d-flex justify-content-between align-items-center rounded-pill"

                      >

                        <span>Remote</span>

                        <Badge bg={activeFilter === 'remote' ? 'light' : 'secondary'} text={activeFilter === 'remote' ? 'dark' : 'white'} pill>

                          {jobCounts.remote}

                        </Badge>

                      </Button>

                    </div>

                  </Accordion.Body>

                </Accordion.Item>



                {/* Location Filter */}

                <Accordion.Item eventKey="2" className="border-0 mb-3">

                  <Accordion.Header className="p-0 border-0 bg-light rounded-3">

                    <span className="fw-medium d-flex align-items-center">

                      <GeoAlt className="me-2 text-primary" size={16} />

                      Location

                    </span>

                  </Accordion.Header>

                  <Accordion.Body className="px-0 pt-3 pb-3">

                    <Dropdown>

                      <Dropdown.Toggle

                        variant="outline-secondary"

                        size="sm"

                        className="w-100 text-start d-flex justify-content-between align-items-center"

                      >

                        <span>

                          {selectedLocations.length > 0 ? `${selectedLocations.length} selected` : 'All locations'}

                        </span>

                      </Dropdown.Toggle>

                      <Dropdown.Menu className="p-3 w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>

                        <div className="mb-2">

                          <InputGroup size="sm">

                            <InputGroup.Text>

                              <Search size={14} />

                            </InputGroup.Text>

                            <Form.Control

                              placeholder="Search locations..."

                              onChange={(e) => {

                                const search = e.target.value.toLowerCase();

                                const filtered = allLocations.filter(loc =>

                                  loc.toLowerCase().includes(search)

                                );

                                // Implement search functionality if needed

                              }}

                            />

                          </InputGroup>

                        </div>

                        <div className="d-flex flex-column gap-2">

                          {allLocations.map(location => (

                            <Form.Check

                              key={location}

                              type="checkbox"

                              id={`loc-${location}`}

                              label={location}

                              checked={selectedLocations.includes(location)}

                              onChange={(e) => {

                                if (e.target.checked) {

                                  setSelectedLocations([...selectedLocations, location]);

                                } else {

                                  setSelectedLocations(selectedLocations.filter(l => l !== location));

                                }

                              }}

                              className="mb-1"

                            />

                          ))}

                        </div>

                      </Dropdown.Menu>

                    </Dropdown>

                    {selectedLocations.length > 0 && (

                      <div className="mt-3">

                        <div className="d-flex flex-wrap gap-2">

                          {selectedLocations.map(location => (

                            <Badge

                              key={location}

                              bg="light"

                              text="dark"

                              pill

                              className="d-flex align-items-center"

                            >

                              {location}

                              <X

                                size={14}

                                className="ms-1 cursor-pointer"

                                onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== location))}

                              />

                            </Badge>

                          ))}

                        </div>

                        <Button

                          variant="link"

                          size="sm"

                          className="p-0 mt-1 text-danger"

                          onClick={() => setSelectedLocations([])}

                        >

                          Clear all

                        </Button>

                      </div>

                    )}

                  </Accordion.Body>

                </Accordion.Item>



                {/* Salary Range Filter */}

                <Accordion.Item eventKey="3" className="border-0 mb-3">

                  <Accordion.Header className="p-0 border-0 bg-light rounded-3">

                    <span className="fw-medium d-flex align-items-center">

                      <CashStack className="me-2 text-primary" size={16} />

                      Salary Range

                    </span>

                  </Accordion.Header>

                  <Accordion.Body className="px-0 pt-3 pb-3">

                    <div className="d-flex justify-content-between mb-2 small">

                      <span>₹{salaryRange[0].toLocaleString()}</span>

                      <span>₹{salaryRange[1].toLocaleString()}</span>

                    </div>

                    <div className="px-2 mb-3">

                      <input

                        type="range"

                        className="form-range"

                        min="0"

                        max="100000000"

                        step="5000"

                        value={salaryRange[1]}

                        onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value)])}

                        style={{ width: '100%' }}

                      />

                    </div>

                    <div className="d-flex gap-2">

                      <Form.Control

                        type="number"

                        placeholder="Min"

                        value={salaryRange[0]}

                        onChange={(e) => setSalaryRange([parseInt(e.target.value) || 0, salaryRange[1]])}

                        min={0}

                        className="py-1 small"

                      />

                      <span className="align-self-center">to</span>

                      <Form.Control

                        type="number"

                        placeholder="Max"

                        value={salaryRange[1]}

                        onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value) || 100000])}

                        max={100000}

                        className="py-1 small"

                      />

                    </div>

                  </Accordion.Body>

                </Accordion.Item>



                {/* Skills Filter */}

                <Accordion.Item eventKey="4" className="border-0 mb-3">

                  <Accordion.Header className="p-0 border-0 bg-light rounded-3">

                    <span className="fw-medium d-flex align-items-center">

                      <Layers className="me-2 text-primary" size={16} />

                      Skills

                    </span>

                  </Accordion.Header>

                  <Accordion.Body className="px-0 pt-3 pb-3">

                    <Dropdown>

                      <Dropdown.Toggle

                        variant="outline-secondary"

                        size="sm"

                        className="w-100 text-start d-flex justify-content-between align-items-center"

                      >

                        <span>

                          {selectedSkills.length > 0 ? `${selectedSkills.length} selected` : 'Select skills'}

                        </span>

                      </Dropdown.Toggle>

                      <Dropdown.Menu className="p-3 w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>

                        <div className="mb-2">

                          <InputGroup size="sm">

                            <InputGroup.Text>

                              <Search size={14} />

                            </InputGroup.Text>

                            <Form.Control

                              placeholder="Search skills..."

                              onChange={(e) => {

                                const search = e.target.value.toLowerCase();

                                const filtered = allSkills.filter(skill =>

                                  skill.toLowerCase().includes(search)

                                );

                                // Implement search functionality if needed

                              }}

                            />

                          </InputGroup>

                        </div>

                        <div className="d-flex flex-column gap-2">

                          {allSkills.map(skill => (

                            <Form.Check

                              key={skill}

                              type="checkbox"

                              id={`skill-${skill}`}

                              label={skill}

                              checked={selectedSkills.includes(skill)}

                              onChange={(e) => {

                                if (e.target.checked) {

                                  setSelectedSkills([...selectedSkills, skill]);

                                } else {

                                  setSelectedSkills(selectedSkills.filter(s => s !== skill));

                                }

                              }}

                              className="mb-1"

                            />

                          ))}

                        </div>

                      </Dropdown.Menu>

                    </Dropdown>

                    {selectedSkills.length > 0 && (

                      <div className="mt-3">

                        <div className="d-flex flex-wrap gap-2">

                          {selectedSkills.map(skill => (

                            <Badge

                              key={skill}

                              bg="info"

                              pill

                              className="d-flex align-items-center"

                            >

                              {skill}

                              <X

                                size={14}

                                className="ms-1 cursor-pointer"

                                onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}

                              />

                            </Badge>

                          ))}

                        </div>

                        <Button

                          variant="link"

                          size="sm"

                          className="p-0 mt-1 text-danger"

                          onClick={() => setSelectedSkills([])}

                        >

                          Clear all

                        </Button>

                      </div>

                    )}

                  </Accordion.Body>

                </Accordion.Item>



                {/* Company Filter */}

                <Accordion.Item eventKey="5" className="border-0">

                  <Accordion.Header className="p-0 border-0 bg-light rounded-3">

                    <span className="fw-medium d-flex align-items-center">

                      <Building className="me-2 text-primary" size={16} />

                      Company

                    </span>

                  </Accordion.Header>

                  <Accordion.Body className="px-0 pt-3 pb-3">

                    <InputGroup className="mb-3">

                      <InputGroup.Text className="bg-light">

                        <Search size={14} />

                      </InputGroup.Text>

                      <Form.Control

                        placeholder="Search companies"

                        value={companySearch}

                        onChange={(e) => setCompanySearch(e.target.value)}

                        className="py-1"

                      />

                      {companySearch && (

                        <Button

                          variant="link"

                          onClick={() => setCompanySearch('')}

                          className="text-secondary"

                        >

                          <X size={18} />

                        </Button>

                      )}
                    </InputGroup>

                    {companySearch && allCompanies.filter(c =>

                      c.toLowerCase().includes(companySearch.toLowerCase())

                    ).length > 0 && (

                        <div className="mt-2">

                          <p className="small text-muted mb-2">Matching companies:</p>

                          <div className="d-flex flex-wrap gap-2">

                            {allCompanies.filter(c =>

                              c.toLowerCase().includes(companySearch.toLowerCase())

                            ).map(company => (

                              <Badge

                                key={company}

                                bg="light"

                                text="dark"

                                className="cursor-pointer"

                                onClick={() => setCompanySearch(company)}

                              >

                                {company}

                              </Badge>

                            ))}

                          </div>

                        </div>

                      )}

                  </Accordion.Body>

                </Accordion.Item>

              </Accordion>

              <Button

                variant="outline-danger"

                size="sm"

                className="w-100 mt-3 d-flex align-items-center justify-content-center"

                onClick={() => {

                  setActiveFilter('all');

                  setSalaryRange([0, 100000]);

                  setSelectedLocations([]);

                  setSelectedSkills([]);

                  setCompanySearch('');

                  // Reset external job filters
                  setExternalSearchQuery('developer');
                  setExternalLocation('India');
                  setExternalJobType('all');

                }}

              >

                <X size={16} className="me-2" />

                Reset All Filters

              </Button>

            </Card.Body>

          </Card>

        </Col>



        {/* Jobs List */}

         <Col lg={9}>



          {/* Filter Summary */}

          {(activeFilter !== 'all' || selectedLocations.length > 0 || selectedSkills.length > 0 || companySearch || jobSearch) && (

            <div className="bg-white p-3 rounded-3 shadow-sm mb-4">

              <div className="d-flex flex-wrap align-items-center gap-2">

                <span className="small text-muted me-1">Filters:</span>

                {activeFilter !== 'all' && (

                  <Badge bg="primary" pill className="d-flex align-items-center">

                    {activeFilter === 'fulltime' ? 'Full-time' :

                      activeFilter === 'parttime' ? 'Part-time' :

                      activeFilter === 'internship' ? 'Internship' :

                      activeFilter === 'temporary' ? 'Temporary' :

                      activeFilter === 'contract' ? 'Contract' :

                      activeFilter === 'remote' ? 'Remote' : activeFilter}

                    <X

                      size={14}

                      className="ms-1 cursor-pointer"

                      onClick={() => setActiveFilter('all')}

                    />

                  </Badge>

                )}

                {selectedLocations.map(location => (

                  <Badge

                    key={location}

                    bg="light"

                    text="dark"

                    pill

                    className="d-flex align-items-center"

                  >

                    <GeoAlt size={12} className="me-1" />

                    {location}

                    <X

                      size={14}

                      className="ms-1 cursor-pointer"

                      onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== location))}

                    />

                  </Badge>

                ))}

                {selectedSkills.map(skill => (

                  <Badge

                    key={skill}

                    bg="info"

                    pill

                    className="d-flex align-items-center"

                  >

                    {skill}

                    <X

                      size={14}

                      className="ms-1 cursor-pointer"

                      onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}

                    />

                  </Badge>

                ))}

                {companySearch && (

                  <Badge

                    bg="light"

                    text="dark"

                    pill

                    className="d-flex align-items-center"

                  >

                    <Building size={12} className="me-1" />

                    {companySearch}

                    <X

                      size={14}

                      className="ms-1 cursor-pointer"

                      onClick={() => setCompanySearch('')}

                    />

                  </Badge>

                )}

                {jobSearch && (
                  <Badge
                    bg="light"
                    text="dark"
                    pill
                    className="d-flex align-items-center"
                  >
                    <Search size={12} className="me-1" />
                    {jobSearch}
                    <X
                      size={14}
                      className="ms-1 cursor-pointer"
                      onClick={() => setJobSearch('')}
                    />
                  </Badge>
                )}

                <Button

                  variant="link"

                  size="sm"

                  className="ms-auto small text-danger p-0"

                  onClick={() => {

                    setActiveFilter('all');

                    setSalaryRange([0, 100000]);

                    setSelectedLocations([]);

                    setSelectedSkills([]);

                    setCompanySearch('');

                  }}

                >

                  Clear all

                </Button>

              </div>

            </div>

          )}



          <Row className="g-4">

            {(loading || externalJobsLoading) && (

              <Col className="text-center py-5">

                <Spinner animation="border" variant="primary" size="lg" />

                <p className="mt-3 text-muted">Loading opportunities...</p>

              </Col>

            )}



            {(error || externalJobsError) && (

              <Col md={8} className="mx-auto">

                <Alert variant="danger" className="text-center rounded-3 shadow-sm">

                  <Alert.Heading>Something went wrong</Alert.Heading>

                  <p>{error || externalJobsError}</p>

                  <Button

                    variant="outline-danger"

                    onClick={() => {

                      fetchJobs();

                      fetchExternalJobs();

                    }}

                    className="rounded-pill px-4"

                  >

                    Retry

                  </Button>

                </Alert>

              </Col>

            )}



                         {!loading && !externalJobsLoading && !error && !externalJobsError && filteredJobs.length > 0 && (

              

              <>

                {filteredJobs.slice(0, currentPage * jobsPerPage).map((job) => {
                  // Check if user has already applied to this job
                  // appliedJobs may be an array of IDs (preferred) or objects with jobId (legacy) — handle both.
                  const hasApplied = Array.isArray(appliedJobs) && (
                    appliedJobs.includes(job._id) ||
                    appliedJobs.some(appliedJob => appliedJob.jobId === job._id)
                  );
                   return (

                    <div key={job._id} className="col-12 col-md-6 col-lg-4">

                      <div className="recent-card h-100 position-relative">

                        {job.isFeatured && (

                          <span className="position-absolute top-0 end-0 m-2 badge bg-warning text-dark d-flex align-items-center gap-1">

                            <i className="bi bi-star-fill"></i> Featured

                          </span>

                        )}

                        <div className="d-flex justify-content-between align-items-start mb-2">

                          <div className="me-2">

                            <div className="fw-semibold recent-title">{job.jobTitle}</div>

                            <div className="text-primary small fw-medium">{job.companyName}</div>

                            <div className="mt-1">

                              {!isAggregatorJob(job) && (
                                <span className="badge badge-sm bg-primary" style={{ fontSize: '0.65rem' }}>
                                  Website
                                </span>
                              )}

                            </div>

                          </div>

                        </div>

                        <div className="d-flex flex-wrap gap-2 mb-3">

                          <span className="badge rounded-pill bg-light text-muted d-flex align-items-center gap-1">

                            <i className="bi bi-briefcase"></i> {job.jobType}

                          </span>

                          <span className="badge rounded-pill bg-light text-muted d-flex align-items-center gap-1">

                            <i className="bi bi-geo-alt"></i> {job.location}

                          </span>

                          {job.applicationDeadline && (

                            <span className="badge rounded-pill bg-light text-muted d-flex align-items-center gap-1">

                              <i className="bi bi-clock"></i>

                              {new Date(job.applicationDeadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}

                            </span>

                          )}

                          {job.salary && (

                            <span className="badge rounded-pill bg-success-subtle text-success-emphasis d-flex align-items-center gap-1">

                              <i className="bi bi-cash-stack"></i> {job.salary}

                            </span>

                          )}

                        </div>

                        <div className="mt-auto d-flex justify-content-between align-items-center">

                          {/* View details (for both website and external) */}

                          <button onClick={() => handleViewDetails(job)} className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1">

                            View details <i className="bi bi-arrow-right"></i>

                          </button>

                          {/* Apply button */}

                          {isAggregatorJob(job) ? (

                            (() => {

                              const hasAppliedExternal = appliedExternalJobs.some(appliedJob => appliedJob.jobId === job._id);

                              return hasAppliedExternal ? (

                                <button className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1" disabled>

                                  <i className="bi bi-check-circle"></i> Applied

                                </button>

                              ) : profileProgress < 70 ? (

                                <button 

                                  onClick={() => setShowProfileCompletionModal(true)}

                                  className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"

                                  title="Complete your profile to apply for jobs"

                                >

                                  <i className="bi bi-box-arrow-up-right"></i> Apply

                                </button>

                              ) : (

                                <button
                                  onClick={() => handleExternalJobApply(job)}
                                  className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                                >
                                  <i className="bi bi-box-arrow-up-right"></i> Apply
                                </button>

                              );

                            })()

                          ) : (

                            hasApplied ? (

                              <button className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1" disabled>

                                <i className="bi bi-check-circle"></i> Applied

                              </button>

                            ) : profileProgress < 70 ? (

                              <button 

                                onClick={() => setShowProfileCompletionModal(true)}

                                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"

                                title="Complete your profile to apply for jobs"

                              >

                                <i className="bi bi-send"></i> Apply

                              </button>

                            ) : (

                              <button 
                                onClick={() => handleApplyClick(job)}
                                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1"
                              >
                                <i className="bi bi-send"></i> Apply
                              </button>
                            )

                          )}

                        </div>

                      </div>

                    </div>

                  );

                })}

              </>

            )}



            {!loading && !externalJobsLoading && !error && !externalJobsError && filteredJobs.length === 0 && (

              <Col className="text-center py-5">

                <div className="bg-primary bg-opacity-10 p-4 rounded-circle d-inline-block mb-3">

                  <Briefcase size={32} className="text-primary" />

                </div>

                <h5 className="mb-3">No jobs found</h5>

                <p className="text-muted mb-4">We couldn't find any opportunities matching your criteria</p>

                <Button

                  variant="outline-primary"

                  className="rounded-pill px-4"

                  onClick={() => {

                    setActiveFilter('all');

                    setSalaryRange([0, 100000]);

                    setSelectedLocations([]);

                    setSelectedSkills([]);

                    setCompanySearch('');

                  }}

                >

                  Reset filters

                </Button>

              </Col>

            )}

          </Row>



          {!loading && !externalJobsLoading && !error && !externalJobsError && filteredJobs.length > 0 && (

            <Row className="mt-4">

              <Col className="text-center">

                <div className="d-flex flex-column align-items-center">

                  <p className="text-muted mb-3">

                    Showing {Math.min(currentPage * jobsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs

                  </p>

                  {(currentPage * jobsPerPage < filteredJobs.length) && (

                    <Button 

                      variant="outline-primary" 

                      className="rounded-pill px-4"

                      onClick={loadMoreJobs}

                    >

                      Load More Opportunities

                    </Button>

                  )}

                </div>

              </Col>

            </Row>

          )}

        </Col>

      </Row>



      {/* Application Modal */}

      <Modal show={showApplyModal} onHide={() => setShowApplyModal(false)} size="lg" centered>

        <Modal.Header className="border-0 pb-0">

          <Modal.Title className="fw-bold">

            Apply for {selectedJob?.jobTitle}

          </Modal.Title>

          <Button

            variant="link"

            onClick={() => setShowApplyModal(false)}

            className="p-1 rounded-circle"

          >

            <X size={24} />

          </Button>

        </Modal.Header>



        <Modal.Body className="pt-0">

          {selectedJob && (

            <Card className="mb-4 border-0 bg-light">

              <Card.Body className="p-3">

                <Row>

                  <Col md={6}>

                    <p className="mb-2">

                      <GeoAlt className="me-2 text-muted" size={18} />

                      <span className="fw-medium">Location:</span> {selectedJob.location}

                    </p>

                  </Col>

                  <Col md={6}>

                    <p className="mb-2">

                      <Briefcase className="me-2 text-muted" size={18} />

                      <span className="fw-medium">Type:</span> {selectedJob.jobType}

                                       </p>

                    {selectedJob.salary && (

                      <p className="mb-2">

                        <CashStack className="me-2 text-muted" size={18} />

                        <span className="fw-medium">Salary:</span> {selectedJob.salary}

                      </p>

                    )}

                  </Col>               
                </Row>
              </Card.Body>
            </Card>
          )}



          {applicationMessage.message && (

            <Alert variant={applicationMessage.type} className="rounded-3">

              {applicationMessage.message}

            </Alert>

          )}



          <Form onSubmit={handleApplicationSubmit}>

            <Form.Group className="mb-4">

              <Form.Label className="d-flex align-items-center fw-medium">

                <Person className="me-2" size={18} />

                Full Name

              </Form.Label>

              <Form.Control

                type="text"

                name="userName"

                value={applicationData.userName}

                onChange={handleApplicationChange}

                placeholder="Your full name"

                required

                               className="py-2 rounded-3"

              />

            </Form.Group>



            <Form.Group className="mb-4">

              <Form.Label className="d-flex align-items-center fw-medium">

                <Envelope className="me-2" size={18} />

                Email Address

              </Form.Label>

              <Form.Control

                type="email"

                name="email"

                value={applicationData.email}

                onChange={handleApplicationChange}

                placeholder="Your email address"

                required

                className="py-2 rounded-3"

              />

            </Form.Group>



            <Form.Group className="mb-4">

              <Form.Label className="d-flex align-items-center fw-medium">

                <FileEarmark className="me-2" size={18} />

                Resume/CV

              </Form.Label>

              <Form.Control

                type="file"

                name="resume"

                onChange={handleApplicationChange}

                accept=".pdf,.doc,.docx"

                required

                className="py-2 rounded-3"

              />

              <Form.Text className="text-muted small">

                PDF, DOC, or DOCX files (Max 5MB)

              </Form.Text>

            </Form.Group>



            <div className="d-flex justify-content-end gap-3 pt-2">

              <Button

                variant="outline-secondary"

                onClick={() => setShowApplyModal(false)}

                disabled={isSubmitting}

                className="rounded-pill px-4"

              >

                Cancel

              </Button>

              <Button

                variant="primary"

                type="submit"

                disabled={isSubmitting}

                className="rounded-pill px-4"

              >

                {isSubmitting ? (

                  <>

                    <Spinner

                      as="span"

                      animation="border"

                      size="sm"

                      role="status"

                      aria-hidden="true"

                      className="me-2"

                    />

                    Submitting...

                  </>

                ) : (

                  <>

                    <Check2 className="me-1" />

                    Submit Application

                  </>

                )}

              </Button>

            </div>

          </Form>

        </Modal.Body>

      </Modal>



      {/* Profile Completion Modal */}

      <Modal show={showProfileCompletionModal} onHide={() => setShowProfileCompletionModal(false)} centered>

        <Modal.Header className="border-0 pb-0">

          <Modal.Title className="fw-bold text-warning">

            <Star className="me-2" />

            Complete Your Profile

          </Modal.Title>

          <Button

            variant="link"

            onClick={() => setShowProfileCompletionModal(false)}

            className="p-1 rounded-circle"

          >

            <X size={24} />

          </Button>

        </Modal.Header>



        <Modal.Body className="pt-0">

          <div className="text-center mb-4">

            <div className="mb-3">

              <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3">

                <Star className="text-warning" size={32} />

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

                <Check2 className="me-2" />

                What you need to complete:

              </h6>

              <ul className="list-unstyled mb-0 small">

                <li className="mb-2">

                  <Check2 className="me-2 text-success" size={14} />

                  Personal information (Name, Email, Phone)

                </li>

                <li className="mb-2">

                  <Check2 className="me-2 text-success" size={14} />

                  Professional title and objective

                </li>

                <li className="mb-2">

                  <Check2 className="me-2 text-success" size={14} />

                  Skills and certifications

                </li>

                <li className="mb-2">

                  <Check2 className="me-2 text-success" size={14} />

                  Work experience and education

                </li>

                <li className="mb-0">

                  <Check2 className="me-2 text-success" size={14} />

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

                setShowModeModal(true);

              }}

              className="rounded-pill px-4 d-flex align-items-center"

            >

              <Star className="me-2" size={16} />

              Complete Profile

            </Button>

          </div>

        </Modal.Body>

      </Modal>
    </Container>
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

// Add CSS styles to match candidate dashboard
const styles = `
  .recent-card {
    background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
    border: 1px solid rgba(13,110,253,0.08);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.06);
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }
  .recent-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.08);
    border-color: rgba(13,110,253,0.18);
  }
  .recent-title { 
    color: #2b2d42; 
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}



export default CampusJobDrives;