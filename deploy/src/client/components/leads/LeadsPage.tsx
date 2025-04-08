import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  source: string;
  notes: string;
  salesAmount: number;
  nextActionDate: string | null;
  assignedToId: string | null;
  assignedTo: User | null;
  createdAt: string;
  updatedAt: string;
  comments: LeadComment[];
  startupId: string;
}

interface LeadComment {
  id: string;
  content: string;
  userId: string;
  user: User;
  createdAt: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  status: Lead['status'];
  source: string;
  notes: string;
  salesAmount: number;
  nextActionDate: string;
  assignedToId: string;
  startupId: string;
}

const LeadsPage: React.FC = () => {
  const { startupId } = useParams<{ startupId?: string }>();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startups, setStartups] = useState<{id: string, name: string}[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>(startupId || '');

  const [leadForm, setLeadForm] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'NEW',
    source: '',
    notes: '',
    salesAmount: 0,
    nextActionDate: '',
    assignedToId: '',
    startupId: startupId || ''
  });

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/leads';
      if (startupId) {
        url = `/api/startups/${startupId}/leads`;
      } else if (selectedStartupId) {
        url = `/api/startups/${selectedStartupId}/leads`;
      }
      
      const response = await axios.get(url);
      setLeads(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to fetch leads');
      setLoading(false);
    }
  }, [startupId, selectedStartupId]);

  const fetchMembers = useCallback(async () => {
    try {
      if (!startupId && !selectedStartupId) return;
      
      const id = startupId || selectedStartupId;
      const response = await axios.get(`/api/startups/${id}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [startupId, selectedStartupId]);

  const fetchStartups = useCallback(async () => {
    try {
      const response = await axios.get('/api/startups/my-startups');
      setStartups(response.data.map((s: any) => ({ id: s.id, name: s.name })));
      
      // Set default selected startup if none is selected yet
      if (!startupId && !selectedStartupId && response.data.length > 0) {
        setSelectedStartupId(response.data[0].id);
        setLeadForm(form => ({ ...form, startupId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching startups:', error);
    }
  }, [startupId, selectedStartupId]);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

  useEffect(() => {
    fetchLeads();
    fetchMembers();
  }, [fetchLeads, fetchMembers, selectedStartupId]);

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      notes: lead.notes,
      salesAmount: lead.salesAmount,
      nextActionDate: lead.nextActionDate || '',
      assignedToId: lead.assignedToId || '',
      startupId: lead.startupId
    });
    setShowEditModal(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await axios.put(`/api/leads/${selectedLead.id}`, leadForm);
      setShowEditModal(false);
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      setError('Failed to update lead');
    }
  };

  const handleAddComment = async (leadId: string) => {
    if (!newComment.trim()) return;

    try {
      await axios.post(`/api/leads/${leadId}/comments`, {
        content: newComment,
        userId: user?.id
      });
      setNewComment('');
      fetchLeads();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const getStatusColor = (status: Lead['status']): string => {
    const colors = {
      NEW: 'bg-secondary',
      CONTACTED: 'bg-info',
      QUALIFIED: 'bg-primary',
      PROPOSAL: 'bg-warning',
      NEGOTIATION: 'bg-info',
      CLOSED: 'bg-success'
    };
    return colors[status];
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/leads', leadForm);
      setShowAddModal(false);
      setLeadForm({
        name: '',
        email: '',
        phone: '',
        status: 'NEW',
        source: '',
        notes: '',
        salesAmount: 0,
        nextActionDate: '',
        assignedToId: '',
        startupId: startupId || selectedStartupId
      });
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      setError('Failed to create lead');
    }
  };

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Leads Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setLeadForm({
              name: '',
              email: '',
              phone: '',
              status: 'NEW',
              source: '',
              notes: '',
              salesAmount: 0,
              nextActionDate: '',
              assignedToId: '',
              startupId: startupId || selectedStartupId
            });
            setShowAddModal(true);
          }}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add New Lead
        </button>
      </div>

      {!startupId && (
        <div className="mb-4">
          <label className="form-label">Select Startup</label>
          <select
            className="form-select"
            value={selectedStartupId}
            onChange={(e) => setSelectedStartupId(e.target.value)}
          >
            <option value="">All Startups</option>
            {startups.map(startup => (
              <option key={startup.id} value={startup.id}>
                {startup.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Next Action</th>
              <th>Sales Amount</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>
                  <div className="fw-bold">{lead.name}</div>
                  <small className="text-muted">{lead.email}</small>
                </td>
                <td>
                  <span className={`badge ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td>{lead.assignedTo?.name || 'Unassigned'}</td>
                <td>
                  {lead.nextActionDate ? new Date(lead.nextActionDate).toLocaleDateString() : 'Not set'}
                </td>
                <td>${lead.salesAmount.toLocaleString()}</td>
                <td>{formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => handleEditLead(lead)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Lead Modal */}
      {showEditModal && selectedLead && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Lead: {selectedLead.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateLead}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={leadForm.name}
                        onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={leadForm.email}
                        onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={leadForm.phone}
                        onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={leadForm.status}
                        onChange={e => setLeadForm({...leadForm, status: e.target.value as Lead['status']})}
                        required
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="PROPOSAL">Proposal</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sales Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={leadForm.salesAmount}
                        onChange={e => setLeadForm({...leadForm, salesAmount: parseFloat(e.target.value)})}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Next Action Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={leadForm.nextActionDate}
                        onChange={e => setLeadForm({...leadForm, nextActionDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Assigned To</label>
                    <select
                      className="form-select"
                      value={leadForm.assignedToId}
                      onChange={e => setLeadForm({...leadForm, assignedToId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      value={leadForm.notes}
                      onChange={e => setLeadForm({...leadForm, notes: e.target.value})}
                      rows={3}
                    ></textarea>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-4">
                    <h6>Comments</h6>
                    <div className="mb-3">
                      <textarea
                        className="form-control mb-2"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                      ></textarea>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAddComment(selectedLead.id)}
                      >
                        Add Comment
                      </button>
                    </div>
                    <div className="comments-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {selectedLead.comments.map(comment => (
                        <div key={comment.id} className="card mb-2">
                          <div className="card-body py-2">
                            <p className="mb-1">{comment.content}</p>
                            <small className="text-muted">
                              {comment.user.name} - {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Lead</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleCreateLead}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={leadForm.name}
                        onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={leadForm.email}
                        onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={leadForm.phone}
                        onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={leadForm.status}
                        onChange={e => setLeadForm({...leadForm, status: e.target.value as Lead['status']})}
                        required
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="PROPOSAL">Proposal</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sales Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={leadForm.salesAmount}
                        onChange={e => setLeadForm({...leadForm, salesAmount: parseFloat(e.target.value)})}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Next Action Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={leadForm.nextActionDate}
                        onChange={e => setLeadForm({...leadForm, nextActionDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Assigned To</label>
                    <select
                      className="form-select"
                      value={leadForm.assignedToId}
                      onChange={e => setLeadForm({...leadForm, assignedToId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      value={leadForm.notes}
                      onChange={e => setLeadForm({...leadForm, notes: e.target.value})}
                      rows={3}
                    ></textarea>
                  </div>

                  {!startupId && (
                    <div className="mb-3">
                      <label className="form-label">Startup</label>
                      <select
                        className="form-select"
                        value={leadForm.startupId}
                        onChange={e => setLeadForm({...leadForm, startupId: e.target.value})}
                        required
                      >
                        <option value="">Select a startup</option>
                        {startups.map(startup => (
                          <option key={startup.id} value={startup.id}>
                            {startup.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Lead</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage; 