
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import EditAppointmentScreen from '../editappointmentscreen';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';
import { Alert } from 'react-native';
import { updateDoc, deleteDoc } from 'firebase/firestore';

jest.spyOn(Alert, 'alert');

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    valid: true,
    validating: false,
    revalidate: jest.fn(),
  }),
}));

jest.mock('../../firebaseconfig', () => ({ 
  db: {} 
}));

jest.mock('firebase/firestore', () => ({
  //doc: jest.fn(),
  doc: jest.fn(() => mockDocRef),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
}));

const mockDocRef = { 
    id: 'appt123-ref' 
};

const mockAppointment = {
  id: 'appt123',
  date: '08/04/2025',
  time: '10:00',
  address: 'Clinic A',
  reason: 'Routine Check',
  status: true,
};

const mockUser = {
  id: 'doc123',
  firstname: 'test',
  surname: 'Doctor',
  role: 1,
  email: 'doc@example.com',
};

const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser }}>
        <EditAppointmentScreen
          route={{ params: { appointment: mockAppointment } }}
          navigation={{ goBack: jest.fn() }}
        />
      </AuthContext.Provider>
    </NavigationContainer>
  );

describe('Edit appointment functionalities', () => {
  it('renders initial appointment data', async () => {
    const { getByDisplayValue, getByText } = renderComponent();

    await waitFor(() => {
      expect(getByDisplayValue('Clinic A')).toBeTruthy();
      expect(getByDisplayValue('Routine Check')).toBeTruthy();
      expect(getByText('08/04/2025')).toBeTruthy();
      expect(getByText('10:00')).toBeTruthy();
      expect(getByText('Save')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
    });
  });

  it('updates appointment successfully', async () => {
    const { getByText, getByDisplayValue } = renderComponent();

    fireEvent.changeText(getByDisplayValue('Clinic A'), 'blah');
    fireEvent.changeText(getByDisplayValue('Routine Check'), 'blah');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
        expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
        address: 'blah',
        reason: 'blah',
        status: true,
        date: '08/04/2025',
        time: '10:00',
      });
          
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Appointment updated.');
    });
  });

  it('deletes appointment after confirmation', async () => {
    const { getByDisplayValue, getByText } = renderComponent();
    fireEvent.press(getByText('Delete'));
  
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirm Delete',
        'Are you sure you want to delete this appointment?',
        expect.any(Array)
      );
    });
  
    const deleteAlert = Alert.alert.mock.calls.find(
      ([title]) => title === 'Confirm Delete'
    );
    const buttons = deleteAlert[2] || deleteAlert[1]; 
    const deleteButton = buttons.find(btn => btn.text === 'Delete');//checks the correct index for button so cancel isnt triggered
  
    // Call the onPress handler
    await waitFor(() => deleteButton.onPress());
  
    expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    expect(Alert.alert).toHaveBeenCalledWith('Deleted', 'Appointment deleted.');
  });  

});
