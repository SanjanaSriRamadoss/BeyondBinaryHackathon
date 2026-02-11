// Check authentication on page load
window.addEventListener('DOMContentLoaded', async function() {
    const user = await checkAuth('index.html');
    if (user) {
        await loadProfileData();
        setupCharCounter('editBio', 'editBioCount', 300);
    }
});

// Load profile data from Firestore
async function loadProfileData() {
    try {
        const user = await StorageUtils.getCurrentUser();
        if (!user) return;
        
        // Update profile header
        const initials = FormatUtils.getInitials(user.firstName, user.lastName);
        document.getElementById('avatarInitials').textContent = initials;
        document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileLocation').textContent = user.location || 'Location not set';
        
        // Format join date
        if (user.joinDate) {
            const joinDate = user.joinDate.toDate ? user.joinDate.toDate() : new Date(user.joinDate);
            document.getElementById('joinDate').textContent = FormatUtils.formatJoinDate(joinDate.toISOString());
        }
        
        // Update bio
        document.getElementById('profileBio').textContent = user.bio || 'No bio provided.';
        
        // Update interests
        loadInterests(user.interests);
        
        // Update questionnaire status
        updateQuestionnaireStatus(user);
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error loading profile data', 'error');
    }
}

// Update questionnaire status
function updateQuestionnaireStatus(user) {
    const container = document.getElementById('questionnaireStatus');
    
    if (user.questionnaireCompleted) {
        const questionnaireDate = user.questionnaireDate?.toDate ? 
            user.questionnaireDate.toDate() : 
            new Date(user.questionnaireDate);
            
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div class="questionnaire-badge completed">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.3 5.45801L6.66667 12.0913L3 8.42467" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Completed
                    </div>
                    <p class="bio-text" style="margin-top: 0.5rem;">
                        Completed on ${FormatUtils.formatDate(questionnaireDate.toISOString(), 'long')}
                    </p>
                </div>
                <button onclick="window.location.href='questionnaire.html'" class="btn btn-secondary">
                    Retake Questionnaire
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div class="questionnaire-badge incomplete">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 4V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Not Completed
                    </div>
                    <p class="bio-text" style="margin-top: 0.5rem;">
                        Help us match you with the right people by completing the questionnaire
                    </p>
                </div>
                <button onclick="window.location.href='questionnaire.html'" class="btn btn-primary">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4.16669V15.8334M4.16667 10H15.8333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Take Questionnaire
                </button>
            </div>
        `;
    }
}

// Load interests display
function loadInterests(interests) {
    const container = document.getElementById('interestsDisplay');
    
    if (!interests || interests.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No interests added yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    interests.forEach(interest => {
        const badge = document.createElement('span');
        badge.className = 'interest-badge';
        badge.textContent = InterestUtils.format(interest);
        container.appendChild(badge);
    });
}

// Edit profile
function editProfile() {
    const user = StorageUtils.getCurrentUserSync();
    if (!user) return;
    
    // Switch to edit mode with animation
    document.getElementById('viewMode').style.display = 'none';
    document.getElementById('editMode').style.display = 'block';
    document.getElementById('viewActions').style.display = 'none';
    document.getElementById('editActions').style.display = 'flex';
    
    // Add fade-in animation
    document.getElementById('editMode').classList.add('fade-in');
    
    // Populate edit fields
    document.getElementById('editFirstName').value = user.firstName;
    document.getElementById('editLastName').value = user.lastName;
    document.getElementById('editLocation').value = user.location || '';
    document.getElementById('editAge').value = user.age || '';
    document.getElementById('editBio').value = user.bio || '';
    
    // Update bio counter
    document.getElementById('editBioCount').textContent = (user.bio || '').length;
    
    // Load interests for editing
    loadEditInterests(user.interests);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load interests in edit mode
function loadEditInterests(interests) {
    const container = document.getElementById('interestsEditList');
    container.innerHTML = '';
    
    if (!interests || interests.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No interests added yet.</p>';
        return;
    }
    
    interests.forEach(interest => {
        const item = document.createElement('div');
        item.className = 'interest-edit-item';
        
        const formattedInterest = InterestUtils.format(interest);
        
        item.innerHTML = `
            <span>${formattedInterest}</span>
            <button type="button" class="remove-interest" onclick="removeInterestFromEdit('${interest.replace(/'/g, "\\'")}')">×</button>
        `;
        
        container.appendChild(item);
    });
}

// Add interest in edit mode
function addInterest() {
    const user = StorageUtils.getCurrentUserSync();
    if (!user) return;
    
    const input = document.getElementById('newInterest');
    const interest = input.value.trim().toLowerCase();
    
    if (!InterestUtils.isValid(interest)) {
        showToast('Please enter a valid interest (1-30 characters)', 'error');
        return;
    }
    
    if (user.interests.includes(interest)) {
        showToast('Interest already added', 'error');
        return;
    }
    
    user.interests.push(interest);
    StorageUtils.setCurrentUser(user);
    input.value = '';
    
    loadEditInterests(user.interests);
    showToast('Interest added', 'success');
}

// Remove interest from edit mode
function removeInterestFromEdit(interest) {
    const user = StorageUtils.getCurrentUserSync();
    if (!user) return;
    
    user.interests = user.interests.filter(i => i !== interest);
    StorageUtils.setCurrentUser(user);
    
    loadEditInterests(user.interests);
    showToast('Interest removed', 'success');
}

// Save profile changes to Firestore
async function saveProfile() {
    const user = StorageUtils.getCurrentUserSync();
    if (!user) return;
    
    // Get updated values
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const location = document.getElementById('editLocation').value.trim();
    const age = document.getElementById('editAge').value;
    const bio = document.getElementById('editBio').value.trim();
    
    // Validation
    if (!firstName || !lastName) {
        showToast('First name and last name are required', 'error');
        return;
    }
    
    try {
        // Update user object
        const updates = {
            firstName,
            lastName,
            location,
            age: age ? parseInt(age) : null,
            bio,
            interests: user.interests,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update in Firestore
        await db.collection('users').doc(user.id).update(updates);
        
        // Update localStorage cache
        const updatedUser = { ...user, ...updates };
        StorageUtils.setCurrentUser(updatedUser);
        
        // Switch back to view mode
        cancelEdit();
        
        // Reload profile data
        await loadProfileData();
        
        showToast('Profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile. Please try again.', 'error');
    }
}

// Cancel edit
function cancelEdit() {
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    document.getElementById('viewActions').style.display = 'flex';
    document.getElementById('editActions').style.display = 'none';
    
    // Add fade-in animation
    document.getElementById('viewMode').classList.add('fade-in');
    
    // Reload original data
    loadProfileData();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Enter key for adding interest
document.getElementById('newInterest').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addInterest();
    }
});

// Make functions global
window.editProfile = editProfile;
window.saveProfile = saveProfile;
window.cancelEdit = cancelEdit;
window.addInterest = addInterest;
window.removeInterestFromEdit = removeInterestFromEdit;