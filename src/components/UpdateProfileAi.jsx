import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaSave, FaCheck, FaPlus, FaCamera, FaHome } from "react-icons/fa";

import "jspdf-autotable";
import API, { API_BASE_URL } from "../api";

import { requireLogin } from '../utils/requireLogin';

// Institutions list
const INSTITUTIONS = [
  "University of Mumbai",
  "Maharashtra University of Health Sciences, Nashik",
  "Dr. Babasaheb Ambedkar Marathwada University, Aurangabad",
  "Dr. Babasaheb Ambedkar Technological University, Lonere",
  "Savitribai Phule Pune University",
  "Kavi Kulguru Kalidas Sanskrit Vishwavidyalaya, Ramtek",
  "Rashtrasant Tukadoji Maharaj Nagpur University, Nagpur",
  "Tata Institute of Fundamental Research, Mumbai (Deemed University – Govt.)",
  "Tata Institute of Fundamental Research, Mumbai",
  "MGM University",
  "MIT Art, Design and Technology University, Pune",
  "Dr. Babasaheb Ambedkar Marathwada University, Aurangabad",
  "Savitribai Phule Pune University",
  "University of Mumbai",
  "Maharashtra University of Health Sciences, Nashik",
  "Shivaji University, Kolhapur",
  "Rashtrasant Tukadoji Maharaj Nagpur University, Nagpur",
  "Symbiosis International (Deemed University), Pune",
  "Government Polytechnic, Nandurbar",
  "Sanjay Ghodawat Institute, Atigre, Kolhapur",
  "Snehal GNM Institute of Nursing, Pune",
  "Dr. D. Y. Patil B-School, Pune",
  "Samarth Educational Trust's Sawkar Pharmacy College, Satara",
  "Central India College of Pharmacy, Nagpur",
  "ISMS TBS, Pune",
  "Sevasadan School of Nursing, Gadhinglaj",
  "Dip Foundation's Sandip Polytechnic, Nashik",
  "Painganga Institute of Nursing, Yelgaon",
  "Others"
];

// Languages list
const LANGUAGES = ["Hindi", "English", "Others"];

const UpdateProfileAi = () => {
  
  const location = useLocation();
  const { parsedData: rawParsedData, resumeFile: uploadedResume } = location.state || {};
  const parsedData = rawParsedData?.data || rawParsedData;
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    requireLogin(navigate);
  }, [navigate]);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    // Personal Info
    name: "",
    title: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    linkedin: "",
    languages: [],
    
    // Professional Info
    objective: "",
    experience: 0,
    jobType: "",
    workMode: "",
    expectedSalary: "",
    noticePeriod: "",

    companies: [
      {
        name: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        responsibilities: "",
        achievements: "",
        currentlyWorking: false
      }
    ],
    education: [
      {
        degree: "",
        institute: "",
        customInstitute: "",
        startDate: "",
        endDate: "",
        currentlyStudying: false
      }
    ],
    skills: [],
    certifications: [],
    // ...parsedData 
  });
  // const updatedLanguages = [...formData.languages];
  useEffect(() => {
  if (uploadedResume) {
    setResumeFile(uploadedResume);
    setResumeFileName(uploadedResume.name);
    setResumeExistingUrl(URL.createObjectURL(uploadedResume));
  }

  if (parsedData) {
    const parsedLanguages = parsedData.languages || [];

    // Copy existing languages
    const updatedLanguages = [...(formData.languages || [])];
    
    parsedLanguages.forEach(lang => {
      if (!updatedLanguages.includes(lang)) {
        updatedLanguages.push(lang);
      }
    });
    // ---------- COMPANIES (EXPERIENCE) FIX ----------
      let updatedCompanies = parsedData.companies || [];

      if (parsedData.companies) {
        updatedCompanies = parsedData.companies.map((comp) => {
          // Check if endDate is missing, empty, or "Present"
          const isEndDateMissing =
            !comp.endDate ||
            comp.endDate.trim() === "" ||
            comp.endDate.toLowerCase() === "present";
          // console.log("Date",comp.endDate,"currently",currentlyWorking)
          return {
            ...comp,
            currentlyWorking: isEndDateMissing,
            // If currently working, ensure endDate is empty
            endDate: isEndDateMissing ? "" : comp.endDate,
          };
        });
      }

    // ---------- EDUCATION FIX ----------
    let updatedEducation = parsedData.education || [];
    
    if (parsedData.education) {
      updatedEducation = parsedData.education.map(edu => {
        const instituteName = edu.institute?.trim() || "";
        const isEndDateMissing = !edu.endDate || edu.endDate.trim() === "" || edu.endDate.toLowerCase() === "present";
        if (INSTITUTIONS.includes(instituteName)) {
          return {
            ...edu,
            customInstitute: ""
          };
        }

        return {
          ...edu,
          institute: "Others",
          customInstitute: instituteName,
          currentlyStudying: isEndDateMissing, 
          // If currently studying, ensure endDate is empty string so it doesn't show a date
          endDate: isEndDateMissing ? "" : edu.endDate
        };
      });
    }

    // ---------- FINAL UPDATE ----------
    setFormData(prev => ({
      ...prev,
      ...parsedData,
      languages: updatedLanguages,
      education: updatedEducation,
      companies: updatedCompanies,
    }));
  }
}, [parsedData, uploadedResume]);
  console.log("formDatw",formData)
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentCert, setCurrentCert] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [currentCustomLanguage, setCurrentCustomLanguage] = useState("");
  const [errors, setErrors] = useState({});
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeExistingUrl, setResumeExistingUrl] = useState(null);
  const [resumeObjectUrl, setResumeObjectUrl] = useState(null);
  const [profilePictureRemoved, setProfilePictureRemoved] = useState(false);
  const [resumeRemoved, setResumeRemoved] = useState(false);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [resumeViewerUrl, setResumeViewerUrl] = useState(null);
  
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/profile/draft", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { _id, __v, isDraft, createdAt, updatedAt, ...profileData } = res.data;
        // Ensure arrays are properly initialized
        const sanitizedData = {
          ...profileData,
          languages: profileData.languages || [],
          skills: profileData.skills || [],
          certifications: profileData.certifications || [],
          companies: profileData.companies || [],
          education: profileData.education || []
        };
        // setFormData(sanitizedData);
        // If an avatarUrl exists in draft, show it in the preview
        if (sanitizedData.avatarUrl && !profilePictureRemoved) {
          setProfilePicturePreview(`${API_BASE_URL}${sanitizedData.avatarUrl}`);
        }
        // If a resumeUrl exists in draft, show it as existing
        if (sanitizedData.resumeUrl && sanitizedData.resumeUrl.trim() !== '' && !resumeRemoved) {
          setResumeExistingUrl(`${API_BASE_URL}${sanitizedData.resumeUrl}`);
          try {
            const nameFromPath = sanitizedData.resumeUrl.split('/').pop();
            if (nameFromPath) setResumeFileName(nameFromPath);
          } catch (_) { /* ignore */ }
        }
      } catch (err) {
        console.log("No draft found or error fetching:", err?.response?.data || err.message);
      }
    };

    fetchDraft();
  }, [profilePictureRemoved, resumeRemoved]);

  useEffect(() => {
    console.log("Current form data:", formData);
  }, [formData]);
  
  // Effect to sync resume state with formData
  useEffect(() => {
    // If formData has resumeUrl but no resume file, ensure the UI shows the existing resume
    if (formData.resumeUrl && !resumeFile && !resumeExistingUrl && !resumeRemoved) {
      setResumeExistingUrl(`${API_BASE_URL}${formData.resumeUrl}`);
      try {
        const nameFromPath = formData.resumeUrl.split('/').pop();
        if (nameFromPath) setResumeFileName(nameFromPath);
      } catch (_) { /* ignore */ }
    }
  }, [formData.resumeUrl, resumeFile, resumeExistingUrl, resumeRemoved]);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      if (resumeObjectUrl) {
        URL.revokeObjectURL(resumeObjectUrl);
      }
    };
  }, [resumeObjectUrl]);

  // Cleanup effect for resume viewer modal
  useEffect(() => {
    return () => {
      setShowResumeViewer(false);
      setResumeViewerUrl(null);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // setUser(res.data.user);
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };

    fetchUser();
  }, []);
   
  const calculateProgress = () => {
    let totalFields = 0;
    let filledFields = 0;

    const requiredFields = [
      "name", "title", "email", "phone", "dob", "gender",
      "address", "city", "state", "country", "zip", "linkedin",
      "objective", "jobType", "workMode", "expectedSalary", "noticePeriod"
    ];

    totalFields += requiredFields.length;
    filledFields += requiredFields.filter((key) => formData[key]?.trim() !== "").length;

    // Companies (count each property in each company)
    (formData.companies || [])
      .filter(Boolean) // prevents null values
      .forEach(company => {
        totalFields += 6;
        if (company?.name) filledFields++;
        if (company?.position) filledFields++;
        if (company?.location) filledFields++;
        if (company?.startDate) filledFields++;
        if (company?.endDate) filledFields++;
        if (company?.responsibilities) filledFields++;
      });

    // Education
    (formData.education || [])
      .filter(Boolean)
      .forEach(edu => {
        totalFields += 4;
        if (edu?.degree) filledFields++;
        if (edu?.institute) filledFields++;
        if (edu?.startDate) filledFields++;
        if (edu?.endDate || edu?.currentlyStudying) filledFields++;
      });

    // Skills and Certifications
    totalFields += 2;
    if (formData.skills && formData.skills.length > 0) filledFields++;
    if (formData.certifications && formData.certifications.length > 0) filledFields++;

    const percentage = Math.floor((filledFields / totalFields) * 100);
    setProgress(percentage > 100 ? 100 : percentage);
  };


  useEffect(() => {
    calculateProgress();
  }, [formData]);

  // Fallback: if there is no draft avatar, try to load from final profile
  useEffect(() => {
    const loadFinalMediaIfMissing = async () => {
      try {
        // Only load from final if we don't have any media loaded yet and user hasn't removed them
        if (profilePicturePreview || profilePictureRemoved) return;
        if (resumeExistingUrl || resumeRemoved) return;

        const token = localStorage.getItem("token");
        const finalRes = await API.get("/api/profile/final", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profilePicturePreview && !profilePictureRemoved && finalRes?.data?.avatarUrl) {
          setProfilePicturePreview(`${API_BASE_URL}${finalRes.data.avatarUrl}`);
        }

        if (!resumeExistingUrl && !resumeRemoved && finalRes?.data?.resumeUrl && finalRes.data.resumeUrl.trim() !== '') {
          setResumeExistingUrl(`${API_BASE_URL}${finalRes.data.resumeUrl}`);
          try {
            const nameFromPath = finalRes.data.resumeUrl.split('/').pop();
            if (nameFromPath) setResumeFileName(nameFromPath);
          } catch (_) { /* ignore */ }
        }
      } catch (_) {
        // ignore if final not available
      }
    };
    loadFinalMediaIfMissing();
  }, [profilePicturePreview, resumeExistingUrl, profilePictureRemoved, resumeRemoved]);

  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Work Experience" },
    { number: 3, title: "Education" },
    { number: 4, title: "Skills & Preferences" },
    { number: 5, title: "Final Review" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert experience to number if it's the experience field
    const finalValue = name === 'experience' ? parseInt(value) || value : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    console.log(`Updating ${name} to:`, finalValue); // Debug log
  };
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
        setProfilePictureRemoved(false);
        setFormData(prev => ({ ...prev, profilePicture: file, avatarUrl: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicturePreview(null);
    setProfilePictureRemoved(true);
    setFormData(prev => ({ ...prev, profilePicture: null, avatarUrl: null }));

    console.log("Profile picture removed - State cleared");
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file only.');
        // Clear the input
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Resume file size should be less than 5MB.');
        // Clear the input
        e.target.value = '';
        return;
      }

      console.log("Resume file selected:", file);
      console.log("File type:", file.type);
      console.log("File size:", file.size);

      // Clean up previous object URL if it exists
      if (resumeObjectUrl) {
        URL.revokeObjectURL(resumeObjectUrl);
      }

      setResumeFile(file);
      setResumeFileName(file.name);
      setResumeRemoved(false);
      setFormData(prev => ({ ...prev, resume: file, resumeUrl: null }));
      setResumeExistingUrl(null);

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setResumeObjectUrl(objectUrl);

      console.log("Resume added to formData:", file);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeFileName("");
    setResumeExistingUrl(null);
    setResumeRemoved(true);

    // Clean up object URL if it exists
    if (resumeObjectUrl) {
      URL.revokeObjectURL(resumeObjectUrl);
      setResumeObjectUrl(null);
    }

    setFormData(prev => ({
      ...prev,
      resume: null,
      resumeUrl: null
    }));

    // Clear the file input
    const fileInput = document.getElementById('resumeInput');
    if (fileInput) {
      fileInput.value = '';
    }

    console.log("Resume removed - State cleared");
  };

  // Function to reset media removal flags (useful for testing or if user wants to restore)
  const resetMediaRemovalFlags = () => {
    setProfilePictureRemoved(false);
    setResumeRemoved(false);
    console.log("Media removal flags reset");
  };

  // Function to handle resume viewing with multiple approaches
  const handleViewResume = () => {
    const resumeUrl = resumeExistingUrl || resumeObjectUrl;

    if (!resumeUrl) {
      alert('No resume available to view');
      return;
    }

    // Check if it's a PDF file (better viewing support)
    const isPDF = resumeFileName.toLowerCase().endsWith('.pdf') ||
      resumeUrl.toLowerCase().includes('.pdf') ||
      (resumeFile && resumeFile.type === 'application/pdf');

    // Try multiple approaches to view the resume
    try {
      if (isPDF) {
        // For PDFs, try Google Docs viewer as a fallback
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`;

        // Approach 1: Try to open in new tab
        const newWindow = window.open(resumeUrl, '_blank');

        if (!newWindow) {
          // Approach 2: If popup blocked, show in iframe modal with Google Docs viewer
          setResumeViewerUrl(googleDocsUrl);
          setShowResumeViewer(true);
        } else {
          // Check if the window was actually opened
          setTimeout(() => {
            if (newWindow.closed) {
              // Approach 3: If still blocked, show in iframe modal
              setResumeViewerUrl(googleDocsUrl);
              setShowResumeViewer(true);
            }
          }, 100);
        }
      } else {
        // For non-PDF files, try direct opening first
        const newWindow = window.open(resumeUrl, '_blank');

        if (!newWindow) {
          // If popup blocked, show in iframe modal
          setResumeViewerUrl(resumeUrl);
          setShowResumeViewer(true);
        } else {
          // Check if the window was actually opened
          setTimeout(() => {
            if (newWindow.closed) {
              setResumeViewerUrl(resumeUrl);
              setShowResumeViewer(true);
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error opening resume:', error);
      // Fallback to iframe modal
      if (isPDF) {
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`;
        setResumeViewerUrl(googleDocsUrl);
      } else {
        setResumeViewerUrl(resumeUrl);
      }
      setShowResumeViewer(true);
    }
  };

  const handleCompanyChange = (index, field, value) => {
    const updatedCompanies = [...formData.companies];
    updatedCompanies[index][field] = value;
    setFormData(prev => ({ ...prev, companies: updatedCompanies }));
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => {
      const updatedEducation = [...(prev.education || [])];

      // Ensure the item exists at the index
      if (!updatedEducation[index]) {
        updatedEducation[index] = {
          degree: "",
          institute: "",
          customInstitute: "",
          startDate: "",
          endDate: "",
          currentlyStudying: false,
        };
      }

      // Update the field
      updatedEducation[index][field] = value;

      return {
        ...prev,
        education: updatedEducation
      };
    });
  };


  const addCompany = () => {
    setFormData(prev => ({
      ...prev,
      companies: [...prev.companies, {
        name: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        currentlyWorking: false,
        responsibilities: "",
        achievements: ""
      }]
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: "",
        institute: "",
        customInstitute: "",
        startDate: "",
        endDate: "",
        currentlyStudying: false
      }]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name) newErrors.name = "Name is required";
      if (!formData.title) newErrors.title = "Title is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.phone) newErrors.phone = "Phone is required";
      else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone must be exactly 10 digits";
      if (!formData.state) newErrors.state = "State is required";
      if (!formData.country) newErrors.country = "Country is required";
      if (!formData.zip) newErrors.zip = "ZIP code is required";
    }

    if (step === 3) {
      (formData.education || []).forEach((edu, idx) => {
        if (!edu.degree) {
          newErrors.education = newErrors.education || [];
          newErrors.education[idx] = { ...newErrors.education[idx], degree: "Degree is required" };
        }
        if (!edu.institute) {
          newErrors.education = newErrors.education || [];
          newErrors.education[idx] = { ...newErrors.education[idx], institute: "Institute is required" };
        }
        if (edu.institute === "Others" && !edu.customInstitute) {
          newErrors.education = newErrors.education || [];
          newErrors.education[idx] = { ...newErrors.education[idx], customInstitute: "Please enter your institution name" };
        }
      });
    }

    if (step === 4) {
      if (!formData.jobType) newErrors.jobType = "Job type is required";
      if (!formData.workMode) newErrors.workMode = "Work mode is required";
      if (!formData.skills || formData.skills.length === 0) newErrors.skills = "At least one skill is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    const isValid = validateStep(step);
    console.log(`Step ${step} validation:`, isValid, errors);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to save draft");
        return;
      }

      // Use FormData for file upload in draft as well
      const data = new FormData();

      // Debug logging for draft
      console.log("Draft FormData being sent:", formData);
      console.log("Draft Resume file:", formData.resume);
      console.log("Draft Profile picture:", formData.profilePicture);

      Object.entries(formData).forEach(([key, value]) => {
        if ((key === 'profilePicture' || key === 'resume') && value) {
          console.log(`Draft: Appending file ${key}:`, value);
          data.append(key, value);
        } else if (Array.isArray(value)) {
          data.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          data.append(key, value);
        }
      });

      // Safety check: ensure resume file is included if it exists
      if (resumeFile && !data.has('resume')) {
        console.log("Draft: Adding resume file as fallback:", resumeFile);
        data.append('resume', resumeFile);
      }

      // Add flags for removed media
      if (profilePictureRemoved) {
        data.append('profilePictureRemoved', 'true');
      }
      if (resumeRemoved) {
        data.append('resumeRemoved', 'true');
      }

      // Log FormData contents for draft
      for (let [key, value] of data.entries()) {
        console.log(`Draft FormData entry - ${key}:`, value);
      }

      console.log("Submitting draft data:", formData);
      const response = await API.post("/api/profile/save-draft", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let the browser set the Content-Type for FormData
        },
      });
      alert("Draft saved successfully!");
    } catch (err) {
      console.error("Error saving draft:", err?.response?.data || err.message);
      console.error("Full draft error object:", err);
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || "Failed to save draft";
      alert(`Error: ${errorMessage}`);
    }
  };

  const addSkill = () => {
    if (currentSkill.trim()) {
      const updatedSkills = [...formData.skills, currentSkill.trim()];
      setFormData(prev => ({
        ...prev,
        skills: updatedSkills,
      }));
      setCurrentSkill("");
    }
  };

  const addCertification = () => {
    if (currentCert.trim()) {
      const updatedCerts = [...formData.certifications, currentCert.trim()];
      setFormData(prev => ({
        ...prev,
        certifications: updatedCerts,
      }));
      setCurrentCert("");
    }
  };

  const addLanguage = () => {
    if (currentLanguage === "Others" && currentCustomLanguage.trim()) {
      // Add custom language
      if (!(formData.languages || []).includes(currentCustomLanguage.trim())) {
        const updatedLanguages = [...(formData.languages || []), currentCustomLanguage.trim()];
        setFormData(prev => ({
          ...prev,
          languages: updatedLanguages,
        }));
        setCurrentCustomLanguage("");
        setCurrentLanguage("");
      }
    } else if (currentLanguage && currentLanguage !== "Others" && !(formData.languages || []).includes(currentLanguage)) {
      // Add predefined language
      const updatedLanguages = [...(formData.languages || []), currentLanguage];
      setFormData(prev => ({
        ...prev,
        languages: updatedLanguages,
      }));
      setCurrentLanguage("");
    }
  };

  const removeLanguage = (languageToRemove) => {
    const updatedLanguages = (formData.languages || []).filter(lang => lang !== languageToRemove);
    setFormData(prev => ({
      ...prev,
      languages: updatedLanguages,
    }));
  };

  const handleSubmit = async () => {
    if (validateStep(5)) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login to submit profile");
          return;
        }

        // Use FormData for file upload
        const data = new FormData();

        // Debug logging
        console.log("FormData being sent:", formData);
        console.log("Resume file:", formData.resume);
        console.log("Profile picture:", formData.profilePicture);

        // Append all fields from formData
        Object.entries(formData).forEach(([key, value]) => {
          if ((key === 'profilePicture' || key === 'resume') && value) {
            console.log(`Appending file ${key}:`, value);
            data.append(key, value);
          } else if (Array.isArray(value)) {
            data.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            data.append(key, value);
          }
        });

        // Safety check: ensure resume file is included if it exists
        if (resumeFile && !data.has('resume')) {
          console.log("Adding resume file as fallback:", resumeFile);
          data.append('resume', resumeFile);
        }

        // Add flags for removed media
        if (profilePictureRemoved) {
          data.append('profilePictureRemoved', 'true');
        }
        if (resumeRemoved) {
          data.append('resumeRemoved', 'true');
        }

        // Log FormData contents
        for (let [key, value] of data.entries()) {
          console.log(`FormData entry - ${key}:`, value);
        }

        const response = await API.post("/api/profile/submit", data, {
          headers: {
            Authorization: `Bearer ${token}`,
            // Let the browser set the Content-Type for FormData
          },
        });
        alert("Profile submitted successfully!");

        // Always redirect to candidate dashboard after profile completion
        // Career dashboard access should only be available after payment
        if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/dashboard/candidate");
      }
      } catch (err) {
        console.error("Error submitting profile:", err?.response?.data || err.message);
        console.error("Full error object:", err);
        const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || "Failed to submit profile";
        alert(`Error: ${errorMessage}`);
      }
    }
  };


  const renderStep = () => (
    <div className="card mb-4 border-0 shadow-sm">
      <div className="card-body">
        {step === 1 && (
          <>
            <h4 className="mb-4">Personal Information</h4>

            {/* Profile Picture Upload */}
            <div className="mb-4 text-center">
              <div className="profile-picture-container position-relative d-inline-block">
                {profilePicturePreview ? (
                  <div className="position-relative">
                    <img
                      src={profilePicturePreview}
                      alt="Profile Preview"
                      className="profile-picture-preview rounded-circle"
                      style={{
                        width: "clamp(100px, 25vw, 120px)",
                        height: "clamp(100px, 25vw, 120px)",
                        objectFit: "cover",
                        border: "3px solid #fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                      }}
                    />
                    {/* Black oval overlay with camera icon */}
                    <div className="position-absolute bottom-0 end-0">
                      <label
                        htmlFor="profilePictureInput"
                        className="btn btn-dark btn-sm rounded-circle touch-target"
                        style={{
                          width: "clamp(24px, 5vw, 32px)",
                          height: "clamp(24px, 5vw, 32px)",
                          minWidth: "24px",
                          minHeight: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          border: "2px solid #fff",
                          backgroundColor: "#000",
                          opacity: "0.8",
                          borderRadius: "50%"
                        }}
                      >
                        <FaCamera size="clamp(6px, 1.5vw, 10px)" className="text-white" />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="position-relative">
                    <div className="profile-picture-placeholder rounded-circle d-flex align-items-center justify-content-center bg-light"
                      style={{
                        width: "clamp(100px, 25vw, 120px)",
                        height: "clamp(100px, 25vw, 120px)",
                        border: "2px dashed #dee2e6",
                        transition: "all 0.3s ease"
                      }}>
                      <FaCamera size="clamp(24px, 6vw, 30px)" className="text-muted" />
                    </div>
                    <div className="position-absolute bottom-0 end-0">
                      <label
                        htmlFor="profilePictureInput"
                        className="btn btn-primary btn-sm rounded-circle touch-target"
                        style={{
                          width: "clamp(24px, 5vw, 32px)",
                          height: "clamp(24px, 5vw, 32px)",
                          minWidth: "24px",
                          minHeight: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          border: "2px solid #fff",
                          borderRadius: "50%",
                          backgroundColor: "#3a73ab",
                          borderColor: "#2c3e50"
                        }}
                      >
                        <FaCamera size="clamp(6px, 1.5vw, 10px)" />
                      </label>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  id="profilePictureInput"
                  className="d-none"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                />
              </div>
              {profilePicturePreview && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm touch-target"
                    onClick={removeProfilePicture}
                    style={{
                      minHeight: "44px",
                      padding: "0.5rem 1rem",
                      fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)"
                    }}
                  >
                    Remove Photo
                  </button>
                </div>
              )}
              <div className="mt-3">
                <small className="text-muted" style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>
                  Upload your profile picture (Max 5MB)
                </small>
              </div>
            </div>



            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Full Name *</label>
                <input type="text" className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  name="name" value={formData.name} onChange={handleChange} />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Email *</label>
                <input type="email" className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  name="email" value={formData.email} onChange={handleChange} />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Title *</label>
              <input type="text" className={`form-control ${errors.title ? "is-invalid" : ""}`}
                name="title" value={formData.title} onChange={handleChange} />
              {errors.title && <div className="invalid-feedback">{errors.title}</div>}
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-control"
                  name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Gender</label>
                <select className="form-select" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Phone *</label>
                <div className="input-group">
                  <span className="input-group-text">+91</span>
                  <input
                    type="tel"
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength="10"
                    placeholder="Enter 10 digit number"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                <small className="form-text text-muted">Enter 10 digit mobile number (without +91)</small>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Address</label>
              <input type="text" className="form-control"
                name="address" value={formData.address} onChange={handleChange} />
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <input type="text" className="form-control"
                  name="city" value={formData.city} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">State *</label>
                <input type="text" className={`form-control ${errors.state ? "is-invalid" : ""}`}
                  name="state" value={formData.state} onChange={handleChange} />
                {errors.state && <div className="invalid-feedback">{errors.state}</div>}
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">ZIP Code *</label>
                <input type="text" className={`form-control ${errors.zip ? "is-invalid" : ""}`}
                  name="zip" value={formData.zip} onChange={handleChange} />
                {errors.zip && <div className="invalid-feedback">{errors.zip}</div>}
              </div>
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Country *</label>
              <input type="text" className={`form-control ${errors.country ? "is-invalid" : ""}`}
                name="country" value={formData.country} onChange={handleChange} />
              {errors.country && <div className="invalid-feedback">{errors.country}</div>}
            </div>
            {/* Resume Upload */}
            <div className="mb-4 text-center">
              <h6 className="mb-3" style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}>Resume Upload</h6>
              <div className="resume-upload-container">
                {resumeFileName && resumeFileName.trim() !== "" ? (
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <i className="bi bi-file-earmark-text text-primary me-2" style={{ fontSize: 'clamp(20px, 5vw, 24px)' }}></i>
                      <span className="text-success fw-bold" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>{resumeFileName}</span>
                    </div>
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm touch-target"
                        onClick={removeResume}
                        style={{
                          minHeight: "44px",
                          padding: "0.5rem 1rem",
                          fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)"
                        }}
                      >
                        Remove Resume
                      </button>
                      {(resumeExistingUrl || resumeObjectUrl) && (
                        <>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm touch-target"
                            style={{
                              minHeight: "44px",
                              padding: "0.5rem 1rem",
                              fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)"
                            }}
                            onClick={handleViewResume}
                          >
                            View Resume
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-secondary rounded p-3"
                    style={{
                      borderStyle: 'dashed',
                      padding: "clamp(1rem, 3vw, 1.5rem) !important",
                      minHeight: "120px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <i className="bi bi-cloud-upload text-muted mb-3" style={{ fontSize: 'clamp(28px, 7vw, 32px)' }}></i>
                    <div className="mb-3">
                      <small className="text-muted" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>Upload your resume</small>
                    </div>
                    <label
                      htmlFor="resumeInput"
                      className="btn btn-outline-primary btn-sm touch-target"
                      style={{
                        minHeight: "44px",
                        padding: "0.5rem 1rem",
                        fontSize: "clamp(0.8rem, 2.5vw, 0.875rem)"
                      }}
                    >
                      Choose File
                    </label>
                    <input
                      type="file"
                      id="resumeInput"
                      className="d-none"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                    />
                  </div>
                )}
                <div className="mt-3">
                  <small className="text-muted" style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>
                    Supported formats: PDF, DOC, DOCX (Max 5MB)
                  </small>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">LinkedIn Profile</label>
              <input type="url" className="form-control"
                name="linkedin" value={formData.linkedin} onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile" />
            </div>

            <div className="mb-3">
              <label className="form-label">Professional Summary</label>
              <textarea className="form-control" rows="4"
                name="objective" value={formData.objective} onChange={handleChange}
                placeholder="Briefly describe your professional background and career objectives" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h4 className="mb-4">Work Experience</h4>
            {(formData.companies || []).map((company, idx) => {
              const currentDate = new Date();
              const startDate = new Date(company.startDate);
              const endDate = company.endDate ? new Date(company.endDate) : null;

              const isStartDateInvalid = startDate > currentDate;
              const isEndDateInvalid = !company.currentlyWorking && endDate && startDate && endDate < startDate;

              return (
                <div key={idx} className="mb-4 border rounded p-3">
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Company Name</label>
                      <input type="text" className="form-control"
                        value={company.name}
                        onChange={(e) => handleCompanyChange(idx, "name", e.target.value)} />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Job Position</label>
                      <input type="text" className="form-control"
                        value={company.position}
                        onChange={(e) => handleCompanyChange(idx, "position", e.target.value)} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Location</label>
                      <input type="text" className="form-control"
                        value={company.location}
                        onChange={(e) => handleCompanyChange(idx, "location", e.target.value)} />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="month"
                        className={`form-control ${isStartDateInvalid ? 'is-invalid' : ''}`}
                        value={company.startDate}
                        onChange={(e) => handleCompanyChange(idx, "startDate", e.target.value)}
                      />
                      {isStartDateInvalid && (
                        <div className="invalid-feedback">
                          Start date cannot be in the future.
                        </div>
                      )}
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="month"
                        className={`form-control ${isEndDateInvalid ? 'is-invalid' : ''}`}
                        value={company.endDate}
                        onChange={(e) => handleCompanyChange(idx, "endDate", e.target.value)}
                        disabled={company.currentlyWorking}
                      />

                    </div>
                    <div className="col-md-6 mb-3 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={company.currentlyWorking || false}
                          onChange={(e) =>
                            handleCompanyChange(idx, "currentlyWorking", e.target.checked)
                          }
                        />
                        <label className="form-check-label">Currently Working</label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Responsibilities</label>
                    <textarea className="form-control" rows="3"
                      value={company.responsibilities}
                      onChange={(e) => handleCompanyChange(idx, "responsibilities", e.target.value)}
                      placeholder="Describe your key responsibilities in this role" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Key Achievements</label>
                    <textarea className="form-control" rows="2"
                      value={company.achievements}
                      onChange={(e) => handleCompanyChange(idx, "achievements", e.target.value)}
                      placeholder="List any significant achievements or accomplishments" />
                  </div>
                </div>
              );
            })}

            <button type="button" className="btn btn-outline-primary" onClick={addCompany}>
              <FaPlus className="me-1" /> Add Another Position
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h4 className="mb-4">Education</h4>

            {((formData.education && formData.education.length === 0) ? [{
              degree: "",
              institute: "",
              customInstitute: "",
              startDate: "",
              endDate: "",
              currentlyStudying: false
            }] : (formData.education || []))
              .filter(Boolean)
              .map((edu, idx) => {
                const currentDate = new Date();
                const startDate = new Date(edu.startDate);
                const endDate = edu.endDate ? new Date(edu.endDate) : null;

                const isStartDateInvalid = startDate > currentDate;
                const isEndDateInvalid = !edu.currentlyStudying && endDate && startDate && endDate < startDate;

                return (
                  <div key={idx} className="mb-4 border rounded p-3">
                    <div className="row">
                      <div className="col-12 col-md-6 mb-3">
                        <label className="form-label">Degree *</label>
                        <input
                          type="text"
                          className={`form-control ${errors.education?.[idx]?.degree ? "is-invalid" : ""}`}
                          value={edu.degree || ""}
                          onChange={(e) => handleEducationChange(idx, "degree", e.target.value)}
                        />
                        {errors.education?.[idx]?.degree && (
                          <div className="invalid-feedback">{errors.education[idx].degree}</div>
                        )}
                      </div>

                      <div className="col-12 col-md-6 mb-3">
                        <label className="form-label">Institution *</label>
                        <select
                          className={`form-select ${errors.education?.[idx]?.institute ? "is-invalid" : ""}`}
                          value={edu.institute || ""}
                          onChange={(e) => handleEducationChange(idx, "institute", e.target.value)}
                        >
                          <option value="">Select Institution</option>
                          {INSTITUTIONS.map((institution, instIdx) => (
                            <option key={instIdx} value={institution}>{institution}</option>
                          ))}
                        </select>
                        {errors.education?.[idx]?.institute && (
                          <div className="invalid-feedback">{errors.education[idx].institute}</div>
                        )}
                        {edu.institute === "Others" && (
                          <div className="mt-2">
                            <input
                              type="text"
                              className={`form-control ${errors.education?.[idx]?.customInstitute ? "is-invalid" : ""}`}
                              placeholder="Enter your institution name"
                              value={edu.customInstitute || ""}
                              onChange={(e) => handleEducationChange(idx, "customInstitute", e.target.value)}
                            />
                            {errors.education?.[idx]?.customInstitute && (
                              <div className="invalid-feedback">{errors.education[idx].customInstitute}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Start Date</label>
                        <input
                          type="month"
                          className={`form-control ${isStartDateInvalid ? 'is-invalid' : ''}`}
                          value={edu.startDate || ""}
                          onChange={(e) => handleEducationChange(idx, "startDate", e.target.value)}
                        />
                        {isStartDateInvalid && (
                          <div className="invalid-feedback">
                            Start date cannot be in the future.
                          </div>
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">End Date</label>
                        <input
                          type="month"
                          className={`form-control ${isEndDateInvalid ? 'is-invalid' : ''}`}
                          value={edu.endDate || ""}
                          onChange={(e) => handleEducationChange(idx, "endDate", e.target.value)}
                          disabled={edu.currentlyStudying}
                        />
                        {isEndDateInvalid && (
                          <div className="invalid-feedback">
                            End date cannot be before start date
                          </div>
                        )}
                      </div>
                      <div className="col-md-4 mb-3 d-flex align-items-end">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={edu.currentlyStudying || false}
                            onChange={(e) =>
                              handleEducationChange(idx, "currentlyStudying", e.target.checked)
                            }
                          />
                          <label className="form-check-label">Currently Studying</label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={addEducation}
            >
              <FaPlus className="me-1" /> Add Another Education
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h4 className="mb-4">Skills & Preferences</h4>
            <div className="mb-4">
              <h5>Skills</h5>
              <div className="mb-3 d-flex">
                <input type="text" className="form-control me-2"
                  placeholder="Enter a skill (e.g., JavaScript, Project Management)"
                  value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} />
                <button type="button" className="btn btn-outline-success" onClick={addSkill}>
                  <FaPlus />
                </button>
              </div>
              {errors.skills && <div className="text-danger mb-2">{errors.skills}</div>}
              {formData.skills && formData.skills.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {formData.skills.map((skill, idx) => (
                    <span key={idx} className="badge bg-primary">{skill}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <h5>Languages</h5>
              <div className="mb-3 d-flex">
                <select
                  className="form-select me-2"
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value)}
                >
                  <option value="">Select Language</option>
                  {LANGUAGES.map((language, idx) => (
                    <option key={idx} value={language}>{language}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-outline-success" onClick={addLanguage}>
                  <FaPlus />
                </button>
              </div>

              {/* Custom Language Input */}
              {currentLanguage === "Others" && (
                <div className="mb-3 d-flex">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Enter your language"
                    value={currentCustomLanguage}
                    onChange={(e) => setCurrentCustomLanguage(e.target.value)}
                  />
                  <button type="button" className="btn btn-outline-success" onClick={addLanguage}>
                    Add Language
                  </button>
                </div>
              )}
              {formData.languages && formData.languages.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                  {formData.languages.map((language, idx) => (
                    <span key={idx} className="badge bg-info d-flex align-items-center">
                      {language}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-2"
                        style={{ fontSize: '0.7em', padding: '0.1em 0.3em' }}
                        onClick={() => removeLanguage(language)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Work Experience</label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  name="experience"
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                />
                <span className="input-group-text">
                  {(formData.experience === 0 || formData.experience === "0") ? "Fresh Graduate" : "years"}
                </span>
              </div>
              {(formData.experience === 0 || formData.experience === "0") && (
                <small className="text-muted">You will be marked as a Fresh Graduate</small>
              )}
            </div>


            <div className="row mb-4">
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label">Preferred Job Type *</label>
                <select className={`form-select ${errors.jobType ? "is-invalid" : ""}`}
                  name="jobType" value={formData.jobType} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
                {errors.jobType && <div className="invalid-feedback">{errors.jobType}</div>}
              </div>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label">Preferred Work Mode *</label>
                <select className={`form-select ${errors.workMode ? "is-invalid" : ""}`}
                  name="workMode" value={formData.workMode} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                {errors.workMode && <div className="invalid-feedback">{errors.workMode}</div>}
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label">Expected Salary (per annum)</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input type="number" className="form-control"
                    name="expectedSalary" value={formData.expectedSalary} onChange={handleChange}
                    placeholder="e.g. 50000" />
                </div>
              </div>
              <div className="col-12 col-md-6 mb-3">
                <label className="form-label">Notice Period</label>
                <select className="form-select"
                  name="noticePeriod" value={formData.noticePeriod} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Immediately">Immediately</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="2 months">2 months</option>
                  <option value="3 months">3 months</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <h5>Certifications</h5>
              <div className="mb-3 d-flex">
                <input type="text" className="form-control me-2"
                  placeholder="Enter a certification (e.g., AWS Certified, PMP)"
                  value={currentCert} onChange={(e) => setCurrentCert(e.target.value)} />
                <button type="button" className="btn btn-outline-success" onClick={addCertification}>
                  <FaPlus />
                </button>
              </div>
              {formData.certifications && formData.certifications.length > 0 && (
                <ul className="list-group">
                  {formData.certifications.map((cert, idx) => (
                    <li key={idx} className="list-group-item">{cert}</li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h4 className="mb-4">Final Review</h4>
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                  {profilePicturePreview && (
                    <img
                      src={profilePicturePreview}
                      alt="Profile Preview"
                      className="rounded-circle me-0 me-md-3 mb-2 mb-md-0"
                      style={{
                        width: "clamp(50px, 12vw, 60px)",
                        height: "clamp(50px, 12vw, 60px)",
                        objectFit: "cover"
                      }}
                    />
                  )}
                  <div className="flex-grow-1">
                    <h5 className="mb-2" style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}>{formData.name}</h5>
                    <div className="d-flex flex-wrap gap-2 gap-md-3 small">
                      {formData.email && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>Email: {formData.email}</span>}
                      {formData.phone && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>Phone: {formData.phone}</span>}
                      {formData.linkedin && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>LinkedIn: {formData.linkedin}</span>}
                      {formData.gender && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>Gender: {formData.gender}</span>}
                      {formData.dob && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>DOB: {formData.dob}</span>}
                    </div>
                    <div className="d-flex flex-wrap gap-2 gap-md-3 small mt-2">
                      {formData.address && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>Address: {formData.address}</span>}
                      {formData.city && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>City: {formData.city}</span>}
                      {formData.state && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>State: {formData.state}</span>}
                      {formData.country && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>Country: {formData.country}</span>}
                      {formData.zip && <span style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>ZIP: {formData.zip}</span>}
                    </div>

                    {/* Resume Information */}
                    {resumeFileName && (
                      <div className="d-flex flex-wrap gap-2 gap-md-3 small mt-2">
                        <span className="text-success" style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>
                          <i className="bi bi-file-earmark-text me-1"></i>
                          Resume: {resumeFileName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body">
                {(formData.jobType || formData.workMode || formData.expectedSalary || formData.noticePeriod || formData.experience !== undefined) && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>JOB PREFERENCES</h6>
                    <div className="d-flex flex-wrap gap-2 gap-md-3">
                      {formData.experience !== undefined && (
                        <span style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>
                          <strong>Experience:</strong> {(formData.experience === 0 || formData.experience === "0") ? "Fresh Graduate" : `${formData.experience} years`}
                        </span>
                      )}
                      {formData.jobType && <span style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}><strong>Job Type:</strong> {formData.jobType}</span>}
                      {formData.workMode && <span style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}><strong>Work Mode:</strong> {formData.workMode}</span>}
                      {formData.expectedSalary && <span style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}><strong>Expected Salary:</strong> ${formData.expectedSalary}</span>}
                      {formData.noticePeriod && <span style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}><strong>Notice Period:</strong> {formData.noticePeriod}</span>}
                    </div>
                  </div>
                )}

                {formData.objective && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>PROFESSIONAL SUMMARY</h6>
                    <p className="text-muted" style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>{formData.objective}</p>
                  </div>
                )}

                {formData.companies && formData.companies.some(c => c.name) && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>PROFESSIONAL EXPERIENCE</h6>
                    {formData.companies.map((exp, i) => (
                      exp.name && (
                        <div key={i} className="mb-3">
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2">
                            <strong style={{ fontSize: "clamp(0.9rem, 2.3vw, 1rem)" }}>{exp.name} | {exp.position}</strong>
                            <span className="text-muted mt-1 mt-md-0" style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
                              {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate} | {exp.location}
                            </span>
                          </div>
                          {exp.responsibilities && (
                            <div className="mt-2">
                              <small className="text-muted" style={{ fontSize: "clamp(0.8rem, 2vw, 0.875rem)" }}>Responsibilities:</small>
                              <p className="mb-1" style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>{exp.responsibilities}</p>
                            </div>
                          )}
                          {exp.achievements && (
                            <div>
                              <small className="text-muted" style={{ fontSize: "clamp(0.8rem, 2vw, 0.875rem)" }}>Achievements:</small>
                              <p className="mb-0" style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>{exp.achievements}</p>
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                )}

                {formData.education && formData.education.some(e => e.degree) && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>EDUCATION</h6>
                    {formData.education.map((edu, i) => (
                      edu.degree && (
                        <div key={i} className="mb-3">
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-1">
                            <strong style={{ fontSize: "clamp(0.9rem, 2.3vw, 1rem)" }}>{edu.degree}</strong>
                            <span className="text-muted mt-1 mt-md-0" style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}>
                              {edu.startDate} - {edu.currentlyStudying ? 'Present' : edu.endDate}
                            </span>
                          </div>
                          <div style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>{edu.institute === "Others" ? edu.customInstitute : edu.institute}</div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {formData.skills && formData.skills.length > 0 && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>SKILLS</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.skills.map((skill, i) => (
                        <span key={i} className="badge bg-secondary" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.languages && formData.languages.length > 0 && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>LANGUAGES</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.languages.map((language, i) => (
                        <span key={i} className="badge bg-info" style={{ fontSize: "clamp(0.75rem, 2vw, 0.85rem)" }}>{language}</span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.certifications && formData.certifications.length > 0 && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>CERTIFICATIONS</h6>
                    <ul className="mb-0">
                      {formData.certifications.map((cert, i) => (
                        <li key={i} style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Uploaded Files Section */}
                {(profilePicturePreview || resumeFileName) && (
                  <div className="mb-4">
                    <h6 style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>UPLOADED FILES</h6>
                    <div className="d-flex flex-wrap gap-2 gap-md-3">
                      {profilePicturePreview && (
                        <span className="text-primary" style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>
                          <i className="bi bi-image me-1"></i>
                          Profile Picture: ✓ Uploaded
                        </span>
                      )}
                      {resumeFileName && (
                        <span className="text-success" style={{ fontSize: "clamp(0.875rem, 2.2vw, 1rem)" }}>
                          <i className="bi bi-file-earmark-text me-1"></i>
                          Resume: {resumeFileName}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div >
  );

  return (
    <>
      <nav className="navbar shadow-sm mb-3 mb-md-4 bg-white w-100 position-sticky top-0 border-bottom" style={{ zIndex: 1050 }}>
        <div className="container-fluid px-2 px-md-4 d-flex align-items-center w-100">
          <img src="/logo.jpeg" alt="JobilioHR Logo" style={{ height: '35px' }} className="img-fluid" />
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

      <style>{`
  .navbar {
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .btn-outline-light {
    border-color: rgba(255,255,255,0.2);
    color: white;
  }
  .btn-outline-light:hover {
    background-color: rgba(255,255,255,0.1);
  }
`}</style>

      <div className="container py-5" style={{ maxWidth: "900px" }}>
        <h2 className="mb-4 text-center">Complete Your Profile</h2>

        {/* Progress indicator */}
        <div className="d-flex justify-content-between mb-4 position-relative">
          <div className="progress" style={{ height: "2px", top: "15px", position: "absolute", width: "100%", zIndex: 0 }}>
            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${(step - 1) * 25}%` }}></div>
          </div>
          {steps.map((s) => (
            <div key={s.number} className="d-flex flex-column align-items-center" style={{ zIndex: 1 }}>
              <div className={`rounded-circle d-flex align-items-center justify-content-center ${step >= s.number ? "bg-primary text-white" : "bg-light text-secondary"}`}
                style={{ width: "32px", height: "32px", fontSize: "14px", fontWeight: "bold" }}>
                {step > s.number ? <FaCheck size={12} /> : s.number}
              </div>
              <div className={`mt-2 small ${step >= s.number ? "text-primary fw-bold" : "text-muted"} d-none d-sm-block`}>{s.title}</div>
              <div className={`mt-2 small ${step >= s.number ? "text-primary fw-bold" : "text-muted"} d-block d-sm-none`} style={{ fontSize: "0.7rem" }}>{s.title.split(' ')[0]}</div>
            </div>
          ))}
        </div>

        {renderStep()}

        <div className="d-flex justify-content-between mt-4">
          <div>
            {step > 1 && (
              <button type="button" className="btn btn-outline-secondary me-2" onClick={prevStep}>
                <FaArrowLeft className="me-1" /> Back
              </button>
            )}
            <button className="btn btn-outline-primary" type="button" onClick={handleSaveDraft}>
              <FaSave className="me-1" /> Save Draft
            </button>
          </div>
          <div>
            {step < 5 ? (
              <button className="btn btn-primary" type="button" onClick={nextStep}>
                Next <FaArrowRight className="ms-1" />
              </button>
            ) : (
              <>
                <button className="btn btn-success me-2" type="button" onClick={handleSubmit}>
                  Submit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
         body {
           background-color: #f8f9fa;
           font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
         }
         .card {
           border-radius: 8px;
           border: none;
           box-shadow: 0 2px 10px rgba(0,0,0,0.08);
         }
         .btn-primary {
           background-color: #2c3e50;
           border-color: #2c3e50;
         }
         .btn-primary:hover {
           background-color: #1a252f;
           border-color: #1a252f;
         }
         .btn-success {
           background-color: #27ae60;
           border-color: #27ae60;
         }
         .btn-dark {
           background-color: #3498db;
           border-color: #3498db;
         }
         .form-control:focus {
           border-color: #3498db;
           box-shadow: 0 0 0 0.25rem rgba(52, 152, 219, 0.25);
         }
         .progress-bar {
           transition: width 0.3s ease;
         }
         .badge {
           font-size: 0.85em;
           padding: 0.35em 0.65em;
         }
         .navbar {
           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
         }
         .resume-upload-container {
           max-width: 300px;
           margin: 0 auto;
         }
         .border-dashed {
           border: 2px dashed #dee2e6 !important;
           transition: border-color 0.3s ease;
         }
         .border-dashed:hover {
           border-color: #3498db !important;
         }
         
                   /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .container {
              padding-left: 15px;
              padding-right: 15px;
              max-width: 100% !important;
            }
            
            .py-5 {
              padding-top: 2rem !important;
              padding-bottom: 2rem !important;
            }
            
            h2 {
              font-size: 1.5rem !important;
            }
            
            .card-body {
              padding: 1rem !important;
            }
            
            /* Keep the same layout structure but make it mobile-friendly */
            .row {
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            
            .col-md-6,
            .col-md-4,
            .col-md-3 {
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
              margin-bottom: 1rem !important;
            }
            
            /* Make buttons more touch-friendly but keep them inline */
            .btn {
              padding: 0.75rem 1rem;
              font-size: 1rem;
              min-height: 44px;
              margin-right: 0.5rem;
              margin-bottom: 0.5rem;
            }
            
            .btn:last-child {
              margin-right: 0;
            }
            
            /* Keep buttons in a row but wrap them */
            .d-flex.justify-content-between {
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            
            .d-flex.justify-content-between > div {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            
            .form-control,
            .form-select {
              font-size: 16px;
              padding: 0.75rem;
              border-radius: 8px;
            }
            
            .form-label {
              font-size: 0.9rem;
              margin-bottom: 0.5rem;
              font-weight: 500;
            }
            
            .progress {
              height: 4px !important;
            }
            
            .rounded-circle {
              width: 24px !important;
              height: 24px !important;
              font-size: 12px !important;
            }
            
            .small {
              font-size: 0.8rem !important;
            }
            
            .profile-picture-container {
              margin-bottom: 1rem;
            }
            
            .profile-picture-preview,
            .profile-picture-placeholder {
              width: 100px !important;
              height: 100px !important;
            }
            
            .resume-upload-container {
              max-width: 100%;
            }
            
            .border-2.border-dashed {
              padding: 1rem !important;
              min-height: 100px !important;
            }
            
            .touch-target {
              min-height: 44px !important;
              min-width: 44px !important;
            }
            
            /* Profile picture camera button specific styles */
            .profile-picture-container .position-absolute .btn {
              width: 24px !important;
              height: 24px !important;
              min-width: 24px !important;
              min-height: 24px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 50% !important;
              z-index: 10 !important;
            }
            
            .profile-picture-container .position-absolute .btn svg {
              width: 6px !important;
              height: 6px !important;
              display: block !important;
            }
            
            .btn.touch-target {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .badge {
              font-size: 0.75rem;
              padding: 0.25rem 0.5rem;
              margin-bottom: 0.25rem;
            }
            
            .d-flex.flex-wrap.gap-2 {
              gap: 0.5rem !important;
            }
            
            .list-group-item {
              padding: 0.75rem;
              font-size: 0.9rem;
            }
            
            .card-header {
              padding: 1rem;
            }
            
            .card-header h5 {
              font-size: 1.1rem;
            }
            
            .card-header .small {
              font-size: 0.75rem !important;
            }
            
            .d-flex.flex-wrap.gap-3 {
              gap: 0.5rem !important;
            }
            
            .d-flex.flex-wrap.gap-3 .small {
              font-size: 0.7rem !important;
            }
            
            /* Keep input groups responsive */
            .input-group {
              flex-wrap: nowrap;
            }
            
            .input-group-text {
              font-size: 0.9rem;
              padding: 0.75rem 0.5rem;
            }
            
            /* Make textareas more mobile-friendly */
            textarea.form-control {
              min-height: 80px;
            }
            
                         /* Keep the same visual hierarchy */
             h4 {
               font-size: 1.3rem !important;
               margin-bottom: 1.5rem !important;
             }
             
             h5 {
               font-size: 1.1rem !important;
               margin-bottom: 1rem !important;
             }
             
             h6 {
               font-size: 1rem !important;
               margin-bottom: 0.75rem !important;
             }
             
             /* Final Review Step Specific Styles */
             .card-header .d-flex.flex-column.flex-md-row {
               gap: 0.5rem;
             }
             
             .card-header .flex-grow-1 {
               min-width: 0;
             }
             
             .card-header .d-flex.flex-wrap.gap-2.gap-md-3 {
               gap: 0.5rem !important;
             }
             
             .card-body .d-flex.flex-wrap.gap-2.gap-md-3 {
               gap: 0.5rem !important;
             }
             
             .card-body .d-flex.flex-column.flex-md-row {
               gap: 0.5rem;
             }
             
             .card-body .mt-1.mt-md-0 {
               margin-top: 0.25rem !important;
             }
             
             .card-body .mb-1.mb-md-0 {
               margin-bottom: 0.25rem !important;
             }
          }
         
                   @media (max-width: 576px) {
            .container {
              padding-left: 10px;
              padding-right: 10px;
              max-width: 100% !important;
            }
            
            h2 {
              font-size: 1.3rem !important;
            }
            
            .card-body {
              padding: 0.75rem !important;
            }
            
            /* Maintain the same layout structure */
            .col-md-6,
            .col-md-4,
            .col-md-3 {
              padding-left: 0.25rem !important;
              padding-right: 0.25rem !important;
              margin-bottom: 0.75rem !important;
            }
            
            .btn {
              padding: 0.6rem 0.8rem;
              font-size: 0.9rem;
              min-height: 40px;
            }
            
            .form-control,
            .form-select {
              padding: 0.6rem;
              font-size: 16px;
            }
            
            .form-label {
              font-size: 0.85rem;
            }
            
            .rounded-circle {
              width: 20px !important;
              height: 20px !important;
              font-size: 10px !important;
            }
            
            .small {
              font-size: 0.75rem !important;
            }
            
            .profile-picture-preview,
            .profile-picture-placeholder {
              width: 80px !important;
              height: 80px !important;
            }
            
            .border-2.border-dashed {
              padding: 0.75rem !important;
              min-height: 90px !important;
            }
            
            .touch-target {
              min-height: 40px !important;
              min-width: 40px !important;
            }
            
            /* Profile picture camera button specific styles */
            .profile-picture-container .position-absolute .btn {
              width: 22px !important;
              height: 22px !important;
              min-width: 22px !important;
              min-height: 22px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 50% !important;
              z-index: 10 !important;
            }
            
            .profile-picture-container .position-absolute .btn svg {
              width: 5px !important;
              height: 5px !important;
              display: block !important;
            }
            
            .badge {
              font-size: 0.7rem;
              padding: 0.2rem 0.4rem;
            }
            
            .list-group-item {
              padding: 0.6rem;
              font-size: 0.85rem;
            }
            
            .card-header {
              padding: 0.75rem;
            }
            
            .card-header h5 {
              font-size: 1rem;
            }
            
                         /* Keep the same visual hierarchy */
             h4 {
               font-size: 1.2rem !important;
               margin-bottom: 1.25rem !important;
             }
             
             h5 {
               font-size: 1rem !important;
               margin-bottom: 0.75rem !important;
             }
             
             h6 {
               font-size: 0.9rem !important;
               margin-bottom: 0.5rem !important;
             }
             
             /* Final Review Step Specific Styles */
             .card-header .d-flex.flex-column.flex-md-row {
               gap: 0.25rem;
             }
             
             .card-header .d-flex.flex-wrap.gap-2.gap-md-3 {
               gap: 0.25rem !important;
             }
             
             .card-body .d-flex.flex-wrap.gap-2.gap-md-3 {
               gap: 0.25rem !important;
             }
             
             .card-body .d-flex.flex-column.flex-md-row {
               gap: 0.25rem;
             }
          }
         
                   @media (max-width: 480px) {
            .container {
              padding-left: 8px;
              padding-right: 8px;
              max-width: 100% !important;
            }
            
            h2 {
              font-size: 1.2rem !important;
            }
            
            .card-body {
              padding: 0.5rem !important;
            }
            
            /* Maintain the same layout structure */
            .col-md-6,
            .col-md-4,
            .col-md-3 {
              padding-left: 0.125rem !important;
              padding-right: 0.125rem !important;
              margin-bottom: 0.5rem !important;
            }
            
            .btn {
              padding: 0.5rem 0.7rem;
              font-size: 0.85rem;
              min-height: 36px;
            }
            
            .form-control,
            .form-select {
              padding: 0.5rem;
              font-size: 16px;
            }
            
            .form-label {
              font-size: 0.8rem;
            }
            
            .rounded-circle {
              width: 18px !important;
              height: 18px !important;
              font-size: 9px !important;
            }
            
            .small {
              font-size: 0.7rem !important;
            }
            
            .profile-picture-preview,
            .profile-picture-placeholder {
              width: 70px !important;
              height: 70px !important;
            }
            
            .border-2.border-dashed {
              padding: 0.5rem !important;
              min-height: 80px !important;
            }
            
            .touch-target {
              min-height: 36px !important;
              min-width: 36px !important;
            }
            
            /* Profile picture camera button specific styles */
            .profile-picture-container .position-absolute .btn {
              width: 20px !important;
              height: 20px !important;
              min-width: 20px !important;
              min-height: 20px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              border-radius: 50% !important;
              z-index: 10 !important;
            }
            
            .profile-picture-container .position-absolute .btn svg {
              width: 4px !important;
              height: 4px !important;
              display: block !important;
            }
            
            .badge {
              font-size: 0.65rem;
              padding: 0.15rem 0.3rem;
            }
            
            .list-group-item {
              padding: 0.5rem;
              font-size: 0.8rem;
            }
            
            .card-header {
              padding: 0.5rem;
            }
            
            .card-header h5 {
              font-size: 0.9rem;
            }
            
                         /* Keep the same visual hierarchy */
             h4 {
               font-size: 1.1rem !important;
               margin-bottom: 1rem !important;
             }
             
             h5 {
               font-size: 0.9rem !important;
               margin-bottom: 0.5rem !important;
             }
             
             h6 {
               font-size: 0.8rem !important;
               margin-bottom: 0.25rem !important;
             }
             
             /* Final Review Step Specific Styles */
             .card-header .d-flex.flex-column.flex-md-row {
               gap: 0.125rem;
             }
             
             .card-header .d-flex.flex-wrap.gap-2.gap-md-3 {
               gap: 0.125rem !important;
             }
             
             .card-body .d-flex.flex-wrap.gap-2.gap-md-3 {
               gap: 0.125rem !important;
             }
             
             .card-body .d-flex.flex-column.flex-md-row {
               gap: 0.125rem;
             }
          }
       `}</style>

      {/* Resume Viewer Modal */}
      {showResumeViewer && resumeViewerUrl && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Resume Viewer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowResumeViewer(false);
                    setResumeViewerUrl(null);
                  }}
                ></button>
              </div>
              <div className="modal-body p-0">
                <iframe
                  src={resumeViewerUrl}
                  style={{
                    width: '100%',
                    height: '70vh',
                    border: 'none'
                  }}
                  title="Resume Viewer"
                  onError={() => {
                    alert('Unable to display resume in viewer. Please use the download option.');
                    setShowResumeViewer(false);
                    setResumeViewerUrl(null);
                  }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowResumeViewer(false);
                    setResumeViewerUrl(null);
                  }}
                >
                  Close
                </button>
                <a
                  href={resumeViewerUrl}
                  download={resumeFileName || "resume"}
                  className="btn btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateProfileAi;