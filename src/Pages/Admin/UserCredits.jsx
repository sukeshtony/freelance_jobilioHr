import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';
import { FaSync, FaSearch, FaFilter } from 'react-icons/fa';
import API from '../../api';

const UserCredits = () => {
  const [userCredits, setUserCredits] = useState([]);
  const [filteredCredits, setFilteredCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [creditsFilter, setCreditsFilter] = useState('');

  const fetchUserCredits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await API.get('/api/admin/user-credits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out deleted users (where username is "N/A") immediately
      const filteredData = response.data.filter(userCredit => 
        userCredit.userId?.username !== 'N/A' && 
        userCredit.userId?.username !== undefined
      );
      setUserCredits(filteredData);
      setFilteredCredits(filteredData);
      setError('');
    } catch (err) {
      console.error('Error fetching user credits:', err);
      setError('Failed to fetch user credits');
      setUserCredits([]);
      setFilteredCredits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCredits();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [nameFilter, creditsFilter, userCredits]);

  const applyFilters = () => {
    let filtered = [...userCredits];

    if (nameFilter) {
      filtered = filtered.filter(userCredit => 
        userCredit.userId?.username?.toLowerCase().includes(nameFilter.toLowerCase()) ||
        userCredit.userId?.email?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (creditsFilter) {
      const creditValue = parseInt(creditsFilter);
      if (!isNaN(creditValue)) {
        filtered = filtered.filter(userCredit => 
          userCredit.credits === creditValue
        );
      }
    }

    setFilteredCredits(filtered);
  };

  const getCreditsBadge = (credits) => {
    const creditValue = credits || 0;
    if (creditValue <= 0) return <Badge bg="danger" className="fs-6">{creditValue} Credits</Badge>;
    if (creditValue <= 5) return <Badge bg="warning" className="fs-6">{creditValue} Credits</Badge>;
    return <Badge bg="success" className="fs-6">{creditValue} Credits</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-primary">User Credits Overview</h5>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={fetchUserCredits}
            className="d-flex align-items-center"
          >
            <FaSync className="me-1" /> Refresh
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        {error && (
          <Alert variant="danger" className="m-3">
            {error}
          </Alert>
        )}

        <div className="p-3 border-bottom">
          <div className="row g-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Filter by name or email"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Filter by exact credits"
                  value={creditsFilter}
                  onChange={(e) => setCreditsFilter(e.target.value)}
                  min="0"
                />
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setCreditsFilter('')}
                  disabled={!creditsFilter}
                >
                  Clear
                </Button>
              </InputGroup>
            </div>
          </div>
        </div>
        
        {filteredCredits.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted">
              {userCredits.some(uc => uc.userId?.username === 'N/A') 
                ? 'No active user credits found (deleted users hidden)' 
                : 'No matching user credits found'}
            </h5>
            <p className="text-muted">
              {nameFilter || creditsFilter 
                ? 'Try adjusting your filters'
                : 'No user credits data available'}
            </p>
            {(nameFilter || creditsFilter) && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setNameFilter('');
                  setCreditsFilter('');
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">User</th>
                  <th>Role</th>
                  <th>Credits</th>
                  <th>Viewed Resumes</th>
                  <th className="pe-4">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredits.map(userCredit => (
                  <tr key={userCredit._id}>
                    <td className="ps-4">
                      <div>
                        <div className="fw-semibold">{userCredit.userId?.username || 'N/A'}</div>
                        <small className="text-muted">{userCredit.userId?.email || 'N/A'}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={userCredit.userId?.role === 'admin' ? 'primary' : 'secondary'} className="fs-6">
                        {userCredit.userId?.role || 'N/A'}
                      </Badge>
                    </td>
                    <td>{getCreditsBadge(userCredit.credits)}</td>
                    <td>
                      <Badge bg="info" className="fs-6">
                        {userCredit.viewedResumes?.length || 0} Resumes
                      </Badge>
                    </td>
                    <td className="pe-4">
                      <div className="text-muted small">
                        {formatDate(userCredit.lastUpdated)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserCredits;