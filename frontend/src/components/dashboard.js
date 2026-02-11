// Dashboard JavaScript
const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const checkAuth = () => {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

let allActivities = [];
let activityToDelete = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    setupEventListeners();
    await loadStatistics();
    await loadActivities();
});

function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    document.getElementById('statusFilter')?.addEventListener('change', filterActivities);
    document.getElementById('sortBy')?.addEventListener('change', sortActivities);
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/activities/stats`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayStatistics(data.data);
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function displayStatistics(stats) {
    document.getElementById('totalActivities').textContent = stats.total || 0;
    document.getElementById('upcomingActivities').textContent = stats.upcoming || 0;
    
    const completed = stats.byStatus?.find(s => s._id === 'completed');
    document.getElementById('completedActivities').textContent = completed?.count || 0;
}

async function loadActivities() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const activitiesGrid = document.getElementById('activitiesGrid');

    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        activitiesGrid.style.display = 'none';

        const response = await fetch(`${API_URL}/activities/my-activities`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            allActivities = data.data || [];
            
            loadingState.style.display = 'none';

            if (allActivities.length === 0) {
                emptyState.style.display = 'flex';
            } else {
                activitiesGrid.style.display = 'grid';
                displayActivities(allActivities);
            }
        } else {
            throw new Error('Failed to load activities');
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        loadingState.style.display = 'none';
        alert('Failed to load activities. Please refresh the page.');
    }
}

function displayActivities(activities) {
    const grid = document.getElementById('activitiesGrid');
    
    if (activities.length === 0) {
        grid.innerHTML = '<p class="no-results">No activities match your filters.</p>';
        return;
    }

    grid.innerHTML = activities.map(activity => createActivityCard(activity)).join('');
}

function createActivityCard(activity) {
    const date = new Date(activity.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });

    const statusClass = `status-${activity.status}`;
    const statusText = activity.status.charAt(0).toUpperCase() + activity.status.slice(1);

    return `
        <div class="activity-card">
            <div class="activity-header">
                <div class="activity-category">${activity.category}</div>
                <div class="activity-status ${statusClass}">${statusText}</div>
            </div>
            
            <h3 class="activity-title">${escapeHtml(activity.title)}</h3>
            <p class="activity-description">${escapeHtml(activity.description)}</p>
            
            <div class="activity-details">
                <div class="detail-item">
                    <span>📅 ${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <span>🕐 ${activity.time}</span>
                </div>
                <div class="detail-item">
                    <span>📍 ${activity.location.city}</span>
                </div>
                <div class="detail-item">
                    <span>👥 ${activity.currentParticipants}/${activity.maxParticipants}</span>
                </div>
            </div>

            <div class="activity-actions">
                <button class="btn btn-sm btn-secondary" onclick="viewActivity('${activity._id}')">
                    View
                </button>
                <button class="btn btn-sm btn-primary" onclick="editActivity('${activity._id}')">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${activity._id}', '${escapeHtml(activity.title)}')">
                    Delete
                </button>
            </div>
        </div>
    `;
}

function filterActivities() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = allActivities;
    if (statusFilter) {
        filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    displayActivities(filtered);
}

function sortActivities() {
    const sortBy = document.getElementById('sortBy').value;
    
    let sorted = [...allActivities];
    
    if (sortBy === 'date') {
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'oldest') {
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    displayActivities(sorted);
}

function viewActivity(id) {
    window.location.href = `activity-details.html?id=${id}`;
}

function editActivity(id) {
    window.location.href = `edit-activity.html?id=${id}`;
}

function openDeleteModal(id, title) {
    activityToDelete = id;
    document.getElementById('deleteActivityName').textContent = title;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    activityToDelete = null;
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    if (!activityToDelete) return;

    try {
        const response = await fetch(`${API_URL}/activities/${activityToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (response.ok) {
            closeDeleteModal();
            alert('Activity deleted successfully');
            await loadStatistics();
            await loadActivities();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete activity');
        }
    } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Network error. Please try again.');
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        closeDeleteModal();
    }
}
