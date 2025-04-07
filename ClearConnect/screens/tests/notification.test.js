import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../NotificationScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';

//import { act } from 'react-test-renderer';

jest.mock('react-native-dropdown-picker', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');

  return ({ setValue }) => (
    <View>
      <Text>Sort by Priority</Text>
      <TouchableOpacity onPress={() => setValue('1')}>
        <Text>Priority 1</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setValue('2')}>
        <Text>Priority 2</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setValue('all')}>
        <Text>All</Text>
      </TouchableOpacity>
    </View>
  );
});




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

const mockNotification = {
  id: 'notif1',
  data: () => ({
    userid: 'user123',
    message: 'Critical alert for patient health',
    priority: 1,
    read: false,
    timestamp: {
      toDate: () => new Date('2025-04-06T10:00:00Z'),
    },
  }),
};


jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: (q, callback) => {
    callback({
      docs: [mockNotification],
    });
    return jest.fn();
  },
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

const mockUser = {
  id: 'user123',
  firstname: 'Test',
  surname: 'User',
  role: 0,
  email: 'test@example.com',
};

const renderNotifications = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser }}>
        <NotificationsScreen />
      </AuthContext.Provider>
    </NavigationContainer>
  );

describe('Notifications rendering and filter checks', () => {
  it('shows a notification message', async () => {
    const { getByText } = renderNotifications();

    await waitFor(() => {
      expect(getByText('Critical alert for patient health')).toBeTruthy();
    });
  });

  it('search filters notification by text when there is no notification matching', async () => {
    const { getByPlaceholderText, queryByText } = renderNotifications();

    const search = getByPlaceholderText('Search notifications...');
    fireEvent.changeText(search, 'unrelated');

    await waitFor(() => {
      expect(queryByText('Critical alert for patient health')).toBeNull();
    });
  });

  it('search filters notification by text when there is a notification matching', async () => {
    const { getByPlaceholderText, queryByText } = renderNotifications();

    const search = getByPlaceholderText('Search notifications...');
    fireEvent.changeText(search, 'Critical');

    await waitFor(() => {
      expect(queryByText('Critical alert for patient health')).toBeTruthy();
    });
  });


  it('filters notifications by priority when correct priority is chosen', async () => {
    const { getByText, queryByText } = renderNotifications();
  
    await waitFor(() => {
      expect(getByText('Critical alert for patient health')).toBeTruthy();
    });
  
    fireEvent.press(getByText('Priority 1'));
  
    await waitFor(() => {
      expect(getByText('Critical alert for patient health')).toBeTruthy();
      
    });
  }); 

  it('filters notifications by priority when incorrect priority is chosen', async () => {
    const { getByText, queryByText } = renderNotifications();
  
    await waitFor(() => {
      expect(getByText('Critical alert for patient health')).toBeTruthy();
    });
  
    fireEvent.press(getByText('Priority 2'));
  
    await waitFor(() => {
      expect(queryByText('Critical alert for patient health')).toBeNull();
    });
  });

});
