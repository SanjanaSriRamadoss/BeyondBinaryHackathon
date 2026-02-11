/**
 * Activities Page - Main Logic
 * Handles activity browsing, filtering, and interactions
 */

// Check authentication on page load
window.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth('index.html');
    if (user) {
        initializeActivitiesPage();
    }
});

let currentView = 'recommended';
let currentFilters = {};
let selectedActivityInterests = new Set();

//  ===== INITIALIZATION =====

function initializeActivitiesPage() {
    // Initialize sample activities if none exist
    ActivityService.initializeSampleData();
    
    // Load interest filter options
    loadInterestFilterOptions();
    
    // Load activities
    loadActivities();
    
    // Load matched users
    loadMatchedUsers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Populate create modal interests
    populateCreateModalInterests();
}

function setupEventListeners() {
    // Search and filters
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('interestFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    document.getElementById('locationFilter').addEventListener('input', debounce(applyFilters, 300));
    
    // Create activity form
    document.getElementById('createActivityForm').addEventListener('submit', handleCreateActivity);
}

// ===== VIEW SWITCHING =====

function switchView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    // Update title
    const titles = {
        'recommended': { title: 'Recommended For You', subtitle: 'Activities matched to your interests' },
        'all': { title: 'All Activities', subtitle: 'Browse all available activities' },
        'joined': { title: 'My Activities', subtitle: 'Activities you\'ve joined or created' }
    };
    
    document.getElementById('mainTitle').textContent = titles[view].title;
    document.getElementById('mainSubtitle').textContent = titles[view].subtitle;
    
    // Reload activities
    loadActivities();
}

// ===== LOAD ACTIVITIES =====

function loadActivities() {
    const user = StorageUtils.getCurrentUser();
    const grid = document.getElementById('activitiesGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    // Show loading
    loadingState.style.display = 'flex';
    grid.style.display = 'none';
    emptyState.style.display = 'none';
    
    // Simulate async loading
    setTimeout(() => {
        let activities = [];
        
        switch (currentView) {
            case 'recommended':
                activities = RecommendationService.getRecommendations(user.id, {
                    limit: 20,
                    minScore: 20
                });
                break;
            
            case 'all':
                activities = ActivityService.getUpcomingActivities().map(activity => ({
                    ...activity,
                    matchData: RecommendationService.scoreActivity(user, activity)
                }));
                break;
            
            case 'joined':
                activities = ActivityService.getJoinedActivities(user.id).map(activity => ({
                    ...activity,
                    matchData: RecommendationService.scoreActivity(user, activity)
                }));
                break;
        }
        
        // Apply filters
        activities = applyFiltersToActivities(activities);
        
        // Hide loading
        loadingState.style.display = 'none';
        
        if (activities.length === 0) {
            emptyState.style.display = 'flex';
            grid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            grid.style.display = 'grid';
            renderActivities(activities);
        }
    }, 300);
}

function renderActivities(activities) {
    const grid = document.getElementById('activitiesGrid');
    const user = StorageUtils.getCurrentUser();
    
    grid.innerHTML = activities.map(activity => {
        const matchData = activity.matchData;
        const matchColor = getMatchColor(matchData.totalScore);
        const isJoined = activity.participants.includes(user.id);
        const isCreator = activity.createdBy === user.id;
        const isFull = activity.participants.length >= activity.maxParticipants;
        
        return `
            <div class="activity-card" onclick="showActivityDetail('${activity.id}')">
                ${currentView === 'recommended' ? `
                    <div class="match-badge" style="background-color: ${matchColor}">
                        <span class="match-score">${matchData.totalScore}</span>
                        <span class="match-label">${getMatchLabel(matchData.totalScore)}</span>
                    </div>
                ` : ''}
                
                <div class="activity-content">
                    <h3 class="activity-title">${activity.title}</h3>
                    <p class="activity-description">${activity.description}</p>
                    
                    ${matchData.interestMatch.matchedInterests.length > 0 ? `
                        <div class="interest-match">
                            <div class="match-header">
                                <span class="match-icon">✨</span>
                                <span class="compatibility-label">${RecommendationService.getCompatibilityLabel(matchData.interestMatch.percentage)}</span>
                                <span class="match-percentage">${matchData.interestMatch.percentage}%</span>
                            </div>
                            <div class="matched-interests">
                                ${matchData.interestMatch.matchedInterests.slice(0, 3).map(interest => 
                                    `<span class="interest-tag matched">${InterestUtils.format(interest)}</span>`
                                ).join('')}
                                ${matchData.interestMatch.matchedInterests.length > 3 ? 
                                    `<span class="interest-tag">+${matchData.interestMatch.matchedInterests.length - 3} more</span>` 
                                    : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="activity-details">
                        <div class="detail-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span>${formatActivityDate(activity.date)}</span>
                        </div>
                        
                        <div class="detail-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>${activity.location.name}</span>
                        </div>
                        
                        <div class="detail-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            <span>${activity.participants.length}/${activity.maxParticipants} joined</span>
                        </div>
                    </div>
                    
                    <div class="activity-actions">
                        ${isCreator ? `
                            <span class="badge badge-creator">Your Activity</span>
                        ` : isJoined ? `
                            <span class="badge badge-joined">✓ Joined</span>
                        ` : isFull ? `
                            <span class="badge badge-full">Full</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ACTIVITY DETAIL MODAL =====

function showActivityDetail(activityId) {
    const activity = ActivityService.getActivityById(activityId);
    if (!activity) {
        showToast('Activity not found', 'error');
        return;
    }
    
    const user = StorageUtils.getCurrentUser();
    const matchData = RecommendationService.scoreActivity(user, activity);
    const isJoined = activity.participants.includes(user.id);
    const isCreator = activity.createdBy === user.id;
    const isFull = activity.participants.length >= activity.maxParticipants;
    
    const modal = document.getElementById('activityDetailModal');
    const content = document.getElementById('activityDetailContent');
    
    // Get creator info
    const creator = StorageUtils.getUsers().find(u => u.id === activity.createdBy);
    
    content.innerHTML = `
        <div class="activity-detail-full">
            <div class="detail-main">
                <h1>${activity.title}</h1>
                
                <div class="detail-meta">
                    <div class="meta-item">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>${formatActivityDate(activity.date)}</span>
                    </div>
                    
                    <div class="meta-item">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${activity.location.name}</span>
                    </div>
                    
                    <div class="meta-item">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                        </svg>
                        <span>${activity.participants.length}/${activity.maxParticipants} participants</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Description</h3>
                    <p>${activity.description}</p>
                </div>
                
                <div class="detail-section">
                    <h3>Interests</h3>
                    <div class="interests-display">
                        ${activity.interests.map(i => `<span class="interest-badge">${InterestUtils.format(i)}</span>`).join('')}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Hosted By</h3>
                    <div class="host-info">
                        <div class="avatar-small">${creator ? FormatUtils.getInitials(creator.firstName, creator.lastName) : '?'}</div>
                        <span>${creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown'}</span>
                    </div>
                </div>
                
                ${!isCreator && matchData.interestMatch.totalMatches > 0 ? `
                    <div class="detail-section">
                        <h3>Why You'll Love This</h3>
                        <div class="match-explanation">
                            <div class="match-stat">
                                <span class="match-stat-label">Match Score</span>
                                <span class="match-stat-value" style="color: ${getMatchColor(matchData.totalScore)}">${matchData.totalScore}/100</span>
                            </div>
                            <div class="match-stat">
                                <span class="match-stat-label">Interest Match</span>
                                <span class="match-stat-value">${matchData.interestMatch.percentage}%</span>
                            </div>
                            <div class="match-breakdown">
                                <p>You share ${matchData.interestMatch.totalMatches} interest${matchData.interestMatch.totalMatches !== 1 ? 's' : ''} with this activity:</p>
                                <div class="matched-interests">
                                    ${matchData.interestMatch.matchedInterests.map(i => `<span class="interest-tag matched">${InterestUtils.format(i)}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="detail-actions">
                    ${isCreator ? `
                        <button class="btn btn-text" onclick="deleteActivity('${activity.id}')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M2.5 5H4.16667M4.16667 5H17.5M4.16667 5V16.6667C4.16667 17.1087 4.34226 17.5326 4.65482 17.8452C4.96738 18.1577 5.39131 18.3333 5.83333 18.3333H14.1667C14.6087 18.3333 15.0326 18.1577 15.3452 17.8452C15.6577 17.5326 15.8333 17.1087 15.8333 16.6667V5H4.16667ZM6.66667 5V3.33333C6.66667 2.89131 6.84226 2.46738 7.15482 2.15482C7.46738 1.84226 7.89131 1.66667 8.33333 1.66667H11.6667C12.1087 1.66667 12.5326 1.84226 12.8452 2.15482C13.1577 2.46738 13.3333 2.89131 13.3333 3.33333V5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete Activity
                        </button>
                        <button class="btn btn-primary" onclick="closeDetailModal()">Close</button>
                    ` : isJoined ? `
                        <button class="btn btn-text" onclick="leaveActivity('${activity.id}')">Leave Activity</button>
                        <button class="btn btn-primary" onclick="closeDetailModal()">Close</button>
                    ` : isFull ? `
                        <button class="btn btn-primary" disabled>Activity Full</button>
                    ` : `
                        <button class="btn btn-text" onclick="closeDetailModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="joinActivity('${activity.id}')">Join Activity</button>
                    `}
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeDetailModal() {
    document.getElementById('activityDetailModal').style.display = 'none';
}

// ===== JOIN / LEAVE ACTIVITY =====

function joinActivity(activityId) {
    const user = StorageUtils.getCurrentUser();
    const result = ActivityService.joinActivity(activityId, user.id);
    
    if (result.success) {
        showToast('Successfully joined activity!', 'success');
        closeDetailModal();
        loadActivities();
    } else {
        showToast(result.error, 'error');
    }
}

function leaveActivity(activityId) {
    const user = StorageUtils.getCurrentUser();
    const result = ActivityService.leaveActivity(activityId, user.id);
    
    if (result.success) {
        showToast('Left activity', 'success');
        closeDetailModal();
        loadActivities();
    } else {
        showToast(result.error, 'error');
    }
}

function deleteActivity(activityId) {
    if (!confirm('Are you sure you want to delete this activity? This cannot be undone.')) {
        return;
    }
    
    const result = ActivityService.deleteActivity(activityId);
    
    if (result.success) {
        showToast('Activity deleted', 'success');
        closeDetailModal();
        loadActivities();
    } else {
        showToast(result.error, 'error');
    }
}

// ===== CREATE ACTIVITY =====

function createNewActivity() {
    document.getElementById('createActivityModal').style.display = 'flex';
}

function closeCreateModal() {
    document.getElementById('createActivityModal').style.display = 'none';
    document.getElementById('createActivityForm').reset();
    selectedActivityInterests.clear();
    updateSelectedActivityInterests();
}

function populateCreateModalInterests() {
    const grid = document.getElementById('activityInterestsGrid');
    const user = StorageUtils.getCurrentUser();
    const allInterests = [...new Set([...user.interests, 'hiking', 'photography', 'cooking', 'yoga', 'gaming', 'reading'])];
    
    grid.innerHTML = allInterests.map(interest => `
        <button type="button" class="interest-chip" onclick="toggleActivityInterest('${interest}')">
            ${InterestUtils.format(interest)}
        </button>
    `).join('');
}

function toggleActivityInterest(interest) {
    if (selectedActivityInterests.has(interest)) {
        selectedActivityInterests.delete(interest);
    } else {
        selectedActivityInterests.add(interest);
    }
    updateSelectedActivityInterests();
}

function updateSelectedActivityInterests() {
    const container = document.getElementById('selectedActivityInterests');
    const chips = document.querySelectorAll('#activityInterestsGrid .interest-chip');
    
    chips.forEach(chip => {
        const interest = chip.textContent.trim().toLowerCase().replace(/[^\w\s]/g, '').trim();
        if (selectedActivityInterests.has(interest)) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });
    
    if (selectedActivityInterests.size > 0) {
        container.innerHTML = `
            <div class="selected-label">Selected: ${selectedActivityInterests.size} interest${selectedActivityInterests.size !== 1 ? 's' : ''}</div>
        `;
    } else {
        container.innerHTML = '';
    }
}

function handleCreateActivity(e) {
    e.preventDefault();
    
    if (selectedActivityInterests.size === 0) {
        showToast('Please select at least one interest', 'error');
        return;
    }
    
    const user = StorageUtils.getCurrentUser();
    
    const activityData = {
        title: document.getElementById('activityTitle').value.trim(),
        description: document.getElementById('activityDescription').value.trim(),
        date: new Date(document.getElementById('activityDate').value).toISOString(),
        maxParticipants: parseInt(document.getElementById('activityMaxParticipants').value),
        location: {
            name: document.getElementById('activityLocation').value.trim(),
            lat: 37.7749, // Default SF coordinates - in real app, use geocoding
            lng: -122.4194
        },
        interests: Array.from(selectedActivityInterests)
    };
    
    const result = ActivityService.createActivity(activityData, user.id);
    
    if (result.success) {
        showToast('Activity created successfully!', 'success');
        closeCreateModal();
        switchView('joined');
    } else {
        showToast(result.error, 'error');
    }
}

// ===== MATCHED USERS =====

function loadMatchedUsers() {
    const user = StorageUtils.getCurrentUser();
    const matchedUsers = RecommendationService.findMatchedUsers(user.id, { limit: 5, minOverlap: 1 });
    const container = document.getElementById('matchedUsersList');
    
    if (matchedUsers.length === 0) {
        container.innerHTML = '<p class="empty-text">No matched users yet</p>';
        return;
    }
    
    container.innerHTML = matchedUsers.map(matchedUser => `
        <div class="matched-user-card">
            <div class="avatar-small">${FormatUtils.getInitials(matchedUser.firstName, matchedUser.lastName)}</div>
            <div class="matched-user-info">
                <div class="matched-user-name">${matchedUser.firstName} ${matchedUser.lastName}</div>
                <div class="matched-user-match">${matchedUser.interestMatch.percentage}% match</div>
                <div class="matched-user-interests">
                    ${matchedUser.interestMatch.matchedInterests.slice(0, 2).map(i => 
                        `<span class="interest-tag-tiny">${i}</span>`
                    ).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// ===== FILTERS =====

function loadInterestFilterOptions() {
    const user = StorageUtils.getCurrentUser();
    const select = document.getElementById('interestFilter');
    
    const allInterests = new Set();
    user.interests.forEach(i => allInterests.add(i));
    ActivityService.getAllActivities().forEach(a => {
        a.interests.forEach(i => allInterests.add(i));
    });
    
    Array.from(allInterests).sort().forEach(interest => {
        const option = document.createElement('option');
        option.value = interest;
        option.textContent = InterestUtils.format(interest);
        select.appendChild(option);
    });
}

function applyFilters() {
    currentFilters = {
        search: document.getElementById('searchInput').value.toLowerCase(),
        interest: document.getElementById('interestFilter').value,
        date: document.getElementById('dateFilter').value,
        location: document.getElementById('locationFilter').value.toLowerCase()
    };
    
    loadActivities();
}

function applyFiltersToActivities(activities) {
    return activities.filter(activity => {
        // Search filter
        if (currentFilters.search && 
            !activity.title.toLowerCase().includes(currentFilters.search) &&
            !activity.description.toLowerCase().includes(currentFilters.search)) {
            return false;
        }
        
        // Interest filter
        if (currentFilters.interest && 
            !activity.interests.includes(currentFilters.interest)) {
            return false;
        }
        
        // Date filter
        if (currentFilters.date) {
            const filterDate = new Date(currentFilters.date);
            const activityDate = new Date(activity.date);
            if (activityDate.toDateString() !== filterDate.toDateString()) {
                return false;
            }
        }
        
        // Location filter
        if (currentFilters.location && 
            !activity.location.name.toLowerCase().includes(currentFilters.location)) {
            return false;
        }
        
        return true;
    });
}

// ===== UTILITY FUNCTIONS =====

function formatActivityDate(isoString) {
    const date = new Date(isoString);
    const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function getMatchColor(score) {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 60) return '#3b82f6'; // Blue
    if (score >= 40) return '#f59e0b'; // Orange
    return '#6b7280'; // Gray
}

function getMatchLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Great';
    if (score >= 40) return 'Good';
    return 'Fair';
}

// Make functions global
window.switchView = switchView;
window.showActivityDetail = showActivityDetail;
window.closeDetailModal = closeDetailModal;
window.joinActivity = joinActivity;
window.leaveActivity = leaveActivity;
window.deleteActivity = deleteActivity;
window.createNewActivity = createNewActivity;
window.closeCreateModal = closeCreateModal;
window.toggleActivityInterest = toggleActivityInterest;

// Initialize matched users display
window.addEventListener('DOMContentLoaded', async function() {
    const user = await checkAuth('index.html');
    if (user) {
        // Initialize matched users in sidebar
        await MatchedUsersDisplay.init('matchedUsersList');
        
        // ... rest of your initialization code
    }
});