import React from 'react';
import { X, MessageCircle, Phone, Video, Mail, MapPin, Calendar, User } from 'lucide-react';

const UserProfile = ({ user, currentUser, onClose, onStartChat }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatJoinDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="profile-modal">
        <div className="profile-header">
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="profile-content">
          {/* User Avatar and Basic Info */}
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            <div className="profile-status">
              <div className="status-indicator online"></div>
              <span>Online</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="profile-action-btn primary" onClick={onStartChat}>
              <MessageCircle size={18} />
              Start Chat
            </button>
            <button className="profile-action-btn">
              <Phone size={18} />
              Call
            </button>
            <button className="profile-action-btn">
              <Video size={18} />
              Video Call
            </button>
          </div>

          {/* User Details */}
          <div className="profile-details">
            <div className="detail-section">
              <h3>Contact Information</h3>
              <div className="detail-item">
                <Mail size={16} />
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{user.email}</span>
                </div>
              </div>
              {user.phone && (
                <div className="detail-item">
                  <Phone size={16} />
                  <div className="detail-content">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{user.phone}</span>
                  </div>
                </div>
              )}
              {user.location && (
                <div className="detail-item">
                  <MapPin size={16} />
                  <div className="detail-content">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{user.location}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h3>Work Information</h3>
              <div className="detail-item">
                <User size={16} />
                <div className="detail-content">
                  <span className="detail-label">Role</span>
                  <span className="detail-value">{user.role || 'Team Member'}</span>
                </div>
              </div>
              {user.department && (
                <div className="detail-item">
                  <User size={16} />
                  <div className="detail-content">
                    <span className="detail-label">Department</span>
                    <span className="detail-value">{user.department}</span>
                  </div>
                </div>
              )}
              {user.joinedAt && (
                <div className="detail-item">
                  <Calendar size={16} />
                  <div className="detail-content">
                    <span className="detail-label">Joined</span>
                    <span className="detail-value">{formatJoinDate(user.joinedAt)}</span>
                  </div>
                </div>
              )}
            </div>

            {user.bio && (
              <div className="detail-section">
                <h3>About</h3>
                <p className="profile-bio">{user.bio}</p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="detail-section">
              <h3>Activity</h3>
              <div className="activity-item">
                <div className="activity-indicator"></div>
                <div className="activity-content">
                  <span className="activity-text">Last seen 2 minutes ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-indicator"></div>
                <div className="activity-content">
                  <span className="activity-text">Active in 3 groups</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="profile-quick-actions">
            <button className="quick-action-btn">
              <MessageCircle size={14} />
              Send Message
            </button>
            <button className="quick-action-btn">
              <Phone size={14} />
              Call
            </button>
            <button className="quick-action-btn">
              <Video size={14} />
              Video Call
            </button>
            <button className="quick-action-btn">
              <Mail size={14} />
              Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;