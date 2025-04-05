import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions ,ActivityIndicator} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSessionValidation  } from '../Utils/useSessionValidation'; 
import { useFocusEffect } from '@react-navigation/native';

export default function FullReportDetail({ route }) {
  const { report, patientName, date } = route.params;

  const baseWidth = Dimensions.get('window').width;
  const spacingMultiplier = 25; 
  const chartWidth = (report.bpm?.length || 1) * spacingMultiplier;

  const CHART_HEIGHT = 220;

  const bpmData = report.bpm || [];
  const spo2Data = report.O2 || [];
  const chartLabels = bpmData.map((_, i) => (i + 1).toString());
  const { valid, validating, revalidate } = useSessionValidation();
  /*const chartLabels = bpmData.map((_, i) =>
    i % 10 === 0 ? `${i }` : '' 
  );  */

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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{patientName}'s Full Report</Text>
      <Text style={styles.subtitle}>Date: {date}</Text>
      <Text style={styles.sectionTitle}>Heart Rate</Text>
      <ScrollView horizontal>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: bpmData }],
          }}
          width={chartWidth}
          height={CHART_HEIGHT}
          fromZero
          withDots={false} 
          yAxisSuffix=" bpm"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: () => '#007AFF',
            propsForBackgroundLines: {
              stroke: '#ccc',
            },
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>

      <Text style={styles.sectionTitle}>Blood Oxygen</Text>
      <ScrollView horizontal>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: spo2Data }],
          }}
          width={chartWidth}
          height={CHART_HEIGHT}
          withDots={false}
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: () => '#00cc88',
            propsForBackgroundLines: {
              stroke: '#ccc',
            },
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5dc' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#003366',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#007AFF',
  },
  chart: {
    borderRadius: 16,
    marginBottom: 20,
  },
});
