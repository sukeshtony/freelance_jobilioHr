import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Form, Row, Col, Spinner, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import { FaSearch, FaEye, FaTrash, FaEdit, FaFilter, FaSync, FaDownload, FaFileExcel, FaFileCsv } from 'react-icons/fa';
import API from '../../api';
import { useNavigate } from 'react-router-dom';
import { exportCandidatesToExcel, exportCandidatesToCSV } from '../../utils/excelExport';


const Candidates = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        username: '',
        email: '',
        mobile: '',
        title: '',
        experience: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [exporting, setExporting] = useState(false);
    const navigate = useNavigate();

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/admin/candidates');
            const sortedCandidates = (res.data?.data || []).sort((a, b) => 
                new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt)
            );
            setCandidates(sortedCandidates);
            
        } catch (error) {
            console.error("Error fetching candidates:", error);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this candidate?")) return;
        try {
            await API.delete(`/api/admin/candidates/${id}`);
            setCandidates(prev => prev.filter(c => c._id !== id));
        } catch (error) {
            console.error("Error deleting candidate:", error);
            alert("Failed to delete candidate");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            // Use filtered candidates for export
            const candidatesToExport = filteredCandidates.length > 0 ? filteredCandidates : candidates;
            exportCandidatesToExcel(candidatesToExport);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            // Use filtered candidates for export
            const candidatesToExport = filteredCandidates.length > 0 ? filteredCandidates : candidates;
            exportCandidatesToCSV(candidatesToExport);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const user = typeof c.userId === 'object' && c.userId !== null ? c.userId : {
            username: c.username || '',
            email: c.email || '',
            mobile: c.mobile || ''
        };

        return (
            (!filters.username || user.username.toLowerCase().includes(filters.username.toLowerCase())) &&
            (!filters.email || user.email.toLowerCase().includes(filters.email.toLowerCase())) &&
            (!filters.mobile || user.mobile?.toString().includes(filters.mobile)) &&
            (!filters.title || (c.profile?.title || '').toLowerCase().includes(filters.title.toLowerCase())) &&
            (!filters.experience || (c.profile?.experience?.toString() || '').includes(filters.experience))
        );
    });

    const sortedCandidates = [...filteredCandidates].sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        const aValue = sortConfig.key.includes('.') 
            ? sortConfig.key.split('.').reduce((o, i) => o?.[i], a)
            : a[sortConfig.key];
            
        const bValue = sortConfig.key.includes('.') 
            ? sortConfig.key.split('.').reduce((o, i) => o?.[i], b)
            : b[sortConfig.key];

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const getExperienceBadge = (exp) => {
        if (!exp) return <Badge bg="secondary">N/A</Badge>;
        const years = parseInt(exp);
        if (years < 2) return <Badge bg="info">{exp} yrs</Badge>;
        if (years < 5) return <Badge bg="primary">{exp} yrs</Badge>;
        return <Badge bg="success">{exp} yrs</Badge>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                    <h5 className="mb-0 fw-bold text-primary">Candidate Management</h5>
                    <div className="d-flex flex-wrap gap-2">
                        <Dropdown>
                            <Dropdown.Toggle 
                                variant="outline-success" 
                                size="sm" 
                                disabled={exporting}
                                className="d-flex align-items-center btn-responsive"
                            >
                                <FaDownload className="me-1" />
                                <span className="d-none d-sm-inline">{exporting ? 'Exporting...' : 'Export'}</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={handleExportExcel}>
                                    <FaFileExcel className="me-2 text-success" />
                                    Export to Excel (.xlsx)
                                </Dropdown.Item>
                                <Dropdown.Item onClick={handleExportCSV}>
                                    <FaFileCsv className="me-2 text-info" />
                                    Export to CSV (.csv)
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="btn-responsive"
                        >
                            <FaFilter className="me-1" /> 
                            <span className="d-none d-sm-inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                        </Button>
                        <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={fetchCandidates}
                            className="btn-responsive"
                        >
                            <FaSync />
                        </Button>
                    </div>
                </div>
                
                {showFilters && (
                    <Row className="g-2 mb-3 filters-responsive">
                        <Col xs={12} md={4}>
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Search username" 
                                    name="username" 
                                    value={filters.username} 
                                    onChange={handleFilterChange} 
                                />
                            </InputGroup>
                        </Col>
                        <Col xs={12} md={4}>
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Search email" 
                                    name="email" 
                                    value={filters.email} 
                                    onChange={handleFilterChange} 
                                />
                            </InputGroup>
                        </Col>
                        <Col xs={12} md={4}>
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Search mobile" 
                                    name="mobile" 
                                    value={filters.mobile} 
                                    onChange={handleFilterChange} 
                                />
                            </InputGroup>
                        </Col>
                        <Col xs={12} md={4} className="mt-2">
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Search job title" 
                                    name="title" 
                                    value={filters.title} 
                                    onChange={handleFilterChange} 
                                />
                            </InputGroup>
                        </Col>
                        <Col xs={12} md={4} className="mt-2">
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Search experience" 
                                    name="experience" 
                                    value={filters.experience} 
                                    onChange={handleFilterChange} 
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                )}
            </Card.Header>
            
            <Card.Body className="p-0">
                {filteredCandidates.length === 0 ? (
                    <div className="text-center py-5">
                        <img 
                            src="/empty-state.svg" 
                            alt="No candidates found" 
                            style={{ height: '150px', opacity: 0.7 }} 
                            className="mb-3"
                        />
                        <h5 className="text-muted">No candidates found</h5>
                        <p className="text-muted">Try adjusting your search filters</p>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => {
                                setFilters({
                                    username: '',
                                    email: '',
                                    mobile: '',
                                    title: '',
                                    experience: ''
                                });
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th 
                                        onClick={() => handleSort('username')}
                                        className="cursor-pointer"
                                    >
                                        Username {sortConfig.key === 'username' && (
                                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    <th 
                                        onClick={() => handleSort('email')}
                                        className="cursor-pointer"
                                    >
                                        Email {sortConfig.key === 'email' && (
                                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    <th>Mobile</th>
                                    <th 
                                        onClick={() => handleSort('profile.title')}
                                        className="cursor-pointer"
                                    >
                                        Title {sortConfig.key === 'profile.title' && (
                                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    <th 
                                        className="cursor-pointer"
                                    >
                                        Premium
                                        
                                    </th>
                                    <th 
                                        onClick={() => handleSort('profile.experience')}
                                        className="cursor-pointer"
                                    >
                                        Experience {sortConfig.key === 'profile.experience' && (
                                            <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCandidates.map(candidate => (
                                    <tr key={candidate._id} className="align-middle">
                                        <td>
                                            <div className="fw-semibold">{candidate.username || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <a href={`mailto:${candidate.email}`} className="text-primary">
                                                {candidate.email || 'N/A'}
                                            </a>
                                        </td>
                                        <td>
                                            {candidate.mobile ? (
                                                <a href={`tel:${candidate.mobile}`} className="text-decoration-none">
                                                    {candidate.mobile}
                                                </a>
                                            ) : 'N/A'}
                                        </td>
                                        <td>
                                            {candidate.profile?.title || (
                                                <span className="text-muted">Not specified</span>
                                            )}
                                        </td>
                                        <td>
                                            {candidate.isPremium ? "Yes" : "No"}
                                        </td>
                                        <td>
                                            {getExperienceBadge(candidate.profile?.experience)}
                                        </td>
                                        
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="d-flex align-items-center"
                                                    onClick={() => navigate(`/admin/candidates/${candidate._id}`)}
                                                >
                                                    <FaEye className="me-1" /> View
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="d-flex align-items-center"
                                                    onClick={() => handleDelete(candidate._id)}
                                                >
                                                    <FaTrash className="me-1" /> Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card.Body>
            
            {filteredCandidates.length > 0 && (
                <Card.Footer className="bg-white border-0 d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                        Showing <strong>{filteredCandidates.length}</strong> of <strong>{candidates.length}</strong> candidates
                    </small>
                </Card.Footer>
            )}
        </Card>
    );
};

export default Candidates;