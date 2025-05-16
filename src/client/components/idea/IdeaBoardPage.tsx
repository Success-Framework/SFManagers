import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaTimes, FaThumbsUp, FaThumbsDown, FaSearch, FaSortAmountDown, FaSortAmountUp, FaComment, FaReply, FaPaperPlane, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

interface Comment {
  id: string;
  ideaId: string;
  userId: string;
  user: User;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdBy: User;
  startupId: string;
  votes: IdeaVote[];
  comments: Comment[];
  isApproved: boolean;
  createdAt: string;
}

interface IdeaVote {
  id: string;
  ideaId: string;
  userId: string;
  user: User;
  value: number; // 1 for upvote, -1 for downvote
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getAuthConfig = () => {
  return {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  };
};

const IdeaBoardPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Comments state
  const [commentText, setCommentText] = useState<{[key: string]: string}>({});
  const [replyingTo, setReplyingTo] = useState<{[key: string]: string | null}>({});
  const [expandedComments, setExpandedComments] = useState<{[key: string]: boolean}>({});

  // Fetch ideas and current user when component mounts
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        console.log(`Fetching ideas for startup ${startupId}...`);
        const response = await axios.get(`/api/startups/${startupId}/ideas`, getAuthConfig());
        console.log('Ideas fetched successfully:', response.data);
        
        // Make sure the response has data and it's an array
        if (response.data && Array.isArray(response.data)) {
          setIdeas(response.data);
          
          // Initialize comments UI state for each idea
          const initialCommentStates: {[key: string]: string} = {};
          const initialExpandedStates: {[key: string]: boolean} = {};
          
          response.data.forEach((idea: Idea) => {
            initialCommentStates[idea.id] = '';
            initialExpandedStates[idea.id] = false;
          });
          
          setCommentText(initialCommentStates);
          setExpandedComments(initialExpandedStates);
          
          // Extract and sort unique tags from all ideas
          const tagsSet = new Set<string>();
          response.data.forEach((idea: Idea) => {
            if (idea.tags && Array.isArray(idea.tags)) {
              idea.tags.forEach(tag => tag && tagsSet.add(tag));
            }
          });
          setAllTags(Array.from(tagsSet).sort());
        } else {
          console.warn('API returned unexpected data format for ideas:', response.data);
          setIdeas([]);
          setAllTags([]);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch ideas');
        console.error('Error fetching ideas:', err);
        setIdeas([]);
        setAllTags([]);
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/users/current', getAuthConfig());
        if (response.data && response.data.id) {
          setCurrentUser(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        // Don't set error state for this, as it's not critical for the page to function
      }
    };

    if (startupId) {
      fetchIdeas();
      fetchCurrentUser();
      
      // Set up polling to refresh ideas every 30 seconds
      const pollingInterval = setInterval(() => {
        console.log('Polling for new ideas...');
        fetchIdeas();
      }, 30000);
      
      // Clean up interval on unmount
      return () => clearInterval(pollingInterval);
    } else {
      setError('No startup ID provided');
    }
  }, [startupId]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    try {
      setLoading(true); // Show loading state
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const ideaData = {
        title: formData.title,
        description: formData.description,
        tags: tagsArray
      };

      console.log('Submitting idea:', ideaData);
      await axios.post(`/api/startups/${startupId}/ideas`, ideaData, getAuthConfig());
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        tags: ''
      });
      
      // Refresh ideas list
      console.log('Idea submitted successfully, refreshing idea list');
      try {
        const response = await axios.get(`/api/startups/${startupId}/ideas`, getAuthConfig());
        console.log('Fetched ideas after submission:', response.data);
        setIdeas(response.data || []);
        
        // Update tags list
        const newTagsSet = new Set<string>(allTags);
        tagsArray.forEach(tag => newTagsSet.add(tag));
        setAllTags(Array.from(newTagsSet).sort());
      } catch (refreshError) {
        console.error('Error refreshing ideas list:', refreshError);
      }
      
      setLoading(false); // Hide loading state
      
    } catch (err: any) {
      setLoading(false); // Hide loading state
      setError(err.response?.data?.error || 'Failed to submit idea');
      console.error('Error submitting idea:', err);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!window.confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(
        `/api/startups/${startupId}/ideas/${ideaId}`,
        getAuthConfig()
      );
      
      // Remove the idea from the list
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));
      
      // Show success message
      alert('Idea deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete idea');
    }
  };

  const handleVote = async (ideaId: string, voteValue: number) => {
    try {
      console.log(`Voting on idea ${ideaId} with value ${voteValue}`);
      
      const response = await axios.post(
        `/api/startups/${startupId}/ideas/${ideaId}/vote`,
        { value: voteValue },
        getAuthConfig()
      );
      
      console.log('Vote response:', response.data);
      
      // Update the idea in the list with the new vote data
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => {
          if (idea.id === ideaId) {
            // Create a new idea object with updated votes
            return { 
              ...idea,
              // Make sure we have the votes array, or use an empty array if it's undefined
              votes: response.data.votes || []
            };
          }
          return idea;
        })
      );
      
      console.log('Ideas state updated after vote');
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.response?.data?.error || 'Failed to vote');
    }
  };
  
  // Handle comment submission
  const handleCommentSubmit = async (ideaId: string, parentId: string | null = null) => {
    // Allow comment even without current user by using system-user
    const content = parentId ? replyingTo[ideaId] : commentText[ideaId];
    if (!content || content.trim() === '') return;
    
    try {
      console.log('Submitting comment:', { ideaId, content, parentId });
      
      const response = await axios.post(
        `/api/startups/${startupId}/ideas/${ideaId}/comments`,
        { content, parentId },
        getAuthConfig()
      );
      
      console.log('Comment submitted successfully:', response.data);
      
      // Update the idea in the list with the new comment
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => {
          if (idea.id === ideaId) {
            return {
              ...idea,
              comments: [...(idea.comments || []), response.data]
            };
          }
          return idea;
        })
      );
      
      // Reset comment input
      if (parentId) {
        setReplyingTo(prev => ({
          ...prev,
          [ideaId]: null
        }));
      } else {
        setCommentText(prev => ({
          ...prev,
          [ideaId]: ''
        }));
      }
    } catch (err: any) {
      console.error('Error submitting comment:', err);
      setError(err.response?.data?.error || 'Failed to submit comment');
    }
  };
  
  // Toggle comment section visibility
  const toggleComments = (ideaId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [ideaId]: !prev[ideaId]
    }));
  };

  // Calculate if the current user has voted on an idea
  const getUserVote = (idea: Idea) => {
    if (!idea.votes || !Array.isArray(idea.votes)) {
      return 0;
    }
    
    // Look for votes by system-user (which we're using as default) or the current user's ID
    const userId = currentUser?.id || 'system-user';
    console.log(`Checking votes for user ${userId} on idea ${idea.id}`);
    
    const userVote = idea.votes.find(vote => vote.userId === userId);
    console.log(`Found vote:`, userVote);
    
    return userVote ? userVote.value : 0;
  };

  // Calculate total votes for an idea
  const getVoteCount = (idea: Idea) => {
    return idea.votes.reduce((total, vote) => total + vote.value, 0);
  };

  // Filter and sort ideas
  const filteredAndSortedIdeas = ideas
    .filter(idea => {
      // Filter by search term
      const matchesSearch = 
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by tag if one is selected
      const matchesTag = filterTag 
        ? idea.tags.includes(filterTag)
        : true;
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      if (sortBy === 'newest') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      } else { // sort by votes
        const votesA = getVoteCount(a);
        const votesB = getVoteCount(b);
        return sortDirection === 'desc' ? votesB - votesA : votesA - votesB;
      }
    });

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-body">
              <h1 className="card-title h3 mb-4">Idea Board</h1>
              
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
              )}
              
              <div className="row">
                {/* Submit Idea Form */}
                <div className="col-md-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">Submit a New Idea</h5>
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label htmlFor="title" className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-control"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleFormChange}
                            placeholder="Enter a concise title"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="description" className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleFormChange}
                            placeholder="Describe your idea in detail"
                            required
                          ></textarea>
                        </div>
                        <div className="mb-3">
                          <label htmlFor="tags" className="form-label">Tags (comma-separated)</label>
                          <input
                            type="text"
                            className="form-control"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleFormChange}
                            placeholder="e.g. marketing, feature, improvement"
                          />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Submit Idea</button>
                      </form>
                    </div>
                  </div>
                </div>
                
                {/* Ideas List */}
                <div className="col-md-8">
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="card-title mb-0">Ideas</h5>
                        <div className="d-flex gap-2">
                          {/* Search input */}
                          <div className="input-group">
                            <span className="input-group-text">
                              <FaSearch />
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search ideas..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          
                          {/* Sort dropdown */}
                          <div className="dropdown">
                            <button className="btn btn-outline-secondary dropdown-toggle" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                              {sortBy === 'newest' ? 'Date' : 'Votes'} {sortDirection === 'desc' ? '▼' : '▲'}
                            </button>
                            <ul className="dropdown-menu" aria-labelledby="sortDropdown">
                              <li><button className="dropdown-item" onClick={() => { setSortBy('newest'); setSortDirection('desc'); }}>Newest first</button></li>
                              <li><button className="dropdown-item" onClick={() => { setSortBy('newest'); setSortDirection('asc'); }}>Oldest first</button></li>
                              <li><button className="dropdown-item" onClick={() => { setSortBy('votes'); setSortDirection('desc'); }}>Most votes</button></li>
                              <li><button className="dropdown-item" onClick={() => { setSortBy('votes'); setSortDirection('asc'); }}>Least votes</button></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tag filters */}
                      <div className="mb-4">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          <small className="text-muted me-2">Filter by tag:</small>
                          <button 
                            className={`btn btn-sm ${filterTag === null ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilterTag(null)}
                          >
                            All
                          </button>
                          {allTags.map(tag => (
                            <button 
                              key={tag}
                              className={`btn btn-sm ${filterTag === tag ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => setFilterTag(tag)}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {loading ? (
                        <div className="d-flex justify-content-center p-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : filteredAndSortedIdeas.length > 0 ? (
                        <div className="idea-list">
                          {filteredAndSortedIdeas.map(idea => {
                            const userVote = getUserVote(idea);
                            const voteCount = getVoteCount(idea);
                            const commentsExpanded = expandedComments[idea.id] || false;
                            
                            return (
                              <div key={idea.id} className="card mb-3 shadow-sm">
                                <div className="card-body">
                                  <div className="d-flex align-items-start">
                                    {/* Voting buttons */}
                                    <div className="me-3 d-flex flex-column align-items-center" style={{ minWidth: '50px' }}>
                                      <button
                                        className={`btn btn-sm ${userVote > 0 ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => handleVote(idea.id, userVote > 0 ? 0 : 1)}
                                        aria-label="Upvote"
                                      >
                                        <FaThumbsUp />
                                      </button>
                                      <div className="vote-count my-1 text-center fw-bold">
                                        {voteCount}
                                      </div>
                                      <button
                                        className={`btn btn-sm ${userVote < 0 ? 'btn-danger' : 'btn-outline-secondary'}`}
                                        onClick={() => handleVote(idea.id, userVote < 0 ? 0 : -1)}
                                        aria-label="Downvote"
                                      >
                                        <FaThumbsDown />
                                      </button>
                                    </div>
                                    
                                    {/* Idea content */}
                                    <div className="flex-grow-1">
                                      <div className="d-flex justify-content-between align-items-start">
                                        <h5 className="card-title mb-1">{idea.title}</h5>
                                        <div className="d-flex align-items-center gap-2">
                                          {idea.isApproved && (
                                            <span className="badge bg-success ms-2 d-flex align-items-center">
                                              Approved +25 XP
                                            </span>
                                          )}
                                          {(currentUser?.id === idea.createdBy.id || idea.createdBy.id === 'system-user') && (
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              onClick={() => handleDeleteIdea(idea.id)}
                                              aria-label="Delete idea"
                                            >
                                              <FaTrash size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="mb-2" style={{ whiteSpace: 'pre-line' }}>{idea.description}</p>
                                      <div className="d-flex flex-wrap gap-1 mb-2">
                                        {idea.tags.map(tag => (
                                          <span key={tag} className="badge bg-light text-dark">{tag}</span>
                                        ))}
                                      </div>
                                      <div className="d-flex justify-content-between align-items-center text-muted small">
                                        <div>
                                          <span className="fw-bold">{idea.createdBy.name}</span> • {format(new Date(idea.createdAt), 'MMM d, yyyy')}
                                        </div>
                                        <div>
                                          <button 
                                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                            onClick={() => toggleComments(idea.id)}
                                          >
                                            <FaComment size={14} /> 
                                            <span>{idea.comments?.length || 0} Comments</span>
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* Comments section */}
                                      {commentsExpanded && (
                                        <div className="mt-3 pt-3 border-top">
                                          <h6 className="mb-3">Comments</h6>
                                          
                                          {/* Comment list */}
                                          {idea.comments && idea.comments.length > 0 ? (
                                            <div className="comment-list">
                                              {idea.comments
                                                .filter(comment => !comment.parentId)
                                                .map(comment => (
                                                  <div key={comment.id} className="comment mb-3">
                                                    <div className="d-flex mb-2">
                                                      <div className="flex-shrink-0">
                                                        <div className="bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }}>
                                                          {comment.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                      </div>
                                                      <div className="ms-2 flex-grow-1">
                                                        <div className="bg-light p-2 rounded">
                                                          <div className="fw-bold small">{comment.user.name}</div>
                                                          <div>{comment.content}</div>
                                                        </div>
                                                        <div className="small mt-1 text-muted d-flex justify-content-between">
                                                          <span>{format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                                          <button 
                                                            className="btn btn-sm text-primary p-0"
                                                            onClick={() => setReplyingTo(prev => ({
                                                              ...prev,
                                                              [idea.id]: comment.id
                                                            }))}
                                                          >
                                                            <FaReply size={12} /> Reply
                                                          </button>
                                                        </div>
                                                        
                                                        {/* Replies */}
                                                        <div className="replies ms-4 mt-2">
                                                          {idea.comments
                                                            .filter(reply => reply.parentId === comment.id)
                                                            .map(reply => (
                                                              <div key={reply.id} className="comment mb-2">
                                                                <div className="d-flex">
                                                                  <div className="flex-shrink-0">
                                                                    <div className="bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center" style={{ width: '24px', height: '24px' }}>
                                                                      {reply.user.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                  </div>
                                                                  <div className="ms-2 flex-grow-1">
                                                                    <div className="bg-light p-2 rounded">
                                                                      <div className="fw-bold small">{reply.user.name}</div>
                                                                      <div>{reply.content}</div>
                                                                    </div>
                                                                    <div className="small mt-1 text-muted">
                                                                      {format(new Date(reply.createdAt), 'MMM d, yyyy h:mm a')}
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            ))}
                                                        </div>
                                                        
                                                        {/* Reply form */}
                                                        {replyingTo[idea.id] === comment.id && (
                                                          <div className="reply-form mt-2 ms-4">
                                                            <div className="input-group">
                                                              <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder="Write a reply..."
                                                                value={replyingTo[idea.id] || ''}
                                                                onChange={(e) => setReplyingTo(prev => ({
                                                                  ...prev,
                                                                  [idea.id]: e.target.value
                                                                }))}
                                                              />
                                                              <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleCommentSubmit(idea.id, comment.id)}
                                                                disabled={!replyingTo[idea.id]}
                                                              >
                                                                <FaPaperPlane />
                                                              </button>
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                          ) : (
                                            <div className="text-muted mb-3">No comments yet. Be the first to comment!</div>
                                          )}
                                          
                                          {/* Add comment form */}
                                          <div className="input-group">
                                            <input
                                              type="text"
                                              className="form-control"
                                              placeholder="Write a comment..."
                                              value={commentText[idea.id] || ''}
                                              onChange={(e) => setCommentText(prev => ({
                                                ...prev,
                                                [idea.id]: e.target.value
                                              }))}
                                            />
                                            <button
                                              className="btn btn-primary"
                                              onClick={() => handleCommentSubmit(idea.id)}
                                              disabled={!commentText[idea.id]}
                                            >
                                              <FaPaperPlane />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="alert alert-info">
                          No ideas found. {searchTerm || filterTag ? 'Try adjusting your filters.' : 'Be the first to share an idea!'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaBoardPage; 