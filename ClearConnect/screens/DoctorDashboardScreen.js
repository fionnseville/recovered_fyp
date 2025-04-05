import React, { useContext, useEffect, useState } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,ActivityIndicator,FlatList,Modal,TextInput,Switch,} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Calendar } from 'react-native-calendars';
import { AuthContext } from '../AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useSessionValidation  } from '../Utils/useSessionValidation'; 
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

export default function DoctorDashboardScreen() {
  const { isLoggedIn, user, loading: authLoading } = useContext(AuthContext);
  const navigation = useNavigation();

  const { valid, validating, revalidate } = useSessionValidation ();
  const [viewMode, setViewMode] = useState('list');
  const [filter, setFilter] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  const [openDropdown, setOpenDropdown] = useState(false);

  //const { valid, validating } = SessionValidation();
  const fetchAppointments = async () => {
    try {
      const apptQuery = query(collection(db, 'appointments'), where('doctorid', '==', user.id));
      const snap = await getDocs(apptQuery);

      const data = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const appt = { id: docSnap.id, ...docSnap.data() };

          if (appt.patientid) {
            try {
              const patientRef = doc(db, 'users', appt.patientid);
              const patientSnap = await getDoc(patientRef);

              if (patientSnap.exists()) {
                const patientData = patientSnap.data();
                appt.patientname = `${patientData.firstname} ${patientData.surname}`;
              } else {
                appt.patientname = 'Unknown Patient';
              }
            } catch (err) {
              console.error('Error fetching patient:', err);
              appt.patientname = 'Unknown Patient';
            }
          } else {
            appt.patientname = 'Unknown';
          }

          return appt;
        })
      );

      setAppointments(data);

      const marked = {};
      data.forEach((appt) => {
        const [day, month, year] = appt.date.split('/');
        const key = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        marked[key] = {
          selected: true,
          selectedColor: '#6BCB77',
          selectedTextColor: '#fff',
        };
      });

      setMarkedDates(marked);
    } catch (e) {
      console.error('Failed to fetch appointments:', e);
    }
  };

  
  useEffect(() => {
    if (authLoading || !user || user.role !== 1) return;
    fetchAppointments();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user && user.role === 1) {
        fetchAppointments();
      }
    }, [user])
  );

  useFocusEffect(
    React.useCallback(() => {
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
  
  
  

  const filterAppointments = () => {
    const today = new Date();
    let filtered = appointments;
  
    if (filter === 'today') {
      filtered = appointments.filter((appt) => {
        const [day, month, year] = appt.date.split('/');
        const apptDate = new Date(`${year}-${month}-${day}`);
        return (
          apptDate.getDate() === today.getDate() &&
          apptDate.getMonth() === today.getMonth() &&
          apptDate.getFullYear() === today.getFullYear()
        );
      });
    } else if (filter === 'week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      filtered = appointments.filter((appt) => {
        const [day, month, year] = appt.date.split('/');
        const apptDate = new Date(`${year}-${month}-${day}`);
        return apptDate >= today && apptDate <= nextWeek;
      });
    }
  
    // sorting for date and time
    return filtered.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const [dayB, monthB, yearB] = b.date.split('/');
  
      // 24 hour time
      const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.includes('AM') || timeStr.includes('PM')
          ? timeStr.split(' ')
          : [timeStr, null];
        let [hours, minutes] = time.split(':').map(Number);
  
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
  
        return { hours, minutes };
      };
  
      const { hours: hoursA, minutes: minutesA } = parseTime(a.time || '00:00');
      const { hours: hoursB, minutes: minutesB } = parseTime(b.time || '00:00');
  
      const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
      const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
  
      return dateA - dateB;
    });
  };
  

  const handleEdit = (appt) => {
    navigation.navigate('EditAppointment', { appointment: appt });
  };
  

  const renderAppointment = ({ item }) => (
    <View
      style={[styles.appointmentCard, { backgroundColor: item.status ? '#e1ffc7' : '#ffcccb' }]}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}><Text style={styles.bold}>Date:</Text> {item.date} at {item.time}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Patient:</Text> {item.patientname || 'Unknown'}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Location:</Text> {item.address || 'Not provided'}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Reason:</Text> {item.reason || 'No reason given'}</Text>
          <Text style={styles.label}><Text style={styles.bold}>Status:</Text> {item.status ? 'Confirmed' : 'Pending'}</Text>
        </View>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <FontAwesome name="edit" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isLoggedIn || user?.role !== 1) {
    return (
      <View style={styles.centered}>
        <Text>You must be logged in as a doctor to access this screen.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>

      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'list' && styles.activeButton]}
          onPress={() => setViewMode('list')}
        >
          <Text style={styles.toggleText}>List View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'calendar' && styles.activeButton]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={styles.toggleText}>Calendar View</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'list' ? (
        <>
          <DropDownPicker
            open={openDropdown}
            value={filter}
            items={[
              { label: 'All Upcoming', value: 'all' },
              { label: 'Today', value: 'today' },
              { label: 'This Week', value: 'week' },
            ]}
            setOpen={setOpenDropdown}
            setValue={setFilter}
            containerStyle={styles.dropdownContainer}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownOptions}
            placeholder="Filter Appointments"
          />
          <TouchableOpacity
            style={{
              backgroundColor: '#007AFF',
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('CreateAppointment')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ New Appointment</Text>
          </TouchableOpacity>

          <FlatList
            data={filterAppointments()}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointment}
            ListEmptyComponent={<Text style={styles.noAppointments}>No appointments found.</Text>}
          />
        </>
      ) : (
        <>
          <Calendar
            markedDates={{
              ...markedDates,
              ...(selectedDate && {
                [selectedDate]: {
                  ...markedDates[selectedDate],
                  selected: true,
                  selectedColor: '#003366',
                },
              }),
            }}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            style={styles.calendar}
          />
          <TouchableOpacity
            style={{
              backgroundColor: '#007AFF',
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('CreateAppointment')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ New Appointment</Text>
          </TouchableOpacity>

          <Text style={styles.subHeader}>
            Appointments on {selectedDate || '...'}
          </Text>
          <FlatList
            data={appointments.filter((appt) => {
              const [d, m, y] = appt.date.split('/');
              const apptDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              return apptDate === selectedDate;
            })}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointment}
            ListEmptyComponent={<Text style={styles.noAppointments}>No appointments for this day.</Text>}
          />
        </>
      )}

      
    </View>

  );


}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#003366',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  viewToggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex: 1000,
    //marginHorizontal: 10,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#003366',
    marginVertical: 8,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#000',
  },
  bold: {
    fontWeight: 'bold',
    color: '#003366',
  },
  calendar: {
    marginBottom: 10,
  },
  subHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 8,
    textAlign: 'center',
    color: '#003366',
  },
  noAppointments: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  modalBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  dateButtonText: {
    color: '#333',
    fontSize: 16,
  },  
});
