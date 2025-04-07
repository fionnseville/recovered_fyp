import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PatientReportScreen from '../PatientReportScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useRoute: () => ({
      params: {
        patientId: 'patient123',
        patientName: 'John Doe',
      },
    }),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
    useFocusEffect: (cb) => cb(),
  };
});

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    valid: true,
    validating: false,
    revalidate: jest.fn(),
  }),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [],
    })
  ),
  Timestamp: {
    fromDate: jest.fn(() => 'mock-timestamp'),
  },
}));

jest.mock('../../firebaseconfig', () => ({
    db: {},
    storage: {},
  }));
  

const mockUser = {
  id: 'doc123',
  firstname: 'Doc',
  surname: 'McStuffins',
  role: 1,
  email: 'doc@example.com',
};

const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser, isLoggedIn: true, loading: false }}>
        <PatientReportScreen />
      </AuthContext.Provider>
    </NavigationContainer>
  );

test('renders when no reports are available', async () => {
  const { getByText } = renderComponent();

  await waitFor(() => {
    expect(getByText(/Health Reports for/)).toBeTruthy();
    expect(getByText('No reports found for this day.')).toBeTruthy();
  });
});

test('renders reports correctly when data is available', async () => {
    const { getDocs } = require('firebase/firestore');
  
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'report1',
          data: () => ({
            bpm: [72, 76, 80, 85],//should average to 78 roughly
            O2: [95, 96, 97, 98],//should average to 97 rounding up
          }),
        },
      ],
    });
  
    const { getByText } = renderComponent();
  
    await waitFor(() => {
      expect(getByText(/Health Reports for/)).toBeTruthy();
  
      expect(getByText('Readings: 4')).toBeTruthy();
      expect(getByText('Heart Rate')).toBeTruthy();
      expect(getByText('• Average: 78')).toBeTruthy(); 
      expect(getByText('Blood Oxygen')).toBeTruthy();
      expect(getByText('• Average: 97%')).toBeTruthy(); 
      expect(getByText('View All Data Points')).toBeTruthy();
    });

  });
  
test('renders reports correctly and notes irregular values', async () => {
    const { getDocs } = require('firebase/firestore');
  
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'report1',
          data: () => ({
            bpm: [72, 76, 35, 85],
            O2: [95, 96, 57, 98],
          }),
        },
      ],
    });
  
    const { getByText } = renderComponent();
  
    await waitFor(() => {
      expect(getByText(/Health Reports for/)).toBeTruthy();
  
      expect(getByText('Irregular values detected')).toBeTruthy(); 
    });

  });  
