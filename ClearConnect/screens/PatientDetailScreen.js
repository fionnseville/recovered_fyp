import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { AuthContext } from '../AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function PatientDetailScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { valid, validating, revalidate } = useSessionValidation();

  useFocusEffect(
      React.useCallback(() => {
      //navigation.goBack();
      revalidate();
    }, [])
  );  

  const formatAndCalculateAge = (dobString) => {
    if (!dobString) return "Unknown";
    try {
      const [day, month, year] = dobString.split('/').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    } catch (error) {
      console.error("Invalid DOB format:", dobString);
      return "Unknown";
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchPatients = async () => {
      try {
        const patientsQuery = query(
          collection(db, 'users'),
          where('doctorIds', 'array-contains', user.id)
        );

        const querySnapshot = await getDocs(patientsQuery);
        const patientsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: `${doc.data().firstname} ${doc.data().surname}`,
          age: formatAndCalculateAge(doc.data().dob),
        }));

        setPatients(patientsList);
        setFilteredPatients(patientsList);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, [user]);

  useEffect(() => {
    const filtered = patients.filter((patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

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
      <Text style={styles.title}>Linked Patients</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search patients..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {filteredPatients.length === 0 ? (
        <Text style={styles.noPatientsText}>No linked patients found</Text>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => ( 
            <TouchableOpacity 
              style={styles.patientItem} 
              //onPress={() => navigation.navigate('PatientViewScreen', { patientId: item.id, patientName: item.name })}
              onPress={() => navigation.navigate('PatientOptions', { patientId: item.id, patientName: item.name })}
            >
              <Text style={styles.patientName}>{item.name}</Text>
              <Text style={styles.patientAge}>Age: {item.age}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  noPatientsText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
    marginTop: 20,
  },
  patientItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientAge: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
});
