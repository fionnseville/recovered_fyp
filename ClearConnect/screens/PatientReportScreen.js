import React, { useState, useEffect, useContext } from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,} from 'react-native';
import { useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { useSessionValidation  } from '../Utils/useSessionValidation'; 
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../AuthContext';
import { useNavigation } from '@react-navigation/native';



export default function PatientReportScreen() {
  const route = useRoute();
  const { patientId, patientName } = route.params || {};

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reports, setReports] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = selectedDate.toLocaleDateString('en-GB');
  const { valid, validating, revalidate } = useSessionValidation();
  const { isLoggedIn } = useContext(AuthContext);

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      revalidate(); 
    }, [])
  );

  const average = (arr) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 'N/A';

  const median = (arr) => {
    if (!arr.length) return 'N/A';
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  const peak = (arr) => (arr.length ? Math.max(...arr) : 'N/A');
  const trough = (arr) => (arr.length ? Math.min(...arr) : 'N/A');

  const hasWarning = (bpmArray, spo2Array) => {
    const abnormalBPM = bpmArray.some((b) => b < 50 || b > 120);
    const abnormalSpO2 = spo2Array.some((o) => o < 90);
    return abnormalBPM || abnormalSpO2;
  };

  const isAbnormalBPM = (value) => value < 50 || value > 120;
  const isAbnormalSpO2 = (value) => value < 90;


  const fetchReports = async () => {
    if (!patientId) return;
    try {
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      const reportsQuery = query(
        collection(db, 'patient_reports'),
        where('userid', '==', patientId),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      );

      const snapshot = await getDocs(reportsQuery);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReports(results);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDate, patientId]);

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
      <Text style={styles.sectionTitle}>Health Reports for {formattedDate}</Text>

      <View style={{ alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity
          style={styles.dateButtonPicker}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.dateButtonText}>Select Date: {formattedDate}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowPicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}
      </View>

      {reports.length === 0 ? (
        <Text style={styles.noFilesText}>No reports found for this day.</Text>
      ) : (
        <>
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.reportItem}>
                {hasWarning(item.bpm, item.O2) && (
                  <Text style={styles.warning}>Irregular values detected</Text>
                )}
                <Text style={styles.reportText}>Readings: {item.bpm.length}</Text>
            
                <Text style={styles.reportText}>Heart Rate</Text>
                <Text style={styles.subMetric}>• Average: {average(item.bpm)}</Text>
                <Text style={styles.subMetric}>• Median: {median(item.bpm)}</Text>
                <Text style={styles.subMetric}>
                  • Highest:{' '}
                  <Text style={isAbnormalBPM(peak(item.bpm)) ? styles.highlightedValue : styles.normalValue}>
                    {peak(item.bpm)}
                  </Text>
                </Text>
                <Text style={styles.subMetric}>
                  • Lowest:{' '}
                  <Text style={isAbnormalBPM(trough(item.bpm)) ? styles.highlightedValue : styles.normalValue}>
                    {trough(item.bpm)}
                  </Text>
                </Text>
            
                <Text style={styles.reportText}>Blood Oxygen</Text>
                <Text style={styles.subMetric}>• Average: {average(item.O2)}%</Text>
                <Text style={styles.subMetric}>• Median: {median(item.O2)}%</Text>
                <Text style={styles.subMetric}>
                  • Highest:{' '}
                  <Text style={isAbnormalSpO2(peak(item.O2)) ? styles.highlightedValue : styles.normalValue}>
                    {peak(item.O2)}%
                  </Text>
                </Text>
                <Text style={styles.subMetric}>
                  • Lowest:{' '}
                  <Text style={isAbnormalSpO2(trough(item.O2)) ? styles.highlightedValue : styles.normalValue}>
                    {trough(item.O2)}%
                  </Text>
                </Text>
            
                <TouchableOpacity
                  style={styles.fullDataButton}
                  onPress={() => {
                    navigation.navigate('FullReport', {
                      report: item,
                      patientName,
                      date: formattedDate,
                    });
                  }}
                >
                  <Text style={styles.fullDataButtonText}>View All Data Points</Text>
                </TouchableOpacity>
              </View>
            )}
            
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5dc' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noFilesText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
    marginTop: 20,
  },
  warning: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
  },
  reportText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    //textAlign: 'center',
  },
  subMetric: {
    //textAlign: 'center',
    fontSize: 18,
    color: '#003366',
    marginLeft: 10,
    marginBottom: 2,
  },
  dateButtonPicker: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reportItem: {
    borderColor: '#007AFF',
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  highlightedValue: {
    color: 'red',
    fontWeight: 'bold',
  },
  normalValue: {
    color: '#003366',
  },  
  fullDataButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  fullDataButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },  
});
