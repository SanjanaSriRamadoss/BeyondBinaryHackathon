// ===== SHARED UTILITY FUNCTIONS =====

// Toast Notification System
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ===== FIREBASE STORAGE UTILITIES =====
const StorageUtils = {
    
    // ===== USER OPERATIONS =====
    
    /**
     * Get all users from Firestore
     */
    async getUsers() {
        try {
            const snapshot = await db.collection('users').get();
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            return users;
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    },
    
    /**
     * Get current logged-in user from Firestore
     */
    async getCurrentUser() {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return null;
            
            const doc = await db.collection('users').doc(firebaseUser.uid).get();
            if (doc.exists) {
                const userData = { id: doc.id, ...doc.data() };
                // Cache locally for sync access
                this.setCurrentUserCache(userData);
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },
    
    /**
     * Get current user synchronously (uses cached data)
     */
    getCurrentUserSync() {
        try {
            return JSON.parse(localStorage.getItem('currentUser'));
        } catch (error) {
            return null;
        }
    },
    
    /**
     * Cache current user in localStorage
     */
    setCurrentUserCache(user) {
        try {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        } catch (error) {
            console.error('Error caching current user:', error);
            return false;
        }
    },
    
    // Alias for compatibility
    setCurrentUser(user) {
        return this.setCurrentUserCache(user);
    },
    
    /**
     * Create new user in Firestore
     */
    async createUser(userData) {
        try {
            const userId = auth.currentUser.uid;
            
            const newUser = {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                bio: userData.bio || '',
                location: userData.location || '',
                age: userData.age || null,
                interests: userData.interests || [],
                profilePicture: userData.profilePicture || '',
                
                // Questionnaire fields
                questionnaire: {},
                questionnaireCompleted: false,
                questionnaireDate: null,
                
                // Preferences for matching
                preferences: {
                    socialStyle: '',
                    preferredGroupSize: '',
                    activityLevel: '',
                    activityFrequency: '',
                    timePreference: '',
                    dayPreference: '',
                    budgetLevel: '',
                    environmentPreference: '',
                    commitmentLevel: ''
                },
                
                locationPreferences: {
                    maxDistance: 25,
                    preferredAreas: [],
                    transportMode: 'any',
                    willingToTravel: true
                },
                
                stats: {
                    activitiesJoined: 0,
                    eventsHosted: 0,
                    connections: 0
                },
                
                joinDate: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('users').doc(userId).set(newUser);
            
            const userWithId = { id: userId, ...newUser };
            this.setCurrentUserCache(userWithId);
            
            return userWithId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },
    
    /**
     * Update user in Firestore
     */
    async updateUser(updatedUser) {
        try {
            const userId = updatedUser.id;
            const { id, createdAt, joinDate, ...userData } = updatedUser;
            
            await db.collection('users').doc(userId).update({
                ...userData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.setCurrentUserCache(updatedUser);
            
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    },
    
    /**
     * Get users who have completed questionnaire (for matching)
     */
    async getUsersWithQuestionnaire() {
        try {
            const snapshot = await db.collection('users')
                .where('questionnaireCompleted', '==', true)
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            return users;
        } catch (error) {
            console.error('Error getting users with questionnaire:', error);
            return [];
        }
    },
    
    /**
     * Clear all data (logout)
     */
    clearAll() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberMe');
    }
};

// Validation Utilities
const ValidationUtils = {
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    getPasswordStrength(password) {
        if (password.length === 0) return null;
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        if (strength <= 1) return 'weak';
        if (strength <= 3) return 'medium';
        return 'strong';
    },
    
    updatePasswordStrengthUI(password, elementId = 'passwordStrength') {
        const strengthIndicator = document.getElementById(elementId);
        if (!strengthIndicator) return;
        
        const strength = this.getPasswordStrength(password);
        
        if (!strength) {
            strengthIndicator.className = 'password-strength';
        } else {
            strengthIndicator.className = `password-strength ${strength}`;
        }
        
        return strength;
    },
    
    passwordsMatch(password, confirmPassword) {
        return password === confirmPassword && password.length > 0;
    },
    
    validateForm(formData, requiredFields) {
        const errors = [];
        
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                errors.push(`${field} is required`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Format Utilities
const FormatUtils = {
    formatDate(isoString, format = 'long') {
        const date = new Date(isoString);
        const options = format === 'long' 
            ? { year: 'numeric', month: 'long', day: 'numeric' }
            : { year: 'numeric', month: 'short' };
        
        return date.toLocaleDateString('en-US', options);
    },
    
    formatJoinDate(isoString) {
        const date = new Date(isoString);
        const options = { year: 'numeric', month: 'long' };
        return `Joined ${date.toLocaleDateString('en-US', options)}`;
    },
    
    getInitials(firstName, lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    },
    
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
};

// Animation Utilities
const AnimationUtils = {
    fadeIn(element, duration = 400) {
        element.style.opacity = 0;
        element.style.display = 'block';
        
        let last = +new Date();
        const tick = function() {
            element.style.opacity = +element.style.opacity + (new Date() - last) / duration;
            last = +new Date();
            
            if (+element.style.opacity < 1) {
                (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
            }
        };
        
        tick();
    },
    
    fadeOut(element, duration = 400) {
        element.style.opacity = 1;
        
        let last = +new Date();
        const tick = function() {
            element.style.opacity = +element.style.opacity - (new Date() - last) / duration;
            last = +new Date();
            
            if (+element.style.opacity > 0) {
                (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
            } else {
                element.style.display = 'none';
            }
        };
        
        tick();
    },
    
    shake(element) {
        element.style.animation = 'shake 0.5s';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    },
    
    scrollToElement(element, offset = 0) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top,
            behavior: 'smooth'
        });
    }
};

// Interest Utilities
const InterestUtils = {
    emojiMap: {
        'hiking': '🥾',
        'photography': '📷',
        'cooking': '👨‍🍳',
        'yoga': '🧘',
        'gaming': '🎮',
        'reading': '📚',
        'music': '🎵',
        'fitness': '💪',
        'travel': '✈️',
        'art': '🎨',
        'cycling': '🚴',
        'movies': '🎬',
        'dancing': '💃',
        'sports': '⚽',
        'tech': '💻',
        'writing': '✍️',
        'coffee': '☕',
        'fashion': '👗',
        'food': '🍕',
        'nature': '🌿'
    },
    
    getEmoji(interest) {
        return this.emojiMap[interest.toLowerCase()] || '';
    },
    
    format(interest) {
        const emoji = this.getEmoji(interest);
        return emoji ? `${emoji} ${interest}` : interest;
    },
    
    isValid(interest) {
        return interest && interest.trim().length > 0 && interest.trim().length <= 30;
    }
};

// Character Counter Utility
function setupCharCounter(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    
    if (!input || !counter) return;
    
    input.addEventListener('input', function(e) {
        const length = e.target.value.length;
        counter.textContent = length;
        
        if (length > maxLength * 0.9) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }
    });
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check authentication - Firebase version
function checkAuth(redirectTo = 'index.html') {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            unsubscribe(); // Unsubscribe after first call
            
            if (!firebaseUser) {
                showToast('Please login first', 'error');
                setTimeout(() => {
                    window.location.href = redirectTo;
                }, 1000);
                resolve(null);
            } else {
                const user = await StorageUtils.getCurrentUser();
                resolve(user);
            }
        });
    });
}

// Redirect if authenticated
function redirectIfAuthenticated(redirectTo = 'profile.html') {
    auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            window.location.href = redirectTo;
        }
    });
}

// Logout function - Firebase version
async function logout() {
    try {
        await auth.signOut();
        StorageUtils.clearAll();
        showToast('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        StorageUtils,
        ValidationUtils,
        FormatUtils,
        AnimationUtils,
        InterestUtils,
        setupCharCounter,
        debounce,
        checkAuth,
        redirectIfAuthenticated,
        logout
    };
}