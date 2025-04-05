import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView,ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, Timestamp ,getDocs} from 'firebase/firestore';
import { db } from '../firebaseconfig'; 
import DropDownPicker from 'react-native-dropdown-picker';
import { AuthContext } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionValidation } from '../Utils/useSessionValidation';
import { SafeAreaView } from 'react-native'; 
import { Alert, TouchableOpacity } from 'react-native';

export default function HealthMetrics() {
  const [heartRate, setHeartRate] = useState(new Array(10).fill(0));
  const [spo2, setSpO2] = useState(new Array(10).fill(0));
  const [currentHeartRate, setCurrentHeartRate] = useState(0);
  const [currentSpO2, setCurrentSpO2] = useState(0);

  const { user } = useContext(AuthContext); 
  const currentUserId = user?.id; 
  const [timeWindow, setTimeWindow] = useState(60 * 60 * 1000); 
  const [openTimeDropdown, setOpenTimeDropdown] = useState(false);

  const maxPoints = 15;
  const limitedHeartRate = heartRate.slice(-maxPoints);
  const limitedSpO2 = spo2.slice(-maxPoints);


  const timeOptions = [
    { label: '30 minutes', value: 30 * 60 * 1000 },
    { label: '1 hour', value: 60 * 60 * 1000 },
    { label: '24 hours', value: 24 * 60 * 60 * 1000 },
  ];
  
  const isEmptyData = heartRate.length === 0 || spo2.length === 0;

  const isValidChartData = (dataArray) => {
    return Array.isArray(dataArray) &&
      dataArray.length > 0 &&
      dataArray.every(val => Number.isFinite(val) && val !== 0);
  };  


  const { valid, validating, revalidate } = useSessionValidation();

  useFocusEffect(
      React.useCallback(() => {
      //navigation.goBack();
      revalidate();
    }, [])
  );    

  useEffect(() => {
    if (!currentUserId) {
      console.log('User is not logged in or userid is missing');
      return;
    }
  
    //const timeWindow = 1 * 60 * 60 * 1000; // 1 hour
  
    const readingsRef = collection(db, 'readings');
    const q = query(
      readingsRef,
      where('userid', '==', currentUserId),
      where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - timeWindow))),
      orderBy('timestamp', 'asc')
    );
  
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const heartRates = [];
      const spO2Levels = [];
  
      /*querySnapshot.forEach(doc => {
        const { bpm, O2 } = doc.data();
        heartRates.push(bpm);
        spO2Levels.push(O2);
      });*/

      querySnapshot.forEach(doc => {
        const { bpm, O2 } = doc.data();
        if (typeof bpm === 'number' && typeof O2 === 'number') {
          heartRates.push(bpm);
          spO2Levels.push(O2);
        }
      });
      
  
      setHeartRate(heartRates);
      setSpO2(spO2Levels);
      setCurrentHeartRate(heartRates[heartRates.length - 1] || 0);
      setCurrentSpO2(spO2Levels[spO2Levels.length - 1] || 0);
    });
  
    return () => unsubscribe();
  },  [currentUserId, timeWindow]);//[currentUserId]);
  

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

  // Simulate IoT data for testing
  /*useEffect(() => {
    if (!currentUserId) {
      console.warn('Cannot simulate data: user is not logged in');
      return;
    }

    const simulateIoTData = async () => {
      const randomBPM = Math.floor(Math.random() * (100 - 60 + 1) + 60); // Normal range: 60-100 bpm
      const randomSpO2 = Math.floor(Math.random() * (100 - 95 + 1) + 95); // Normal range: 95-100%

      const data = {
        userid: currentUserId,
        bpm: randomBPM,
        O2: randomSpO2,
        timestamp: Timestamp.now(),
      };

      try {
        const readingsRef = collection(db, 'readings');
        await addDoc(readingsRef, data);
        console.log('Simulated data sent:', data);
      } catch (error) {
        console.error('Error sending simulated data:', error);
      }
    };

    // Simulate data every 5 seconds
    const interval = setInterval(simulateIoTData, 5000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [currentUserId]);*/

  const screenWidth = Dimensions.get('window').width || 300;

  /*if (!heartRate.length || !spo2.length) {
    return (
      <View style={styles.container}>
        <Text>Loading charts...</Text>
      </View>
    );
  }*/

  return (
    <SafeAreaView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <ScrollView >
      <View style={styles.container}>
        <Text style={styles.title}>Health Metrics</Text>
        <View style={styles.buttonContainer}></View>
        <View style={styles.buttonContainer}>
      </View>
        <View style={styles.currentValues}>
          <Text style={styles.metric}>
            Current Heart Rate: <Text style={styles.value}>{currentHeartRate} bpm</Text>
          </Text>
          <Text style={styles.metric}>
            Current SpO2: <Text style={styles.value}>{currentSpO2}%</Text>
          </Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Heart Rate</Text>
          {isValidChartData(limitedHeartRate) ? (
            <LineChart
              data={{
                labels: Array.from({ length: limitedHeartRate.length }, (_, i) => `${i + 1}`),
                datasets: [{ data: limitedHeartRate }],
              }}
              width={screenWidth - 40}
              height={200}
              yAxisSuffix=" bpm"
              fromZero={true}
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: '#003366',
                backgroundGradientFrom: '#003366',
                backgroundGradientTo: '#00509E',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#ffa726',
                },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={{ color: '#888' }}>No valid heart rate data to display.</Text>
          )}

          <Text style={styles.chartTitle}>SpO2</Text>
          {isValidChartData(limitedSpO2) ? (
            <LineChart
              data={{
                labels: Array.from({ length: limitedSpO2.length }, (_, i) => `${i + 1}`),
                datasets: [{ data: limitedSpO2 }],
              }}
              width={screenWidth - 40}
              height={200}
              yAxisSuffix=" %"
              fromZero={false}
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: '#003366',
                backgroundGradientFrom: '#003366',
                backgroundGradientTo: '#00509E',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#ffa726',
                },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={{ color: '#888' }}>No valid SpO2 data to display.</Text>
          )}
        </View>

      </View>
        <View style={styles.container}>
          <Text style={styles.exportLabel}>Send Readings for Review:</Text>
          <View style={styles.dropdownContainer}>
            <DropDownPicker
              open={openTimeDropdown}
              value={timeWindow}
              items={timeOptions}
              setOpen={setOpenTimeDropdown}
              setValue={setTimeWindow}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownOptions}
              placeholder="Select Time Window"
              zIndex={5000}
            />
          </View>
        
          <TouchableOpacity
            style={styles.exportButton}
            onPress={async () => {
              if (!currentUserId || !timeWindow) return;

              try {
                const exportRef = collection(db, 'readings');
                const exportQuery = query(
                  exportRef,
                  where('userid', '==', currentUserId),
                  where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - timeWindow))),
                  orderBy('timestamp', 'asc')
                );

                const snapshot = await getDocs(exportQuery);
                const heartRates = [];
                const spo2Levels = [];
                const timestamps = [];

                snapshot.forEach(doc => {
                  const { bpm, O2, timestamp } = doc.data();
                  if (typeof bpm === 'number' && typeof O2 === 'number' && timestamp) {
                    heartRates.push(bpm);
                    spo2Levels.push(O2);
                    timestamps.push(timestamp.toDate().toISOString());
                  }
                });

                if (heartRates.length === 0) {
                  Alert.alert("No Data", "No readings available for that time window.");
                  return;
                }

                const reportDoc = {
                  userid: currentUserId,
                  createdAt: Timestamp.now(),
                  timeRange: `${timeWindow / (60 * 1000)} minutes`,
                  bpm: heartRates,
                  O2: spo2Levels,
                  timestamps,
                };

                await addDoc(collection(db, 'patient_reports'), reportDoc);
                Alert.alert("Success", "Readings exported for doctor review.");
              } catch (err) {
                console.error('Error exporting readings:', err);
                Alert.alert("Error", "Failed to export readings.");
              }
            }}
          >
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>

        </View>
        
      </ScrollView>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#003366',
  },
  currentValues: {
    marginBottom: 20,
    alignItems: 'center',
  },
  metric: {
    fontSize: 18,
    color: '#003366',
    marginBottom: 5,
  },
  value: {
    fontWeight: 'bold',
    color: '#000',
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex: 1000, // important for dropdown layering
    width: "90%",
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },  
  filterLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#003366',
  },
  exportLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    marginTop: 20,
    marginBottom: 10,
  },
  
  exportButton: {
    backgroundColor: '#003366',
    padding: 12,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
    marginBottom: 30,
  },
  
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
});
