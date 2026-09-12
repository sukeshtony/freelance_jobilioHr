import React, { useEffect, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { Modal, Button, Table, Spinner } from 'react-bootstrap';
import API from '../../api';

const AdminContactUs = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await API.get('/api/contact/contacts');
        if (res.data.success) {
          setContacts(res.data.data);
        } else {
          setError('Failed to fetch contact messages.');
        }
      } catch (err) {
        setError('Failed to fetch contact messages.');
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const handleView = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Contact Us Messages</h2>
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : contacts.length === 0 ? (
        <div className="alert alert-info">No contact messages found.</div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c, idx) => (
              <tr key={c._id}>
                <td>{idx + 1}</td>
                <td>{c.fullName}</td>
                <td>{c.mobile}</td>
                <td>{c.email}</td>
                <td>{new Date(c.createdAt).toLocaleString()}</td>
                <td>
                  <Button variant="outline-primary" size="sm" onClick={() => handleView(c)}>
                    <FaEye />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Contact Message Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedContact && (
            <>
              <p><strong>Full Name:</strong> {selectedContact.fullName}</p>
              <p><strong>Mobile:</strong> {selectedContact.mobile}</p>
              <p><strong>Email:</strong> {selectedContact.email}</p>
              <p><strong>Message:</strong><br />{selectedContact.message}</p>
              <p><strong>Date:</strong> {new Date(selectedContact.createdAt).toLocaleString()}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminContactUs;
