// Check authentication on page load
window.addEventListener('DOMContentLoaded', async function() {
    const user = await checkAuth('index.html');
    if (user) {
        initializeQuestionnaire();
    }
});

// Section navigation
let currentSection = 1;
const totalSections = 6;
let sections, prevBtn, nextBtn, submitBtn, progressFill;

// Initialize questionnaire
function initializeQuestionnaire() {
    // Select elements after DOM is ready
    sections = document.querySelectorAll('.question-section');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    submitBtn = document.getElementById('submitBtn');
    progressFill = document.getElementById('progressFill');
    
    document.getElementById('totalSections').textContent = totalSections;
    showSection(1);
    
    // Setup character counter if final message exists
    const finalMessage = document.getElementById('final_message');
    if (finalMessage) {
        setupCharCounter('final_message', 'finalMessageCount', 300);
    }
    
    // Setup event listeners after elements exist
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Next button
    nextBtn.addEventListener('click', () => {
        if (validateSection(currentSection)) {
            currentSection++;
            showSection(currentSection);
            showToast('Section completed!', 'success');
        }
    });

    // Previous button
    prevBtn.addEventListener('click', () => {
        currentSection--;
        showSection(currentSection);
    });

    // Form submission
    document.getElementById('questionnaireForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateSection(currentSection)) {
            return;
        }
        
        const firebaseUser = auth.currentUser;
        
        if (!firebaseUser) {
            showToast('Please login first', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving...</span>';
        
        try {
            // Collect questionnaire data
            const questionnaireData = collectFormData();
            
            // Update user document in Firestore
            await db.collection('users').doc(firebaseUser.uid).update({
                questionnaire: questionnaireData,
                questionnaireCompleted: true,
                questionnaireDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update localStorage cache
            const currentUser = StorageUtils.getCurrentUserSync();
            if (currentUser) {
                currentUser.questionnaire = questionnaireData;
                currentUser.questionnaireCompleted = true;
                currentUser.questionnaireDate = new Date().toISOString();
                StorageUtils.setCurrentUser(currentUser);
            }
            
            showToast('Questionnaire completed! Redirecting to profile...', 'success');
            
            // Redirect to profile
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error saving questionnaire:', error);
            showToast('Error saving questionnaire. Please try again.', 'error');
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Submit Questionnaire</span>';
        }
    });
}

// Update progress
function updateProgress() {
    const progress = (currentSection / totalSections) * 100;
    progressFill.style.width = `${progress}%`;
    document.getElementById('currentSection').textContent = currentSection;
}

// Show section
function showSection(sectionNum) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.querySelector(`.question-section[data-section="${sectionNum}"]`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update buttons
    prevBtn.style.display = sectionNum === 1 ? 'none' : 'flex';
    nextBtn.style.display = sectionNum === totalSections ? 'none' : 'flex';
    submitBtn.style.display = sectionNum === totalSections ? 'flex' : 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    updateProgress();
}

// Validate current section
function validateSection(sectionNum) {
    const section = document.querySelector(`.question-section[data-section="${sectionNum}"]`);
    
    // Check if section exists
    if (!section) {
        console.error(`Section ${sectionNum} not found`);
        return true; // Skip validation if section doesn't exist
    }
    
    const requiredInputs = section.querySelectorAll('[required]');
    
    for (let input of requiredInputs) {
        // For radio buttons, check if any in the group is selected
        if (input.type === 'radio') {
            const name = input.name;
            const radioGroup = section.querySelectorAll(`input[name="${name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            
            if (!isChecked) {
                const questionBlock = input.closest('.question-block');
                const label = questionBlock.querySelector('.question-label').textContent;
                showToast(`Please answer: ${label}`, 'error');
                
                // Scroll to the question
                AnimationUtils.scrollToElement(questionBlock, 100);
                return false;
            }
        }
        // For text inputs and textareas
        else if (input.value.trim() === '') {
            const questionBlock = input.closest('.question-block');
            const label = questionBlock.querySelector('.question-label').textContent;
            showToast(`Please answer: ${label}`, 'error');
            
            AnimationUtils.scrollToElement(questionBlock, 100);
            return false;
        }
    }
    
    return true;
}

// Collect form data
function collectFormData() {
    const formData = new FormData(document.getElementById('questionnaireForm'));
    const data = {};
    
    // Handle regular inputs (radio, text, textarea)
    for (let [key, value] of formData.entries()) {
        // Handle checkboxes - collect multiple values
        if (key.includes('weapons') || key.includes('multiple')) {
            if (!data[key]) {
                data[key] = [];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    
    return data;
}