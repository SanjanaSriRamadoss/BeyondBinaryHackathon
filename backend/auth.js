// Check if user is already logged in
window.addEventListener('DOMContentLoaded', function() {
    redirectIfAuthenticated('profile.html');
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate inputs
    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (!ValidationUtils.isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        
        if (userDoc.exists) {
            const user = { id: userDoc.id, ...userDoc.data() };
            
            // Store user data in localStorage for quick access
            StorageUtils.setCurrentUser(user);
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            showToast('Login successful! Redirecting...', 'success');
            
            // Redirect to profile after short delay
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        } else {
            throw new Error('User profile not found');
        }
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Invalid email or password';
        
        // Handle specific Firebase Auth errors
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'Invalid email or password';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
            default:
                errorMessage = error.message || 'Login failed. Please try again.';
        }
        
        showToast(errorMessage, 'error');
        
        // Add shake animation to form
        const form = document.getElementById('loginForm');
        AnimationUtils.shake(form);
    }
});