import React, { useState } from 'react';
import { X, Users, Search, Check } from 'lucide-react';

const GroupModal = ({ users, onCreateGroup, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUsers.size === 0) return;

    setIsCreating(true);
    try {
      await onCreateGroup({
        name: groupName.trim(),
        memberIds: Array.from(selectedUsers)
      });
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Group Name Input */}
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="form-input"
              maxLength={50}
              required
            />
            <div className="char-count">
              {groupName.length}/50
            </div>
          </div>

          {/* Members Selection */}
          <div className="form-group">
            <label>Add Members</label>
            
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                className="search-input"
              />
            </div>

            {/* Selected Members Count */}
            <div className="selected-count">
              {selectedUsers.size} of {users.length} people selected
            </div>

            {/* User List */}
            <div className="user-list">
              {filteredUsers.length === 0 ? (
                <div className="no-users">
                  <Users size={32} className="no-users-icon" />
                  <p>No people found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`user-item ${selectedUsers.has(user.id) ? 'selected' : ''}`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-checkbox">
                      {selectedUsers.has(user.id) && <Check size={16} />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Members Preview */}
          {selectedUsers.size > 0 && (
            <div className="selected-members">
              <h4>Selected Members ({selectedUsers.size})</h4>
              <div className="selected-members-list">
                {Array.from(selectedUsers).map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <div key={userId} className="selected-member">
                      <div className="member-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="member-name">{user.name}</span>
                      <button
                        type="button"
                        className="remove-member"
                        onClick={() => toggleUserSelection(userId)}
                        title="Remove from group"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!groupName.trim() || selectedUsers.size === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <div className="loading-spinner small"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Users size={16} />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>

        {/* Group Creation Tips */}
        <div className="modal-tips">
          <h4>💡 Tips for creating groups:</h4>
          <ul>
            <li>Choose a descriptive name that reflects the group's purpose</li>
            <li>Add relevant team members to keep conversations focused</li>
            <li>You can add or remove members later</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;