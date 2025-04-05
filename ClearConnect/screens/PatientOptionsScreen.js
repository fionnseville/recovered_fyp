import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet,ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function PatientOptionsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId, patientName } = route.params;

  const { valid, validating, revalidate } = useSessionValidation();
  
  useFocusEffect(
      React.useCallback(() => {
      //navigation.goBack();
      revalidate();
    }, [])
  );  

  if (validating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    ); 
  }
    
  if (!valid) {
    return (
      <View style={styles.centered}>
        <Text>Session expired or invalid. Please log in again.</Text>
      </View>
    );
  }       
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Options for {patientName}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('ReportScreen', { patientId, patientName })
        }
      >
        <Text style={styles.buttonText}>View Health Metrics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('PatientViewScreen', { patientId, patientName })
        }
      >
        <Text style={styles.buttonText}>View Files</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#003366',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
