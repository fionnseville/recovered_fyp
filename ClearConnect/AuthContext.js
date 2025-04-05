import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNavigationContainerRef } from '@react-navigation/native';
import { doc, getDoc,deleteDoc } from 'firebase/firestore';
import { db } from './firebaseconfig'; 

export const AuthContext = createContext();

export const navigationRef = createNavigationContainerRef();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  //to track loading state during session restoration

  //load session from AsyncStorage when the app starts   
  useEffect(() => {
    //console.log('AuthContext - isLoggedIn:', isLoggedIn);
    const loadSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userSession');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);

          if (!parsed.sessionId || !parsed.token) {
            console.log('[Session] Missing sessionId or token in local storage');
            await AsyncStorage.removeItem('userSession');
            setLoading(false);
            return;
          }          
    
          const sessionRef = doc(db, 'sessions', parsed.sessionId);
          const sessionSnap = await getDoc(sessionRef);
    
          if (!sessionSnap.exists()) {
            console.log('[Session] Session no longer exists');
            await AsyncStorage.removeItem('userSession');
            setLoading(false);
            return;
          }
    
          const sessionData = sessionSnap.data();
    
          if (!sessionData.token || sessionData.token !== parsed.token) {
            console.log('[Session] Token mismatch');
            await AsyncStorage.removeItem('userSession');
            setLoading(false);
            return;
          }
    
          const expiresAt = sessionData.expiresAt;
    
          // 🔐 Check expiration (server-based expiry time)
          if (expiresAt && Date.now() > expiresAt) {
            console.log('[Session] Session expired');
            await AsyncStorage.removeItem('userSession');
            setLoading(false);
            return;
          }
    
          // ✅ Session is valid
          setUser(parsed);
          setIsLoggedIn(true);
          console.log('[Session] Restored and valid:', parsed);
        }
      } catch (error) {
        console.error('Error validating session:', error);
      } finally {
        setLoading(false);
      }
    };    

    loadSession();
    //console.log('AuthContext - isLoggedIn:', isLoggedIn); 
  }, []);

  //function to log in and store session data
  const login = async (userData) => {
    try {
      setUser(userData);
      setIsLoggedIn(true);
      await AsyncStorage.setItem('userSession', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  //function to log out and clear session
  /*const logout = async () => {
    try {
      setUser(null);
      setIsLoggedIn(false);
      await AsyncStorage.removeItem('userSession');
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Home_' }],  // checks the screen name matches your navigation.js file
        });
      }
  
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };*/

  const logout = async () => {
    try {
      // 🧨 Delete session from Firestore if it exists
      if (user?.sessionId) {
        const sessionRef = doc(db, 'sessions', user.sessionId);
        await deleteDoc(sessionRef);
        console.log('[Auth] Session document deleted from Firestore');
      }

      // 🧹 Clear local session
      setUser(null);
      setIsLoggedIn(false);
      await AsyncStorage.removeItem('userSession');

      // 🚀 Redirect to login/home
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Home_' }],
        });
      }

    } catch (error) {
      console.error('[Auth] Error during logout:', error);
    }
  };


  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
