// ===== SIGNUP FLOW =====
// Step management
let currentStep = 1;
let signupData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    bio: '',
    location: '',
    age: null,
    interests: []
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    redirectIfAuthenticated('profile.html');
    
    // Setup character counter for bio
    setupCharCounter('bio', 'bioCount', 300);
    
    // Setup password strength indicator (only if element exists)
    const passwordInput = document.getElementById('signupPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            ValidationUtils.updatePasswordStrengthUI(e.target.value, 'passwordStrength');
        });
    }
    
    // Setup custom interest input (only if element exists)
    const customInterestInput = document.getElementById('customInterest');
    if (customInterestInput) {
        customInterestInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomInterest();
            }
        });
    }
    
    // Setup interest chips (only if elements exist)
    const interestChips = document.querySelectorAll('.interest-chip');
    if (interestChips.length > 0) {
        interestChips.forEach(chip => {
            chip.addEventListener('click', function() {
                toggleInterest(this.dataset.interest, this);
            });
        });
    }
    
    // Setup form handlers
    setupFormHandlers();
});

// Setup all form submit handlers
function setupFormHandlers() {
    // Step 1: Account Form
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountSubmit);
    }
    
    // Step 2: Profile Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Step 3: Interests Form
    const interestsForm = document.getElementById('interestsForm');
    if (interestsForm) {
        interestsForm.addEventListener('submit', handleInterestsSubmit);
    }
}

// Handle Step 1: Account Creation
async function handleAccountSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate inputs
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (!ValidationUtils.isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    if (!ValidationUtils.passwordsMatch(password, confirmPassword)) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        // Check if email already exists using Firebase Auth
        const methods = await firebase.auth().fetchSignInMethodsForEmail(email);
        if (methods.length > 0) {
            showToast('Email already registered', 'error');
            return;
        }
        
        // Store data and move to next step
        signupData.firstName = firstName;
        signupData.lastName = lastName;
        signupData.email = email;
        signupData.password = password;
        
        goToStep(2);
    } catch (error) {
        console.error('Error checking email:', error);
        
        // If the error is auth/invalid-email, show that message
        if (error.code === 'auth/invalid-email') {
            showToast('Invalid email address', 'error');
        } else {
            // For other errors, we can still proceed to step 2
            // as the actual signup will happen in step 3
            signupData.firstName = firstName;
            signupData.lastName = lastName;
            signupData.email = email;
            signupData.password = password;
            goToStep(2);
        }
    }
}

// Handle Step 2: Profile Setup
function handleProfileSubmit(e) {
    e.preventDefault();
    
    const bio = document.getElementById('bio')?.value.trim() || '';
    const location = document.getElementById('location')?.value.trim() || '';
    const age = document.getElementById('age')?.value || null;
    
    // Store data
    signupData.bio = bio;
    signupData.location = location;
    signupData.age = age ? parseInt(age) : null;
    
    goToStep(3);
}

// Handle Step 3: Interests & Complete Signup
async function handleInterestsSubmit(e) {
    e.preventDefault();
    
    // Validate at least one interest
    if (signupData.interests.length === 0) {
        showToast('Please select at least one interest', 'error');
        return;
    }
    
    try {
        showToast('Creating your account...', 'info');
        
        // Create Firebase Auth account
        const userCredential = await firebase.auth()
            .createUserWithEmailAndPassword(signupData.email, signupData.password);
        
        const firebaseUser = userCredential.user;
        
        // Create user profile in Firestore
        const userData = {
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email: signupData.email,
            bio: signupData.bio,
            location: signupData.location,
            age: signupData.age,
            interests: signupData.interests
        };
        
        const newUser = await StorageUtils.createUser(userData);
        
        showToast('Account created successfully! Redirecting...', 'success');
        
        // Redirect to profile
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Failed to create account. Please try again.';
        
        // Handle specific Firebase Auth errors
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email already in use';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
        }
        
        showToast(errorMessage, 'error');
    }
}

// Navigate between steps
function goToStep(step) {
    // Hide all steps
    for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step${i}`);
        const progressStep = document.querySelector(`.progress-step[data-step="${i}"]`);
        
        if (stepEl) {
            stepEl.style.display = 'none';
        }
        
        if (progressStep) {
            progressStep.classList.remove('active');
        }
    }
    
    // Show target step
    const targetStep = document.getElementById(`step${step}`);
    const targetProgress = document.querySelector(`.progress-step[data-step="${step}"]`);
    
    if (targetStep) {
        targetStep.style.display = 'block';
    }
    
    if (targetProgress) {
        targetProgress.classList.add('active');
    }
    
    currentStep = step;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toggle interest selection
function toggleInterest(interest, chipElement) {
    const index = signupData.interests.indexOf(interest);
    
    if (index > -1) {
        // Remove interest
        signupData.interests.splice(index, 1);
        chipElement.classList.remove('selected');
        removeSelectedInterestChip(interest);
    } else {
        // Add interest (max 10)
        if (signupData.interests.length >= 10) {
            showToast('Maximum 10 interests allowed', 'error');
            return;
        }
        signupData.interests.push(interest);
        chipElement.classList.add('selected');
        addSelectedInterestChip(interest);
    }
    
    updateInterestCount();
}

// Add custom interest
function addCustomInterest() {
    const input = document.getElementById('customInterest');
    if (!input) return;
    
    const interest = input.value.trim().toLowerCase();
    
    if (!interest) {
        showToast('Please enter an interest', 'error');
        return;
    }
    
    if (!InterestUtils.isValid(interest)) {
        showToast('Interest must be 1-30 characters', 'error');
        return;
    }
    
    if (signupData.interests.includes(interest)) {
        showToast('Interest already added', 'error');
        return;
    }
    
    if (signupData.interests.length >= 10) {
        showToast('Maximum 10 interests allowed', 'error');
        return;
    }
    
    // Add interest
    signupData.interests.push(interest);
    addSelectedInterestChip(interest);
    updateInterestCount();
    
    input.value = '';
    showToast(`Added "${interest}"`, 'success');
}

// Add selected interest chip to display
function addSelectedInterestChip(interest) {
    const container = document.getElementById('selectedInterests');
    const containerWrapper = document.getElementById('selectedInterestsContainer');
    
    if (!container) return;
    
    const chip = document.createElement('div');
    chip.className = 'selected-interest-chip';
    chip.dataset.interest = interest;
    chip.innerHTML = `
        <span>${InterestUtils.format(interest)}</span>
        <button type="button" onclick="removeInterest('${interest}')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    `;
    
    container.appendChild(chip);
    
    if (containerWrapper) {
        containerWrapper.style.display = 'block';
    }
}

// Remove selected interest chip
function removeSelectedInterestChip(interest) {
    const chip = document.querySelector(`.selected-interest-chip[data-interest="${interest}"]`);
    if (chip) {
        chip.remove();
    }
    
    const container = document.getElementById('selectedInterestsContainer');
    const selectedInterests = document.getElementById('selectedInterests');
    
    if (container && selectedInterests && selectedInterests.children.length === 0) {
        container.style.display = 'none';
    }
}

// Remove interest (from selected list)
function removeInterest(interest) {
    const index = signupData.interests.indexOf(interest);
    if (index > -1) {
        signupData.interests.splice(index, 1);
    }
    
    removeSelectedInterestChip(interest);
    
    // Also unselect from popular interests if applicable
    const popularChip = document.querySelector(`.interest-chip[data-interest="${interest}"]`);
    if (popularChip) {
        popularChip.classList.remove('selected');
    }
    
    updateInterestCount();
}

// Update interest count display
function updateInterestCount() {
    const countEl = document.getElementById('interestCount');
    if (countEl) {
        countEl.textContent = signupData.interests.length;
    }
}

// Make functions globally accessible
window.goToStep = goToStep;
window.addCustomInterest = addCustomInterest;
window.removeInterest = removeInterest;
