document.addEventListener('DOMContentLoaded', () => {
    const startupForm = document.getElementById('startupForm');
    const addRoleBtn = document.getElementById('addRoleBtn');
    const rolesContainer = document.getElementById('rolesContainer');
    const startupListContainer = document.getElementById('startupListContainer');
    const startupList = document.getElementById('startupList');

    // Fetch and display existing startups
    fetchStartups();

    // Add event listeners
    startupForm.addEventListener('submit', handleFormSubmit);
    addRoleBtn.addEventListener('click', addRoleField);
    setupRemoveRoleListeners();

    // Update remove button states
    updateRemoveButtons();

    // Function to handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const nameInput = document.getElementById('name');
        const detailsInput = document.getElementById('details');
        const stageSelect = document.getElementById('stage');
        const roleInputs = document.querySelectorAll('.role-input');
        
        // Collect form data
        const name = nameInput.value;
        const details = detailsInput.value;
        const stage = stageSelect.value;
        const roles = [];
        
        roleInputs.forEach(input => {
            if (input.value.trim()) {
                roles.push(input.value.trim());
            }
        });
        
        // Validate form data
        if (!name || !details || !stage || roles.length === 0) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Submit form data
        try {
            const response = await fetch('/api/startups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    details,
                    stage,
                    roles
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to register startup');
            }
            
            const startup = await response.json();
            
            // Reset form
            startupForm.reset();
            
            // Reset roles to just one
            rolesContainer.innerHTML = `
                <div class="input-group mb-2">
                    <input type="text" class="form-control role-input" placeholder="Role title" required>
                    <button type="button" class="btn btn-danger remove-role" disabled>Remove</button>
                </div>
            `;
            
            setupRemoveRoleListeners();
            updateRemoveButtons();
            
            // Fetch updated startups
            fetchStartups();
            
            alert('Startup registered successfully!');
            
        } catch (error) {
            console.error('Error:', error);
            alert(error instanceof Error ? error.message : 'An error occurred');
        }
    }

    // Function to add a new role field
    function addRoleField() {
        const roleInputs = document.querySelectorAll('.role-input');
        if (roleInputs.length >= 5) {
            alert('You can add up to 5 roles only');
            return;
        }
        
        const newRoleField = document.createElement('div');
        newRoleField.className = 'input-group mb-2';
        newRoleField.innerHTML = `
            <input type="text" class="form-control role-input" placeholder="Role title" required>
            <button type="button" class="btn btn-danger remove-role">Remove</button>
        `;
        
        rolesContainer.appendChild(newRoleField);
        
        setupRemoveRoleListeners();
        updateRemoveButtons();
    }

    // Function to setup listeners for remove buttons
    function setupRemoveRoleListeners() {
        const removeButtons = document.querySelectorAll('.remove-role');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (this.parentElement) {
                    this.parentElement.remove();
                    updateRemoveButtons();
                }
            });
        });
    }

    // Function to update the state of remove buttons
    function updateRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-role');
        const roleInputs = document.querySelectorAll('.role-input');
        
        if (roleInputs.length <= 1) {
            removeButtons.forEach(button => {
                button.disabled = true;
            });
        } else {
            removeButtons.forEach(button => {
                button.disabled = false;
            });
        }
    }

    // Function to fetch startups from the API
    async function fetchStartups() {
        try {
            const response = await fetch('/api/startups');
            if (!response.ok) {
                throw new Error('Failed to fetch startups');
            }
            
            const startups = await response.json();
            
            if (startups.length > 0) {
                startupListContainer.style.display = 'block';
                renderStartups(startups);
            } else {
                startupListContainer.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error fetching startups:', error);
        }
    }

    // Function to render startups
    function renderStartups(startups) {
        startupList.innerHTML = '';
        
        startups.forEach(startup => {
            const startupCard = document.createElement('div');
            startupCard.className = 'col-md-6 mb-4';
            startupCard.innerHTML = `
                <div class="card startup-card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">${escapeHtml(startup.name)}</h5>
                        <small>Stage: ${escapeHtml(startup.stage)}</small>
                    </div>
                    <div class="card-body">
                        <p>${escapeHtml(startup.details)}</p>
                        <div class="roles mt-3">
                            <strong>Roles:</strong>
                            <div class="mt-2">
                                ${renderRoleBadges(startup.roles)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            startupList.appendChild(startupCard);
        });
    }

    // Function to render role badges
    function renderRoleBadges(roles) {
        return roles.map(role => 
            `<span class="role-badge">${escapeHtml(role.title)}</span>`
        ).join('');
    }

    // Function to escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}); 