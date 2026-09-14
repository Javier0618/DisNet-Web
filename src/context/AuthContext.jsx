import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  isAdminUser
} from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user document in Firestore
  const fetchUserData = async (user) => {
    if (!user) {
      setUserData(null);
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Create initial user doc if missing
        const newUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          favorites: [],
          history: [],
          watchProgress: {}, // { contentId: { progress: number, duration: number, timestamp: number, season: 1, episode: 1 } }
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newUserData);
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback state if Firestore read fails
      setUserData({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        favorites: [],
        history: [],
        watchProgress: {}
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(res.user, { displayName });
    }
    await fetchUserData(res.user);
    return res;
  };

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    if (updates.displayName || updates.photoURL) {
      await updateProfile(currentUser, updates);
    }
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updates);
    setUserData(prev => ({ ...prev, ...updates }));
  };

  // Toggle Favorites
  const toggleFavorite = async (content) => {
    if (!currentUser || !userData) return false;
    const userRef = doc(db, 'users', currentUser.uid);
    const contentId = String(content.id);
    const isFav = userData.favorites?.some(item => String(item.id) === contentId);

    let updatedFavorites;
    if (isFav) {
      updatedFavorites = userData.favorites.filter(item => String(item.id) !== contentId);
    } else {
      const favItem = {
        id: content.id,
        title: content.title || content.name,
        poster_path: content.poster_path,
        backdrop_path: content.backdrop_path,
        media_type: content.media_type,
        vote_average: content.vote_average || 0,
        release_date: content.release_date || ''
      };
      updatedFavorites = [...(userData.favorites || []), favItem];
    }

    setUserData(prev => ({ ...prev, favorites: updatedFavorites }));
    try {
      await updateDoc(userRef, { favorites: updatedFavorites });
    } catch (err) {
      console.error("Error updating favorites in Firestore:", err);
    }
    return !isFav;
  };

  // Save Watch History & Progress
  const saveWatchProgress = async (content, progressData) => {
    if (!currentUser || !userData) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const contentId = String(content.id);

    const newProgress = {
      ...(userData.watchProgress || {}),
      [contentId]: {
        contentId: content.id,
        title: content.title || content.name,
        poster_path: content.poster_path,
        backdrop_path: content.backdrop_path,
        media_type: content.media_type,
        progress: progressData.progress || 0, // seconds
        duration: progressData.duration || 0, // seconds
        percentage: progressData.duration ? Math.min(100, Math.round((progressData.progress / progressData.duration) * 100)) : 0,
        season: progressData.season || null,
        episode: progressData.episode || null,
        updatedAt: new Date().toISOString()
      }
    };

    // Keep history array unique and top 30
    const existingHistory = (userData.history || []).filter(h => String(h.id) !== contentId);
    const updatedHistory = [{
      id: content.id,
      title: content.title || content.name,
      poster_path: content.poster_path,
      backdrop_path: content.backdrop_path,
      media_type: content.media_type,
      watchedAt: new Date().toISOString()
    }, ...existingHistory].slice(0, 30);

    setUserData(prev => ({
      ...prev,
      watchProgress: newProgress,
      history: updatedHistory
    }));

    try {
      await updateDoc(userRef, {
        watchProgress: newProgress,
        history: updatedHistory
      });
    } catch (err) {
      console.error("Error updating watch progress in Firestore:", err);
    }
  };

  const isAdmin = isAdminUser(currentUser);

  const value = {
    currentUser,
    userData,
    isAdmin,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    toggleFavorite,
    saveWatchProgress
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
