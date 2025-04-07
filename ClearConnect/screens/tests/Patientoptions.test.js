import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PatientOptionsScreen from '../PatientOptionsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';

jest.mock('../../firebaseconfig', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
  }));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
    useRoute: () => ({
      params: {
        patientId: 'patient123',
        patientName: 'John Doe',
      },
    }),
  };
});

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    valid: true,
    validating: false,
    revalidate: jest.fn(),
  }),
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
      <AuthContext.Provider value={{ user: mockUser }}>
        <PatientOptionsScreen />
      </AuthContext.Provider>
    </NavigationContainer>
  );

test('renders both navigation buttons', async () => {
  const { getByText } = renderComponent();

  await waitFor(() => {
    expect(getByText('View Health Metrics')).toBeTruthy();
    expect(getByText('View Files')).toBeTruthy();
  });
});
