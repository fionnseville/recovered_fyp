import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { useNavigation } from '@react-navigation/native';
import { sha256 } from 'js-sha256';
import { createSession } from '../Utils/sessionUtils'; 
import { AuthContext } from '../AuthContext';

export default function Doctor_login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  /*const handleLogin = async () => {
    if (email && password) {
      try {
        const trimmedEmail = email.trim().toLowerCase();

        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where("email", "==", trimmedEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert('Login Failed', 'Invalid email or password');
          return;
        }

        for (const doc of querySnapshot.docs) {
          const userData = doc.data();
          const hashedPassword = sha256(password);
        
          if (userData.passhash === hashedPassword) {
            if (userData.role === 1) {
              const session = await createSession(doc.id);
        
              const sessionData = {
                id: doc.id,
                email: userData.email,
                firstname: userData.firstname.trim(),
                surname: userData.surname.trim(),
                specialization: userData.specialization || "Unknown",
                role: userData.role,
                sessionId: session.sessionId,
                token: session.token,
              };
        
              login(sessionData);
        
              Alert.alert('Login Successful', `Welcome Dr. ${userData.firstname.trim()}!`);
        
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              });
        
              return; // exit after successful login
            } else {
              Alert.alert('Login Failed', 'Only doctors can log in here.');
              return;
            }
          } else {
            Alert.alert('Login Failed', 'Incorrect password');
            return;
          }
        }        

      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert('Error', 'Something went wrong');
      }
    } else {
      Alert.alert('Error', 'Please enter both email and password.');
    }
  };*/
  const handleLogin = async () => {
    if (email && password) {
      try {
        const trimmedEmail = email.trim().toLowerCase();
        const hashedPassword = sha256(password);
  
        const session = await createSession(doc.id); 
        //below is for unit testing
        //const session = await createSession('');//doesnt matter session will be attached to the credential user
  
        const response = await fetch('https://us-central1-healthguard-b70e1.cloudfunctions.net/doctorLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: trimmedEmail,
            password: hashedPassword,
            sessionId: session.sessionId,
            token: session.token,
          }),
        });
  
        const result = await response.json();
  
        if (!response.ok || !result.success) {
          Alert.alert('Login Failed', result.error || 'Invalid credentials');
          return;
        }
  
        const sessionData = {
          id: result.user.id,
          email: result.user.email,
          firstname: result.user.firstname,
          surname: result.user.surname,
          specialization: result.user.specialization,
          role: result.user.role,
          sessionId: session.sessionId,
          token: session.token,
        };
  
        login(sessionData);
  
        Alert.alert('Login Successful', `Welcome Dr. ${result.user.firstname}!`);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
  
      } catch (error) {
        console.error('Login error:', error);
        Alert.alert('Error', 'Something went wrong.');
      }
    } else {
      Alert.alert('Error', 'Please enter both email and password.');
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Doctor Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#333"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#333"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5dc',
    borderColor: '#000',
    borderWidth: 2,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#003366',
  },
  input: {
    width: '80%',
    height: 50,
    padding: 10,
    marginVertical: 10,
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  loginButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
