import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lead, Task, User } from '../../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface StartupMember extends User {
  role?: {
    title: string;
  };
}

interface Startup {
  id: string;
  name: string;
  ownerId: string;
}

const AnalyticsPage: React.FC = () => {
  const { isAuthenticated, token, user } = useAuth();
  const { startupId } = useParams<{ startupId: string }>();
  const [activeTab, setActiveTab] = useState<'tasks' | 'sales'>('tasks');
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<StartupMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // 1 month ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  
  // Fetch user's startups
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    const fetchUserStartups = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/startups/my-startups', {
          headers: { 'x-auth-token': token }
        });
        setStartups(response.data);
        
        if (response.data.length > 0) {
          setSelectedStartupId(response.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching startups:', err);
        setError('Failed to load startups');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStartups();
  }, [isAuthenticated, token]);
  
  // Fetch startup data when a startup is selected
  useEffect(() => {
    if (!selectedStartupId || !token) return;
    
    const fetchStartupData = async () => {
      try {
        setLoading(true);
        
        // Fetch startup members
        const membersResponse = await axios.get(`/api/startups/${selectedStartupId}/members`, {
          headers: { 'x-auth-token': token }
        });
        setMembers(membersResponse.data);
        
        // Fetch tasks
        const tasksResponse = await axios.get(`/api/tasks/startup/${selectedStartupId}`, {
          headers: { 'x-auth-token': token }
        });
        setTasks(tasksResponse.data);
        
        // Fetch leads
        const leadsResponse = await axios.get(`/api/leads/startup/${selectedStartupId}`, {
          headers: { 'x-auth-token': token }
        });
        setLeads(leadsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching startup data:', err);
        setError('Failed to load startup data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStartupData();
  }, [selectedStartupId, token]);
  
  const handleStartupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStartupId(e.target.value);
    setSelectedMemberId(''); // Reset selected member when startup changes
  };
  
  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMemberId(e.target.value);
  };
  
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };
  
  // Filter data based on selected member and date range
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.updatedAt);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59); // End of the day
    
    const dateInRange = taskDate >= startDate && taskDate <= endDate;
    
    if (selectedMemberId) {
      return dateInRange && task.assignees.some(assignee => assignee.id === selectedMemberId);
    }
    
    return dateInRange;
  });
  
  const filteredLeads = leads.filter(lead => {
    const leadDate = new Date(lead.updatedAt);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59); // End of the day
    
    const dateInRange = leadDate >= startDate && leadDate <= endDate;
    
    if (selectedMemberId) {
      return dateInRange && lead.assignedToId === selectedMemberId;
    }
    
    return dateInRange;
  });
  
  // Prepare task analytics data
  const taskStatusData = {
    labels: ['Open', 'In Progress', 'Done'],
    datasets: [{
      label: 'Task Status',
      data: [
        filteredTasks.filter(task => task.status.name.toLowerCase() === 'to do').length,
        filteredTasks.filter(task => task.status.name.toLowerCase() === 'in progress').length,
        filteredTasks.filter(task => task.status.name.toLowerCase() === 'done').length
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(75, 192, 192, 0.5)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  };
  
  const taskPriorityData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      label: 'Task Priority',
      data: [
        filteredTasks.filter(task => task.priority === 'low').length,
        filteredTasks.filter(task => task.priority === 'medium').length,
        filteredTasks.filter(task => task.priority === 'high').length
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.5)',
        'rgba(255, 205, 86, 0.5)',
        'rgba(255, 99, 132, 0.5)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  };
  
  // Prepare sales analytics data
  const salesByStatusData = {
    labels: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'],
    datasets: [{
      label: 'Total Sales by Status',
      data: [
        filteredLeads.filter(lead => lead.status === 'NEW').reduce((sum, lead) => sum + lead.salesAmount, 0),
        filteredLeads.filter(lead => lead.status === 'CONTACTED').reduce((sum, lead) => sum + lead.salesAmount, 0),
        filteredLeads.filter(lead => lead.status === 'QUALIFIED').reduce((sum, lead) => sum + lead.salesAmount, 0),
        filteredLeads.filter(lead => lead.status === 'PROPOSAL').reduce((sum, lead) => sum + lead.salesAmount, 0),
        filteredLeads.filter(lead => lead.status === 'NEGOTIATION').reduce((sum, lead) => sum + lead.salesAmount, 0),
        filteredLeads.filter(lead => lead.status === 'CLOSED').reduce((sum, lead) => sum + lead.salesAmount, 0)
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
  
  const salesByMemberData = {
    labels: members.map(member => member.name || 'Unknown'),
    datasets: [{
      label: 'Total Sales by Team Member',
      data: members.map(member => 
        filteredLeads
          .filter(lead => lead.assignedToId === member.id)
          .reduce((sum, lead) => sum + lead.salesAmount, 0)
      ),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };
  
  const fetchData = useCallback(async () => {
    try {
      const [leadsResponse, tasksResponse] = await Promise.all([
        axios.get(`/api/startups/${startupId}/leads`),
        axios.get(`/api/startups/${startupId}/tasks`)
      ]);
      setLeads(leadsResponse.data);
      setTasks(tasksResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch analytics data');
      setLoading(false);
    }
  }, [startupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTimeframeData = (data: any[], dateField: string = 'createdAt') => {
    const now = new Date();
    const timeframes = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };
    return data.filter(item => new Date(item[dateField]) >= timeframes[selectedTimeframe]);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Please sign in to view analytics.
        </div>
      </div>
    );
  }
  
  if (loading && !startups.length) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  const timeframeLeads = getTimeframeData(leads);
  const timeframeTasks = getTimeframeData(tasks);

  // Lead Analytics Calculations
  const totalLeads = timeframeLeads.length;
  const totalSalesAmount = timeframeLeads.reduce((sum, lead) => sum + lead.salesAmount, 0);
  const avgDealSize = totalLeads > 0 ? totalSalesAmount / totalLeads : 0;
  const leadsByStatus = timeframeLeads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<Lead['status'], number>);

  // Task Analytics Calculations
  const totalTasks = timeframeTasks.length;
  const completedTasks = timeframeTasks.filter(task => task.status.name === 'Completed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Analytics Dashboard</h2>
        <div className="btn-group">
          <button 
            className={`btn btn-outline-primary ${selectedTimeframe === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('week')}
          >
            Last Week
          </button>
          <button 
            className={`btn btn-outline-primary ${selectedTimeframe === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('month')}
          >
            Last Month
          </button>
          <button 
            className={`btn btn-outline-primary ${selectedTimeframe === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('year')}
          >
            Last Year
          </button>
        </div>
      </div>

      <div className="row">
        {/* Lead Analytics */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Lead Analytics</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Total Leads</h6>
                      <h3 className="mb-0">{totalLeads}</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Total Sales</h6>
                      <h3 className="mb-0">${totalSalesAmount.toLocaleString()}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-responsive mt-3">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(leadsByStatus) as Array<[Lead['status'], number]>).map(([status, count]) => (
                      <tr key={status}>
                        <td>{status}</td>
                        <td>{count}</td>
                        <td>{((count / totalLeads) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Task Analytics */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Task Analytics</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Total Tasks</h6>
                      <h3 className="mb-0">{totalTasks}</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Completion Rate</h6>
                      <h3 className="mb-0">{completionRate.toFixed(1)}%</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h6>Task Priority Distribution</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Priority</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['high', 'medium', 'low'].map(priority => {
                        const count = timeframeTasks.filter(task => task.priority === priority).length;
                        const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                        return (
                          <tr key={priority}>
                            <td className="text-capitalize">{priority}</td>
                            <td>{count}</td>
                            <td>{percentage.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Status/Priority</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...timeframeLeads, ...timeframeTasks]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 10)
                      .map(item => {
                        const isLead = 'salesAmount' in item;
                        return (
                          <tr key={item.id}>
                            <td>{isLead ? 'Lead' : 'Task'}</td>
                            <td>
                              {isLead ? (
                                <>
                                  <div className="fw-bold">{item.name}</div>
                                  <small className="text-muted">
                                    {isLead && `$${(item as Lead).salesAmount.toLocaleString()}`}
                                  </small>
                                </>
                              ) : (
                                <>
                                  <div className="fw-bold">{(item as Task).title}</div>
                                  <small className="text-muted">
                                    {(item as Task).assignees.map(a => a.name).join(', ')}
                                  </small>
                                </>
                              )}
                            </td>
                            <td>
                              {isLead ? (
                                <span className="badge bg-primary">{(item as Lead).status}</span>
                              ) : (
                                <span className={`badge ${(item as Task).priority === 'high' ? 'bg-danger' : 'bg-warning'}`}>
                                  {(item as Task).priority}
                                </span>
                              )}
                            </td>
                            <td>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 