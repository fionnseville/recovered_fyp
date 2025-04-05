import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNavigationContainerRef } from '@react-navigation/native';

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
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
          console.log('Restored session:',storedUser); 
        }
      } catch (error) {
        console.error('Error loading session:', error);
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
  const logout = async () => {
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
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
