import React from 'react';
import { render, waitFor ,fireEvent} from '@testing-library/react-native';
import DoctorDashboardScreen from '../DoctorDashboardScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    valid: true,
    validating: false,
    revalidate: jest.fn(),
  }),
}));

jest.mock('../../firebaseconfig', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: 'appt1',
          data: () => ({
            date: '08/04/2025',
            time: '10:00',
            patientid: 'patient123',
            address: 'Clinic A',
            reason: 'Check-up',
            status: true,
            doctorid: 'doctor123',
          }),
        },
        {
          id: 'appt2',
          data: () => ({
            date: '15/04/2025',
            time: '14:00',
            patientid: 'patient123',
            address: 'Clinic B',
            reason: 'Follow-up',
            status: false,
            doctorid: 'doctor123',
          }),
        },
      ],
    })
  ),  
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        firstname: 'John',
        surname: 'Doe',
      }),
    })
  ),
  doc: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => 'FontAwesome',
}));

const mockDoctor = {
  id: 'doc123',
  firstname: 'test',
  surname: 'Doctor',
  role: 1,
  email: 'doc@example.com',
};

jest.mock('react-native-dropdown-picker', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');

  return ({ setValue }) => (
    <View>
      <Text>Filter Appointments</Text>
      <TouchableOpacity onPress={() => setValue('today')}>
        <Text>Today</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setValue('week')}>
        <Text>This Week</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setValue('all')}>
        <Text>All Upcoming</Text>
      </TouchableOpacity>
    </View>
  );
});


const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockDoctor, isLoggedIn: true, loading: false }}>
        <DoctorDashboardScreen />
      </AuthContext.Provider>
    </NavigationContainer>
  );


it('renders the doctor dashboard list view buttons and header', async () => {
  const { getByText } = renderComponent();

  await waitFor(() => {
    expect(getByText('Doctor Dashboard')).toBeTruthy();
    expect(getByText('List View')).toBeTruthy();
    expect(getByText('Calendar View')).toBeTruthy();
  });

});



it('renders appointments  without filter', async () => {
    const { getByText ,getAllByText} = renderComponent();
  
    await waitFor(() => {
      expect(getByText('Doctor Dashboard')).toBeTruthy();
      expect(getByText('Date: 08/04/2025 at 10:00')).toBeTruthy(); 
      //expect(getByText('Patient: John Doe')).toBeTruthy();
      expect(getAllByText('Patient: John Doe')).toBeTruthy();//so it can be found multiple times
      expect(getByText('Location: Clinic A')).toBeTruthy();
      expect(getByText('Reason: Check-up')).toBeTruthy();
      expect(getByText('Status: Confirmed')).toBeTruthy();
    });
  });
  
it('check all filters work', async () => {
  const { getByText, queryByText } = renderComponent();

  await waitFor(() => {
    expect(getByText('Doctor Dashboard')).toBeTruthy();
  });

  // Simulate selecting the "This Week" filter
  fireEvent.press(getByText('This Week'));

  await waitFor(() => {
    expect(getByText('Date: 08/04/2025 at 10:00')).toBeTruthy();
    expect(queryByText('Date: 15/04/2025 at 14:00')).toBeNull();
    //expect(queryByText('Date: 15/04/2025 at 14:00')).toBeNull();
  });

  fireEvent.press(getByText('All Upcoming'));

  await waitFor(() => {
    expect(getByText('Date: 08/04/2025 at 10:00')).toBeTruthy();
    expect(getByText('Date: 15/04/2025 at 14:00')).toBeTruthy();
    //expect(queryByText('Date: 15/04/2025 at 14:00')).toBeNull();
    //expect(queryByText('Date: 15/04/2025 at 14:00')).toBeNull();
  });

  fireEvent.press(getByText('Today'));

  await waitFor(() => {
    //expect(getByText('Date: 08/04/2025 at 10:00')).toBeTruthy();
    //expect(getByText('Date: 15/04/2025 at 14:00')).toBeTruthy();
    expect(queryByText('Date: 15/04/2025 at 14:00')).toBeNull();
    expect(queryByText('Date: 08/04/2025 at 10:00')).toBeNull();
  });
});

it('switches to calendar view and shows appointments or no appointments on selected date', async () => {
  const { getByText, queryByText } = renderComponent();

  await waitFor(() => {
    expect(getByText('Doctor Dashboard')).toBeTruthy();
  });

  fireEvent.press(getByText('Calendar View'));

  await waitFor(() => {
    expect(getByText(/Appointments on/)).toBeTruthy();
  });

  fireEvent.press(getByText('8')); // 08/04/2025

  await waitFor(() => {
    expect(getByText('Date: 08/04/2025 at 10:00')).toBeTruthy();
    expect(getByText('Patient: John Doe')).toBeTruthy();
  });

  fireEvent.press(getByText('17')); 

  await waitFor(() => {
    expect(queryByText('Date: 08/04/2025 at 10:00')).toBeNull();
    expect(getByText('No appointments for this day.')).toBeTruthy();
  });
});

