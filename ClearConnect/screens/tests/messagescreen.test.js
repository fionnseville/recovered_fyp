import React from 'react';
import { render, waitFor ,fireEvent} from '@testing-library/react-native';
import MessagesScreen from '../messageScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { useSessionValidation } from '../../Utils/useSessionValidation';
import { queryByText } from '@testing-library/react';


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

// needed to fake icon designs to stop error
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

const mockMessageDoc = {
  id: 'msg1',
  data: () => ({
    senderId: 'user123',
    receiverId: 'user456',
    messageText: 'Hello doctor!',
    timestamp: {
      toDate: () => new Date('2025-04-05T10:00:00Z'),
    },
    isRead: false,
  }),
};

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  or: jest.fn(),
  where: jest.fn(),
  onSnapshot: (q, callback) => {
    callback({
      docs: [mockMessageDoc],
    });
    return jest.fn(); 
  },
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({
        firstname: 'Jane',
        surname: 'Doe',
      }),
    })
  ),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
}));

const mockUser = {
  id: 'user123',
  firstname: 'Test',
  surname: 'User',
  role: 0,
  email: 'test@example.com',
};

const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser }}>
        <MessagesScreen />
      </AuthContext.Provider>
    </NavigationContainer>
  );

describe('MessagesScreen Rendering and filter checks', () => {
  it('renders the component and search bar', async () => {
    const { getByPlaceholderText } = renderComponent();

    await waitFor(() => {
      expect(getByPlaceholderText('Search by name...')).toBeTruthy();
    });
  });

  it('displays message and chat partner name ', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('Jane Doe')).toBeTruthy(); 
      expect(getByText('Hello doctor!')).toBeTruthy(); 
    });
  });

  it('search bar prevents rendering', async () => {
    const { getByPlaceholderText, queryByText } = renderComponent();
  
    const input = getByPlaceholderText('Search by name...');
    fireEvent.changeText(input, 'tester');
  
    await waitFor(() => {
      expect(queryByText('Jane Doe')).toBeNull(); 
      expect(queryByText('Hello doctor!')).toBeNull(); 
    });
  });

  it('search bar shows user correctly', async () => {
    const { getByPlaceholderText, queryByText } = renderComponent();
  
    const input = getByPlaceholderText('Search by name...');
    fireEvent.changeText(input, 'Jan');
  
    await waitFor(() => {
      expect(queryByText('Jane Doe')).toBeTruthy(); 
      expect(queryByText('Hello doctor!')).toBeTruthy(); 
    });
  });
  
});
