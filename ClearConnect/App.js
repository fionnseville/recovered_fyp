import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Navigation from './navigation';
import { AuthProvider, AuthContext, navigationRef } from './AuthContext';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef} onReady={() => console.log('Navigation is ready')}>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}

/*function AppContent() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    // Show loading indicator while restoring session
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  return <Navigation />;
}*/

function AppContent() {
  const { loading, isLoggedIn } = useContext(AuthContext);

  if (loading) {
    // Show loading indicator while restoring session
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  return <Navigation isLoggedIn={isLoggedIn} />;
}

