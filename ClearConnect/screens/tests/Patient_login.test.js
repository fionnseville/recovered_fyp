import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Patient_login from '../Patient_login';
import { Alert } from 'react-native';
import { AuthContext } from '../../AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as firestore from 'firebase/firestore';
import { createSession } from '../../Utils/sessionUtils';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: jest.fn(),
    createNavigationContainerRef: jest.fn(() => ({ current: null })),
  };
});

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../../firebaseconfig', () => ({
  db: {},
}));

jest.mock('../../Utils/sessionUtils', () => ({
  createSession: jest.fn(),
}));


describe('Patient_login', () => {
  const mockReset = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    useNavigation.mockReturnValue({ reset: mockReset });
    jest.spyOn(Alert, 'alert').mockClear();
    mockLogin.mockClear();
    mockReset.mockClear();
  });

  const renderComponent = () =>
    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <Patient_login />
      </AuthContext.Provider>
    );

  it('alerts if email or password is missing', () => {
    const { getByText } = renderComponent();
    fireEvent.press(getByText('Login'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please enter both email and password.'
    );
  });

  it('alerts if no user is found', async () => {
    firestore.getDocs.mockResolvedValue({ empty: true });

    const { getByPlaceholderText, getByText } = renderComponent();
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid email or password'
      );
    });
  });

  it('alerts if password is incorrect', async () => {
    const correctHash = require('js-sha256').sha256('correct_password');

    firestore.getDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'user123',
          data: () => ({
            email: 'test@example.com',
            passhash: correctHash,
            firstname: 'Test',
            surname: 'User',
            dob: '2000-01-01',
            gender: 1,
            role: 0,
          }),
        },
      ],
    });

    const { getByPlaceholderText, getByText } = renderComponent();
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong_password');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Incorrect password'
      );
    });
  });

  it('alerts if user is not a patient', async () => {
    const hashed = require('js-sha256').sha256('password123');

    firestore.getDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'user456',
          data: () => ({
            email: 'testing@example.com',
            passhash: hashed,
            firstname: 'Admin',
            surname: 'User',
            dob: '1985-01-01',
            gender: 0,
            role: 1, 
          }),
        },
      ],
    });

    const { getByPlaceholderText, getByText } = renderComponent();
    fireEvent.changeText(getByPlaceholderText('Email'), 'testing@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Only patients can log in here.'
      );
    });
  });

  it('logs in patient successfully', async () => {
    const testUser = {
      email: 'test@example.com',
      passhash: require('js-sha256').sha256('password123'),
      firstname: 'Test',
      surname: 'User',
      dob: '2000-01-01',
      gender: 1,
      role: 0,
    };

    firestore.getDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'user123',
          data: () => testUser,
        },
      ],
    });

    createSession.mockResolvedValue({
      sessionId: 'abc123',
      token: 'xyz789',
    });

    const { getByPlaceholderText, getByText } = renderComponent();
    fireEvent.changeText(getByPlaceholderText('Email'), testUser.email);
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Successful',
        `Welcome, ${testUser.firstname} ${testUser.surname}!`
      );

      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user123',
          email: testUser.email,
          firstname: testUser.firstname,
          surname: testUser.surname,
          dob: testUser.dob,
          gender: testUser.gender,
          role: testUser.role,
          sessionId: 'abc123',
          token: 'xyz789',
        })
      );

      expect(mockReset).toHaveBeenCalled();
    });
  });
});
