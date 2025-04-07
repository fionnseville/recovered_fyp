import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../registry';
import { Alert } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: () => 'mocked_timestamp',
}));

jest.spyOn(Alert, 'alert');

jest.mock('../../firebaseconfig', () => ({
    db: {},
  }));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('RegisterScreen render and input checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all input fields and buttons', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    expect(getByPlaceholderText('First Name')).toBeTruthy();
    expect(getByPlaceholderText('Surname')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(getByText('Already have an account? Login')).toBeTruthy();
  });

  it('shows alert if required fields are missing', async () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'All fields are required.');
    });
  });

});
