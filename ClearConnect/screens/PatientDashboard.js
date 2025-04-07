import React, { useEffect, useState, useContext } from 'react';
import {View,Text,TextInput,TouchableOpacity,Alert,StyleSheet,FlatList,Modal,SafeAreaView,ActivityIndicator} from 'react-native';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { AuthContext } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function PatientDashboardScreen({ initialLinkedDoctors = [] ,initialAppointments= []}) {
  const { user } = useContext(AuthContext);
  const [linkedDoctors, setLinkedDoctors] = useState(initialLinkedDoctors);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(''); 
  const [modalVisible, setModalVisible] = useState(false);
  console.log(initialAppointments)
  //console.log(initialLinkedDoctors)


  const { valid, validating, revalidate } = useSessionValidation();

  useFocusEffect(
      React.useCallback(() => {
      //navigation.goBack();
      revalidate();
    }, [])
  );  

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);

        //fetching current user data
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (!userDoc.exists()) {
          Alert.alert('Error', 'User not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // fetching linked doctors
        const doctorIds = userData.doctorIds || []; 
        if (doctorIds.length > 0) {
          const doctorPromises = doctorIds.map(async (doctorId) => {
            const doctorSnap = await getDoc(doc(db, 'users', doctorId));
            if (doctorSnap.exists()) {
              const doctorData = doctorSnap.data();
              return {
                id: doctorId,
                firstname: doctorData.firstname,
                surname: doctorData.surname,
                email: doctorData.email,
              };
            }
            return null;
          });

          const fetchedDoctors = (await Promise.all(doctorPromises)).filter(Boolean);
          setLinkedDoctors(fetchedDoctors);
        } else {
          setLinkedDoctors([]);
        }

        // fetching appointments
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('patientid', '==', user.id)
        );
        const appointmentsSnap = await getDocs(appointmentsQuery);
        console.log(appointmentsSnap)

        console.log(user.id)
        let appointmentsData = appointmentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const now = new Date();
        now.setHours(0, 0, 0, 0); 

        appointmentsData = appointmentsData.filter(appt => {
          const [day, month, year] = appt.date.split('/');
          const apptDate = new Date(`${year}-${month}-${day}`);
          return apptDate >= now;
        });

        for (let appt of appointmentsData) {
          if (appt.doctorid) {
            const docSnap = await getDoc(doc(db, 'users', appt.doctorid));
            if (docSnap.exists()) {
              const d = docSnap.data();
              appt.doctorName = `Dr. ${d.firstname || 'Unknown'} ${d.surname || 'Unknown'}`;
            } else {
              appt.doctorName = 'Unknown Doctor';
            }
          }
        }

        // Sort by soonest
        appointmentsData.sort((a, b) => {
          const [dayA, monthA, yearA] = a.date.split('/');
          const [dayB, monthB, yearB] = b.date.split('/');
          return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
        });
        console.log(appointmentsData)
        setAppointments(appointmentsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
        setLoading(false);
      }
    };

    fetchDetails();
  }, [user]);

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

  const handleSearchAndLink = async () => {
    //console.log('test')
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a valid email.');
      return;
    }
    if (!user || !user.id) return;
    try {
      const doctorsRef = collection(db, 'users');
      const doctorQuery = query(
        doctorsRef,
        where('email', '==', email.trim().toLowerCase()),
        where('role', '==', 1)
      );
      const querySnapshot = await getDocs(doctorQuery);
      //console.log('query result:', querySnapshot); 
      if (!querySnapshot.empty) {
        const doctorDoc = querySnapshot.docs[0];
        const doctorData = doctorDoc.data();


        
        //console.log('',linkedDoctors.some((d) => d.id === doctorDoc.id))
        const alreadyLinked = linkedDoctors.some((d) => d.id === doctorDoc.id );
        //const alreadyLinked = doctorDoc.id === 'doc456';


        //console.log(doctorDoc.id)
        //console.log('other id: ',alreadyLinked)
        //console.log('testing data: ', doctorDoc)
        if (alreadyLinked) {
          //console.log('already linked: ', doctorDoc)
          Alert.alert(
            'Already Linked',
            `You are already linked to Dr. ${doctorData.firstname} ${doctorData.surname}.` //
          );
          return;
        }

        // append to the user's doctorIds array
        //console.log('preupdate doc')
        await updateDoc(doc(db, 'users', user.id), {
          doctorIds: [...(linkedDoctors.map((d) => d.id) || []), doctorDoc.id],
        });
        //console.log('post update doc')
        Alert.alert(
          'Success',
          `You have successfully linked to Dr. ${doctorData.firstname.trim()} ${doctorData.surname.trim()}.`
        );

        //`You have successfully linked to Dr. ${doctorData.firstname.trim()} ${doctorData.surname.trim()}.`
        // refresh linked doctors to include newly added doctor
        setLinkedDoctors((prev) => [
          ...prev,
          {
            id: doctorDoc.id,
            firstname: doctorData.firstname,
            surname: doctorData.surname,
            email: doctorData.email,
          },
        ]);
      } else {
        //console.log('invalid testing')
        Alert.alert('Error', 'No doctor found with this email.');
      }
    } catch (error) {
      console.error('Error linking doctor:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }
  console.log('test2',appointments)
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={{ flex: 1 }} 
        data={appointments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Patient Dashboard</Text>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsHeader}>Your Details:</Text>
              <Text style={styles.detailsText}>Name: {user?.firstname || 'Unknown'} {user?.surname || 'Unknown'}</Text>
              <Text style={styles.detailsText}>Email: {user?.email || 'Unknown'}</Text>
              <Text style={styles.detailsText}>Date of Birth: {user?.dob || 'Unknown'}</Text>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.detailsHeader}>Linked Doctors:</Text>
              
              {linkedDoctors.length > 0 ? (
                linkedDoctors.map((doctor) => (
                  <View key={doctor.id} style={styles.linkedDoctorItem}>
                    <Text style={styles.detailsText}>Name: Dr. {doctor.firstname} {doctor.surname}</Text>
                    <Text style={styles.detailsText}>Email: {doctor.email}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.detailsText}>No linked doctors found.</Text>
              )}
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.searchButtonText}>Search and Link Doctor</Text>
              </TouchableOpacity>
            </View>
              <View style={styles.indicatorContainer}>
              <View style={[styles.indicator, { backgroundColor: '#b8ff7b' }]} />
              <Text style={styles.indicatorText}>Confirmed</Text>
              <View style={[styles.indicator, { backgroundColor: '#ffcccb' }]} />
              <Text style={styles.indicatorText}>Pending</Text>
            </View>
            <View>
            <Text style={styles.aptitle}>Upcoming Appointments:</Text>
            {appointments.length === 0 && (
              <Text style={styles.noAppointments}>No upcoming appointments.</Text>
            )}
            </View>
          </>
        }

        
        renderItem={({ item }) => (
          <View
            style={[
              styles.appointmentCard,
              { backgroundColor: item.status ? '#e1ffc7' : '#ffcccb' },
            ]}
          >
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  <Text style={styles.bold}>Date:</Text> {item.date} at {item.time}
                </Text>
                <Text style={styles.label}>
                  <Text style={styles.bold}>Doctor:</Text> {item.doctorName || 'Unknown Doctor'}
                </Text>
                <Text style={styles.label}>
                  <Text style={styles.bold}>Location:</Text> {item.address || 'No address provided'}
                </Text>
                <Text style={styles.label}>
                  <Text style={styles.bold}>Reason:</Text> {item.reason || 'No reason provided'}
                </Text>
                <Text style={styles.label}>
                  <Text style={styles.bold}>Status:</Text> {item.status ? 'Confirmed' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
          
        )}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.detailsHeader}>Link a Doctor</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter doctor's email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleSearchAndLink}>
              <Text style={styles.searchButtonText}>Link Doctor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: 'red', marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.searchButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  linkDoctorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    paddingTop:20,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#003366',
    textAlign: 'center', 
  },
  aptitle: {
    paddingTop:10,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#003366',
    textAlign: 'center', 
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
  searchButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  modalButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  searchButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 2,
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    width: '90%',
    alignSelf: 'center',
  },
  detailsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
  centeredText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginVertical: 15,
  },
  noAppointments: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 10,
  },
  appointmentItem: {
    width: '90%',
    padding: 15,
    borderColor: '#000',
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: '#e1ffc7',
    marginBottom: 10,
    alignSelf: 'center',
  },
  appointmentDateTime: {
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#000',  
    marginBottom: 5,
    textAlign: 'center', 
  },
  appointmentText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 3,
    //textAlign: 'center', 
  },
  indicatorContainer: {
    paddingBottom:10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  indicator: {
    width: 15,
    height: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  linkedDoctorItem: {
    marginBottom: 10
  },
  appointmentCard: {
    width: '90%',
    alignSelf: 'center',
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
});
