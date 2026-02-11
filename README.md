# BeyondBinary ActivityApp

A Firebase-powered social activity matching platform that helps users find compatible activity partners based on preferences, interests, and personality traits.

## 🌟 Features

- **User Authentication**: Secure email/password authentication with Firebase Auth
- **Personalized Questionnaire**: Comprehensive personality assessment
- **Smart Matching Algorithm**: AI-powered matching based on compatibility scores
- **Activity Management**: Create, edit, and browse activities
- **Real-time Updates**: Firebase Firestore real-time database
- **Profile Management**: Detailed user profiles with interests and preferences
- **Activity Recommendations**: Personalized activity suggestions
- **Responsive Design**: Mobile-friendly UI with modern styling

## 🔧 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Storage
- **Styling**: Custom CSS with Google Fonts (DM Sans)
- **APIs**: Firebase SDK v10.7.1

## 📁 Project Structure

```
beyondbinary-activityapp/
├── index.html              # Login page
├── signup.html             # Registration page
├── profile.html            # User profile page
├── questionnaire.html      # Personality questionnaire
├── activities.html         # Browse all activities
├── activity-matcher.html   # Activity matching interface
├── styles.css             # Global styles
│
├── firebase-config.js     # Firebase initialization
├── auth.js               # Authentication logic
├── signup.js             # Registration logic
├── utils.js              # Shared utility functions
│
├── profile.js            # Profile management
├── questionnaire.js      # Questionnaire logic
├── activities.js         # Activity browsing
├── activity-service.js   # Activity CRUD operations
├── create-activity.js    # Activity creation
├── edit-activity.js      # Activity editing
│
├── matching-service-complete.js  # Complete matching algorithm
├── matchingservice.js           # Matching utilities
├── recommendation-service.js    # Recommendation engine
├── recomendations.js           # Recommendations display
├── events.js                   # Event handling
│
└── Server-side files (for reference):
    ├── Activity.js          # Activity model
    ├── activityRoutes.js    # Activity routes
    ├── activityService.js   # Activity business logic
    └── activityValidator.js # Activity validation
```

## 🚀 Setup Instructions

### Prerequisites

1. Node.js (v14 or higher) - Optional, only needed for local development server
2. A Firebase account
3. Modern web browser (Chrome, Firefox, Safari, Edge)

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Authentication**
   - In Firebase Console, go to Authentication
   - Click "Get Started"
   - Enable "Email/Password" sign-in method

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Start in **production mode** (or test mode for development)
   - Choose a location closest to your users

4. **Setup Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users collection
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Activities collection
       match /activities/{activityId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null 
           && resource.data.creatorId == request.auth.uid;
       }
       
       // Matches collection
       match /matches/{matchId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

5. **Enable Firebase Storage**
   - Go to Storage
   - Click "Get Started"
   - Set up storage rules for profile pictures

6. **Get Your Firebase Config**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Copy your Firebase configuration
   - Replace the config in `firebase-config.js`

### Installation

1. **Clone or download this repository**

2. **Update Firebase Configuration**
   - Open `firebase-config.js`
   - Replace the config object with your Firebase project credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };
   ```

3. **Run the Application**
   
   **Option A: Using a Local Server (Recommended)**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # OR using Python 2
   python -m SimpleHTTPServer 8000
   
   # OR using Node.js http-server
   npx http-server -p 8000
   ```
   
   Then open: `http://localhost:8000`

   **Option B: Using Live Server (VS Code)**
   - Install "Live Server" extension in VS Code
   - Right-click on `index.html`
   - Select "Open with Live Server"

   **Option C: Direct File Opening**
   - Simply open `index.html` in your browser
   - Note: Some features may not work due to CORS restrictions

## 📱 How to Use

### For New Users

1. **Sign Up**
   - Open the app and click "Create one now"
   - Fill in your details (name, email, password)
   - Complete the initial profile setup

2. **Complete Questionnaire**
   - Navigate to the questionnaire
   - Answer all personality and preference questions
   - This helps the matching algorithm find compatible partners

3. **Browse Activities**
   - Go to Activities page
   - Browse available activities
   - Filter by category, date, or location

4. **Find Matches**
   - Use the Activity Matcher
   - Get matched with compatible users
   - View compatibility scores and shared interests

5. **Create Activities**
   - Share your own activities
   - Set preferences for participants
   - Manage your created activities

### For Existing Users

1. **Login**
   - Enter your email and password
   - Check "Remember me" for convenience
   - Access your profile

2. **Update Profile**
   - Edit your bio and interests
   - Upload profile picture
   - Update preferences

3. **Manage Activities**
   - Edit or delete your activities
   - View activity participants
   - Track your activity history

## 🔐 Firebase Database Structure

### Users Collection (`users/`)
```javascript
{
  userId: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    bio: "Adventure seeker...",
    age: 25,
    gender: "male",
    location: {
      city: "San Francisco",
      state: "CA"
    },
    interests: ["hiking", "photography", "cooking"],
    personality: {
      introvert_extrovert: 7,
      adventurous_cautious: 8,
      competitive_cooperative: 6,
      structured_spontaneous: 5
    },
    preferences: {
      preferredGender: "any",
      ageRange: { min: 20, max: 35 },
      maxDistance: 50
    },
    profilePicture: "gs://bucket/users/userId/profile.jpg",
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
}
```

### Activities Collection (`activities/`)
```javascript
{
  activityId: {
    title: "Weekend Hiking Trip",
    description: "Join us for...",
    category: "outdoor",
    location: {
      city: "San Francisco",
      state: "CA",
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    date: Timestamp,
    time: "09:00 AM",
    duration: "4 hours",
    maxParticipants: 10,
    currentParticipants: 5,
    difficultyLevel: "moderate",
    costRange: "$0-50",
    requirements: ["hiking boots", "water bottle"],
    creatorId: "userId",
    creatorName: "John Doe",
    participants: ["userId1", "userId2"],
    imageUrl: "https://...",
    status: "active",
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
}
```

### Matches Collection (`matches/`)
```javascript
{
  matchId: {
    userId1: "user123",
    userId2: "user456",
    compatibilityScore: 85,
    sharedInterests: ["hiking", "photography"],
    matchedAt: Timestamp,
    status: "active"
  }
}
```

## 🎨 Customization

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- The app uses CSS custom properties for easy theming
- Primary color: #6366f1 (indigo)
- Font: DM Sans from Google Fonts

### Matching Algorithm
- Edit `matching-service-complete.js` to adjust compatibility scoring
- Weights can be modified in the `calculateCompatibility` function
- Current weights:
  - Personality: 40%
  - Interests: 30%
  - Location: 20%
  - Preferences: 10%

### Categories
- Modify activity categories in `activities.js`
- Add new interest categories in `questionnaire.js`

## 🐛 Troubleshooting

### Common Issues

1. **Firebase not initialized**
   - Make sure `firebase-config.js` is loaded before other scripts
   - Check browser console for error messages
   - Verify your Firebase config credentials

2. **Authentication errors**
   - Ensure Email/Password authentication is enabled in Firebase Console
   - Check if user exists in Firestore after registration
   - Verify security rules allow read/write operations

3. **CORS errors**
   - Use a local server instead of opening files directly
   - Configure Firebase hosting for production
   - Enable CORS in Firebase Storage settings

4. **Data not loading**
   - Check internet connection
   - Verify Firestore security rules
   - Check browser console for errors
   - Ensure user is authenticated

5. **Offline persistence warnings**
   - Multiple tabs open - only one can use persistence
   - Browser doesn't support persistence (older browsers)
   - This is a warning, not an error - app will still work

## 🚀 Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Choose your project
   - Set public directory to current directory (.)
   - Configure as single-page app: No

4. **Deploy**
   ```bash
   firebase deploy
   ```

### Alternative Deployment Options

- **Netlify**: Drag and drop the folder to Netlify
- **Vercel**: Connect your GitHub repo and deploy
- **GitHub Pages**: Push to gh-pages branch

## 📊 Features Explained

### Matching Algorithm
The app uses a sophisticated matching algorithm that considers:
- **Personality traits**: 4 dimensions scored 1-10
- **Shared interests**: Overlap in hobbies and activities
- **Location proximity**: Distance-based compatibility
- **Preferences**: Age range, gender preferences
- **Activity history**: Past participation and ratings

### Questionnaire System
- 20+ questions across multiple categories
- Sliding scale for personality traits
- Multiple choice for preferences
- Interest selection with categories
- Location and demographic info

### Activity Management
- Create activities with rich details
- Set participant requirements
- Track registrations
- Edit/delete your activities
- Real-time participant updates

## 🔒 Security Considerations

1. **Never commit `firebase-config.js` with real credentials to public repos**
2. **Use environment variables for production**
3. **Enable Firebase Security Rules**
4. **Implement rate limiting for API calls**
5. **Validate all user inputs on client and server**
6. **Use HTTPS in production**

## 📈 Future Enhancements

- [ ] Real-time chat between matched users
- [ ] Push notifications for new matches
- [ ] Calendar integration
- [ ] Payment integration for paid activities
- [ ] Rating and review system
- [ ] Social media integration
- [ ] Advanced filtering and search
- [ ] Mobile app (React Native)
- [ ] Admin dashboard
- [ ] Analytics and insights

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📝 License

This project is for educational purposes. Modify and use as needed.

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Firebase documentation
- Create an issue in the repository

## 👥 Credits

Developed by the BeyondBinary team.

Firebase by Google.

---

**Happy Matching! 🎉**
