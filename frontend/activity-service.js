/**
 * Activity Service - Firebase Firestore Implementation (Compat Version)
 * This manages all activity-related operations using Firestore
 */

const ActivityService = {
  
  // ===== COLLECTION NAMES =====
  ACTIVITIES_COLLECTION: 'activities',
  USERS_COLLECTION: 'users',
  
  // ===== INITIALIZE WITH SAMPLE DATA =====
  async initializeSampleData() {
    try {
      const snapshot = await db.collection(this.ACTIVITIES_COLLECTION).limit(1).get();
      
      // Only add sample data if no activities exist
      if (snapshot.empty) {
        const sampleActivities = [
          {
            title: "Morning Yoga in the Park",
            description: "Join us for a relaxing morning yoga session. All levels welcome!",
            interests: ["yoga", "fitness", "nature"],
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            location: {
              name: "Golden Gate Park, SF",
              lat: 37.7694,
              lng: -122.4862
            },
            createdBy: 'sample_user',
            participants: ['sample_user'],
            maxParticipants: 15,
            imageUrl: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
          },
          {
            title: "Photography Walk - Urban Exploration",
            description: "Explore the city through your lens. Bring your camera and let's capture amazing shots!",
            interests: ["photography", "art", "walking"],
            date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            location: {
              name: "Mission District, SF",
              lat: 37.7599,
              lng: -122.4148
            },
            createdBy: 'sample_user',
            participants: ['sample_user'],
            maxParticipants: 10,
            imageUrl: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
          },
          {
            title: "Cooking Class: Italian Cuisine",
            description: "Learn to make authentic pasta from scratch! Ingredients provided.",
            interests: ["cooking", "food", "learning"],
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            location: {
              name: "Community Kitchen, SF",
              lat: 37.7749,
              lng: -122.4194
            },
            createdBy: 'sample_user',
            participants: ['sample_user'],
            maxParticipants: 8,
            imageUrl: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
          },
          {
            title: "Weekend Hiking Adventure",
            description: "Challenging hike with stunning views. Intermediate level recommended.",
            interests: ["hiking", "nature", "fitness"],
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: {
              name: "Mount Tamalpais",
              lat: 37.9235,
              lng: -122.5965
            },
            createdBy: 'sample_user',
            participants: ['sample_user'],
            maxParticipants: 12,
            imageUrl: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
          },
          {
            title: "Board Game Night",
            description: "Chill evening playing board games and making new friends!",
            interests: ["gaming", "social", "fun"],
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            location: {
              name: "Game Café, SF",
              lat: 37.7833,
              lng: -122.4167
            },
            createdBy: 'sample_user',
            participants: ['sample_user'],
            maxParticipants: 20,
            imageUrl: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
          }
        ];
        
        // Create each activity as a document
        const batch = db.batch();
        sampleActivities.forEach(activity => {
          const docRef = db.collection(this.ACTIVITIES_COLLECTION).doc();
          batch.set(docRef, activity);
        });
        await batch.commit();
        
        console.log('Sample activities initialized');
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  },
  
  // ===== GET OPERATIONS =====
  
  async getAllActivities() {
    try {
      const snapshot = await db.collection(this.ACTIVITIES_COLLECTION).get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  },
  
  async getActivityById(activityId) {
    try {
      const doc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting activity:', error);
      return null;
    }
  },
  
  async getActivitiesByUser(userId) {
    try {
      const snapshot = await db.collection(this.ACTIVITIES_COLLECTION)
        .where('createdBy', '==', userId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  },
  
  async getJoinedActivities(userId) {
    try {
      const snapshot = await db.collection(this.ACTIVITIES_COLLECTION)
        .where('participants', 'array-contains', userId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting joined activities:', error);
      return [];
    }
  },
  
  // Get upcoming activities (not in the past)
  async getUpcomingActivities() {
    try {
      const snapshot = await db.collection(this.ACTIVITIES_COLLECTION)
        .where('status', '==', 'active')
        .orderBy('date', 'asc')
        .get();
      
      const now = new Date();
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(activity => new Date(activity.date) >= now);
    } catch (error) {
      console.error('Error getting upcoming activities:', error);
      return [];
    }
  },
  
  // Search activities by interest, location, or date
  async searchActivities(filters = {}) {
    try {
      let activities = await this.getAllActivities();
      
      if (filters.interest) {
        activities = activities.filter(a => 
          a.interests.some(i => i.toLowerCase().includes(filters.interest.toLowerCase()))
        );
      }
      
      if (filters.location) {
        activities = activities.filter(a => 
          a.location.name.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      
      if (filters.date) {
        const searchDate = new Date(filters.date);
        activities = activities.filter(a => {
          const activityDate = new Date(a.date);
          return activityDate.toDateString() === searchDate.toDateString();
        });
      }
      
      return activities;
    } catch (error) {
      console.error('Error searching activities:', error);
      return [];
    }
  },
  
  // ===== CREATE / UPDATE OPERATIONS =====
  
  async createActivity(activityData, userId) {
    try {
      const newActivity = {
        ...activityData,
        createdBy: userId,
        participants: [userId],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active'
      };
      
      // Create activity document
      const docRef = await db.collection(this.ACTIVITIES_COLLECTION).add(newActivity);
      
      // Update user stats
      await this._updateUserStats(userId, 'eventsHosted', 1);
      
      return { 
        success: true, 
        activity: { 
          id: docRef.id, 
          ...newActivity 
        } 
      };
    } catch (error) {
      console.error('Error creating activity:', error);
      return { success: false, error: error.message };
    }
  },
  
  async updateActivity(activityId, updates) {
    try {
      // Check if activity exists
      const doc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Activity not found' };
      }
      
      // Update activity
      await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Get updated activity
      const updatedDoc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      return { 
        success: true, 
        activity: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        }
      };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: error.message };
    }
  },
  
  async deleteActivity(activityId) {
    try {
      // Get activity first to update creator's stats
      const doc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Activity not found' };
      }
      
      const activity = doc.data();
      
      // Delete activity
      await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).delete();
      
      // Update user stats
      await this._updateUserStats(activity.createdBy, 'eventsHosted', -1);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ===== PARTICIPANT OPERATIONS =====
  
  async joinActivity(activityId, userId) {
    try {
      const doc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Activity not found' };
      }
      
      const activity = doc.data();
      
      // Check if already joined
      if (activity.participants.includes(userId)) {
        return { success: false, error: 'Already joined this activity' };
      }
      
      // Check if full
      if (activity.participants.length >= activity.maxParticipants) {
        return { success: false, error: 'Activity is full' };
      }
      
      // Add participant using arrayUnion
      await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).update({
        participants: firebase.firestore.FieldValue.arrayUnion(userId),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user stats
      await this._updateUserStats(userId, 'activitiesJoined', 1);
      
      // Get updated activity
      const updatedDoc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      return { 
        success: true, 
        activity: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        }
      };
    } catch (error) {
      console.error('Error joining activity:', error);
      return { success: false, error: error.message };
    }
  },
  
  async leaveActivity(activityId, userId) {
    try {
      const doc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Activity not found' };
      }
      
      const activity = doc.data();
      
      // Can't leave if you're the creator
      if (activity.createdBy === userId) {
        return { success: false, error: 'Host cannot leave their own activity' };
      }
      
      // Remove participant using arrayRemove
      await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).update({
        participants: firebase.firestore.FieldValue.arrayRemove(userId),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user stats
      await this._updateUserStats(userId, 'activitiesJoined', -1);
      
      // Get updated activity
      const updatedDoc = await db.collection(this.ACTIVITIES_COLLECTION).doc(activityId).get();
      
      return { 
        success: true, 
        activity: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        }
      };
    } catch (error) {
      console.error('Error leaving activity:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ===== HELPER METHODS =====
  
  async _updateUserStats(userId, stat, value) {
    try {
      // Update using increment for atomic operation
      await db.collection(this.USERS_COLLECTION).doc(userId).update({
        [`stats.${stat}`]: firebase.firestore.FieldValue.increment(value)
      });
      
      // Update localStorage cache if it's the current user
      const currentUser = StorageUtils.getCurrentUserSync();
      if (currentUser && currentUser.id === userId) {
        if (!currentUser.stats) currentUser.stats = {};
        currentUser.stats[stat] = (currentUser.stats[stat] || 0) + value;
        StorageUtils.setCurrentUser(currentUser);
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  },
  
  // Clear all activities (for testing)
  async clearAll() {
    try {
      const snapshot = await db.collection(this.ACTIVITIES_COLLECTION).get();
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      console.log('All activities cleared');
    } catch (error) {
      console.error('Error clearing activities:', error);
    }
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ActivityService = ActivityService;
}