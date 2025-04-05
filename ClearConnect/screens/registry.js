import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseconfig';  
import { useNavigation } from '@react-navigation/native';
import { sha256 } from 'js-sha256';
import DateTimePickerModal from 'react-native-modal-datetime-picker';


export default function RegisterScreen() {
  const [firstname, setFirstname] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState(null);
  const [gender, setGender] = useState('male');  
  const [role, setRole] = useState('patient');  
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');


  const evaluatePasswordStrength = (value) => {
    if (value.length < 8) return 'Weak';
  
    const hasLetters = /[a-zA-Z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSymbols = /[^a-zA-Z0-9]/.test(value);
  
    if (hasLetters && hasNumbers && hasSymbols) return 'Strong';
    return 'Medium';
  };
  
  
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!firstname || !surname || !email || !password || !confirmPassword || !dob) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
  
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }
  
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must include at least 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Invalid email format.');
      return;
    }
  
    try {
      const hashedPassword = sha256(password);
      const formattedDob = new Date(dob).toLocaleDateString('en-GB');
      const roleValue = role === 'doctor' ? 1 : 0;
      const genderValue = gender === 'male' ? 1 : gender === 'female' ? 0 : 2;
  
      await addDoc(collection(db, 'users'), {
        firstname,
        surname,
        email: email.trim().toLowerCase(),
        passhash: hashedPassword,
        dob: formattedDob,
        gender: genderValue,
        role: roleValue,
        createdAt: serverTimestamp(),
      });
  
      Alert.alert('Success', 'Registration successful!');
      navigation.navigate('PatientLogin');
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'Something went wrong during registration.');
    }
  };
  

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerText}>Register an Account</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#333" 
          value={firstname}
          onChangeText={setFirstname}
        />

        <TextInput
          style={styles.input}
          placeholder="Surname"
          placeholderTextColor="#333" 
          value={surname}
          onChangeText={setSurname}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#333" 
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.passwordHelp}>
          Password must be at least 8 characters and include a number and symbol.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#333"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordStrength(evaluatePasswordStrength(text));
          }}
          secureTextEntry
        />
        <Text style={[
          styles.strengthText,
          passwordStrength === 'Weak' ? { color: 'red' } :
          passwordStrength === 'Medium' ? { color: 'orange' } :
          passwordStrength === 'Strong' ? { color: 'green' } : null,
        ]}>
          {passwordStrength ? `Strength: ${passwordStrength}` : ''}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#333"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* custom modal for dob*/}
        <Text style={styles.label}>Select Date of Birth:</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisibility(true)}>
          <Text style={styles.dateButtonText}>
            {dob ? dob.toDateString() : 'Select Date'}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          maximumDate={new Date()}
          onConfirm={(date) => {
            setDob(date);
            setDatePickerVisibility(false);
          }}
          onCancel={() => setDatePickerVisibility(false)}
        />

        <Text style={styles.label}>Select Gender:</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity 
            style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]} 
            onPress={() => setGender('male')}
          >
            <Text style={styles.genderText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]} 
            onPress={() => setGender('female')}
          >
            <Text style={styles.genderText}>Female</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genderButton, gender === 'other' && styles.genderButtonSelected]} 
            onPress={() => setGender('other')}
          >
            <Text style={styles.genderText}>Other</Text>
          </TouchableOpacity>
        </View>

        {/*role selection */}
        <Text style={styles.label}>Select Role:</Text>
        <TouchableOpacity style={styles.roleButton} onPress={() => setRole(role === 'patient' ? 'doctor' : 'patient')}>
          <Text style={styles.roleButtonText}>Role: {role.toUpperCase()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginRedirect} onPress={() => navigation.navigate('PatientLogin')}>
          <Text style={styles.loginRedirectText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#003366',
    textAlign: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    alignSelf: 'flex-start',
    marginLeft: '10%',  
    marginTop: 10,
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
  dateButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#005580',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 10,
  },
  dateButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  genderButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  genderButtonSelected: {
    backgroundColor: '#003366',
  },
  genderText: {
    color: '#f5f5dc',
    fontWeight: 'bold',
  },
  roleButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#005580',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 10,
  },
  roleButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  registerButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginRedirect: {
    marginTop: 20,
  },
  loginRedirectText: {
    color: '#003366',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  strengthText: {
    alignSelf: 'flex-start',
    marginLeft: '10%',
    marginTop: -5,
    marginBottom: 10,
    fontWeight: 'bold',
  },  
  passwordHelp: {
    width: '80%',
    fontSize: 17,
    fontWeight: "bold",
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
    alignSelf: 'flex-start',
    marginLeft: '10%',
  },  
});
