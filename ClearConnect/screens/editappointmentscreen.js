import React, { useState } from 'react';
import {View,Text,StyleSheet,TextInput,Switch,TouchableOpacity,Alert,ActivityIndicator} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useFocusEffect } from '@react-navigation/native';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function EditAppointmentScreen({ route, navigation }) {
  const { appointment } = route.params;

  const [fields, setFields] = useState({
    address: appointment.address || '',
    reason: appointment.reason || '',
    status: appointment.status || false,
    date: appointment.date || '',
    time: appointment.time || '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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

  const handleSave = async () => {
    try {
      const apptRef = doc(db, 'appointments', appointment.id);
      await updateDoc(apptRef, fields);
      Alert.alert('Success', 'Appointment updated.');
      navigation.goBack();
    } catch (e) {
      console.error('Error updating appointment:', e);
      Alert.alert('Error', 'Failed to update appointment.');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'appointments', appointment.id));
              Alert.alert('Deleted', 'Appointment deleted.');
              navigation.goBack();
            } catch (e) {
              console.error('Error deleting appointment:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Appointment</Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {fields.date || 'Select Date'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {fields.time || 'Select Time'}
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Address"
        style={styles.input}
        value={fields.address}
        onChangeText={(val) => setFields((prev) => ({ ...prev, address: val }))}
      />

      <TextInput
        placeholder="Reason"
        style={styles.input}
        value={fields.reason}
        onChangeText={(val) => setFields((prev) => ({ ...prev, reason: val }))}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Confirmed</Text>
        <Switch
          value={fields.status}
          onValueChange={(val) =>
            setFields((prev) => ({ ...prev, status: val }))
          }
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          const formatted = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
          setFields((prev) => ({ ...prev, date: formatted }));
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={(time) => {
          const formatted = time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setFields((prev) => ({ ...prev, time: formatted }));
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#ff3b30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
