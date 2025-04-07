import React from 'react';
import { render, waitFor ,fireEvent} from '@testing-library/react-native';
import PatientDetailScreen from '../PatientDetailScreen';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../../AuthContext';

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    valid: true,
    validating: false,
    revalidate: jest.fn(),
  }),
}));

jest.mock('../../firebaseconfig', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: 'patient1',
          data: () => ({
            firstname: 'Jane',
            surname: 'Doe',
            dob: '01/04/2000',
          }),
        },
      ],
    })
  ),
}));

const mockUser = {
  id: 'doctor123',
  firstname: 'Dr.',
  surname: 'Strange',
  role: 1,
};

const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser }}>
        <PatientDetailScreen />
      </AuthContext.Provider>
    </NavigationContainer>
  );

describe('PatientDetailScreen render checks', () => {
  it('displays a linked patient', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('Jane Doe')).toBeTruthy();
      expect(getByText('Age: 25')).toBeTruthy();
    });
  });

  it('filters patients based on search query both valid and invalid', async () => {
    const { getByText, getByPlaceholderText, queryByText } = renderComponent();
  
    await waitFor(() => {
      expect(getByText('Jane Doe')).toBeTruthy();
    });
  
    const searchInput = getByPlaceholderText('Search patients...');
    fireEvent.changeText(searchInput, 'nonexistent');
  
    await waitFor(() => {
      expect(queryByText('Jane Doe')).toBeNull(); 
      expect(getByText('No linked patients found')).toBeTruthy();
    });
  
    fireEvent.changeText(searchInput, '');
  
    await waitFor(() => {
      expect(getByText('Jane Doe')).toBeTruthy();
    });

    const searchInput2 = getByPlaceholderText('Search patients...');
    fireEvent.changeText(searchInput2, 'Jan');
  
    await waitFor(() => {
      expect(getByText('Jane Doe')).toBeTruthy(); 
      //expect(getByText('No linked patients found')).toBeTruthy();
    });
  });
});
