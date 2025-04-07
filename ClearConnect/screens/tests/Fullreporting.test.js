import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import FullReportDetail from '../FullReportScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    valid: true,
    validating: false,
    revalidate: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useFocusEffect: (cb) => cb(),
  };
});

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));


jest.mock('../../firebaseconfig', () => ({
    db: {},
    storage: {},
  }));
  


const mockUser = {
  id: 'doc123',
  firstname: 'test',
  surname: 'Doctor',
  role: 1,
  email: 'doc@example.com',
};

const mockRoute = {
  params: {
    report: {
      bpm: [70, 75, 80],
      O2: [96, 97, 98],
    },
    patientName: 'John Doe',
    date: '08/04/2025',
  },
};


const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser, isLoggedIn: true, loading: false }}>
        <FullReportDetail route={mockRoute} />
      </AuthContext.Provider>
    </NavigationContainer>
  );


//no need for other checks as screen is only accessible from patient report screen if theres a report to view  
test('renders full report details with heart rate and oxygen charts', async () => {
  const { getByText } = renderComponent();

  await waitFor(() => {
    expect(getByText("John Doe's Full Report")).toBeTruthy();
    expect(getByText('Date: 08/04/2025')).toBeTruthy();
    expect(getByText('Heart Rate')).toBeTruthy();
    expect(getByText('Blood Oxygen')).toBeTruthy();
  });
});
