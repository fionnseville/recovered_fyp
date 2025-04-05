import React, { useState, useEffect, useContext } from 'react';
import {View,Text,TextInput,StyleSheet,TouchableOpacity,Switch,Alert,Modal,FlatList,ActivityIndicator} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { AuthContext } from '../AuthContext';
import { AntDesign } from '@expo/vector-icons';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function CreateAppointmentScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const { valid, validating, revalidate } = useSessionValidation();

  
  const [fields, setFields] = useState({
    patientid: '',
    address: '',
    reason: '',
    date: '',
    time: '',
    status: false,
  });

  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchLinkedPatients = async () => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, 'users'),
        where('doctorIds', 'array-contains', user.id)
      );

      const snapshot = await getDocs(q);
      const patientList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().firstname} ${doc.data().surname}`,
      }));

      setPatients(patientList);
      setFilteredPatients(patientList);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      //navigation.goBack();
      revalidate(); 
    }, [])
  );


  useEffect(() => {
      const filtered = patients.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    }, [searchQuery, patients]
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
  

  const handleCreate = async () => {
    if (!fields.date || !fields.time || !fields.address || !fields.patientid) {
      return Alert.alert('Missing Fields', 'Please complete all required fields.');
    }

    try {
      await addDoc(collection(db, 'appointments'), {
        ...fields,
        doctorid: user.id,
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Appointment created.');
      navigation.goBack();
    } catch (e) {
      console.error('Error creating appointment:', e);
      Alert.alert('Error', 'Could not create appointment.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Appointment</Text>
      
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          fetchLinkedPatients();
          setModalVisible(true);
        }}
      >
        <Text style={styles.dateButtonText}>
          {selectedPatientName || 'Select Patient'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDate(true)}>
        <Text style={styles.dateButtonText}>{fields.date || 'Select Date'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowTime(true)}>
        <Text style={styles.dateButtonText}>{fields.time || 'Select Time'}</Text>
      </TouchableOpacity>
      <TextInput
        placeholder="Address"
        placeholderTextColor="#333"
        style={styles.input}
        value={fields.address}
        onChangeText={(val) => setFields((prev) => ({ ...prev, address: val }))}
      />

      <TextInput
        placeholder="Reason"
        placeholderTextColor="#333"
        style={styles.input}
        value={fields.reason}
        onChangeText={(val) => setFields((prev) => ({ ...prev, reason: val }))}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Confirmed</Text>
        <Switch
          value={fields.status}
          onValueChange={(val) => setFields((prev) => ({ ...prev, status: val }))}
        />
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
        <Text style={styles.btnText}>Create</Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={showDate}
        mode="date"
        onConfirm={(date) => {
          const formatted = date.toLocaleDateString('en-GB');
          setFields((prev) => ({ ...prev, date: formatted }));
          setShowDate(false);
        }}
        onCancel={() => setShowDate(false)}
      />

      <DateTimePickerModal
        isVisible={showTime}
        mode="time"
        onConfirm={(time) => {
          const formatted = time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setFields((prev) => ({ ...prev, time: formatted }));
          setShowTime(false);
        }}
        onCancel={() => setShowTime(false)}
      />

      {/* Patient Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setModalVisible(false)}
            >
              <AntDesign name="close" size={24} color="red" />
            </TouchableOpacity>

            <TextInput
              style={styles.modalSearchBar}
              placeholder="Search patients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredPatients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFields((prev) => ({ ...prev, patientid: item.id }));
                    setSelectedPatientName(item.name);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
    textAlign: 'center',
    color: '#003366',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
  },
  createBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    paddingTop: 50,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalSearchBar: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  modalItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalItemText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
