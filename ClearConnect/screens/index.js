import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');
const baseFontSize = Math.min(width, height) * 0.05;

export default function IndexScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('DoctorLogin')} 
          >
            <Text style={styles.buttonText}>Doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('PatientLogin')}
          >
            <Text style={styles.buttonText}>Patient</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.registerButtonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>Register an Account</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    borderColor: '#000',
    borderWidth: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',  
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonContainer: {
    marginTop: 30,  
    alignItems: 'center',  
  },
  button: {
    backgroundColor: '#003366',
    paddingVertical: 0.05 * height,
    paddingHorizontal: 0.1 * width,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    borderColor: '#000',
    borderWidth: 2,
  },
  buttonText: {
    color: '#f5f5dc',
    fontSize: Math.min(baseFontSize, 18),
    fontWeight: 'bold',
  },
});
