import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PatientViewScreen from '../PatientViewScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { Image } from 'react-native';

//mocked to stop error from webview usage just for image/pdf fullscreen
jest.mock('react-native-webview', () => {
    const { View, Text } = require('react-native');
    return {
      WebView: (props) => (
        <View>
          <Text>Mock WebView</Text>
        </View>
      ),
    };
  });  

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
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/uploaded-file')),
}));

jest.mock('../../firebaseconfig', () => ({
  db: {},
  storage: {},
}));


global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        files: [
          {
            id: 'file1',
            fileUrl: 'https://example.com/image.jpg',
            fileName: 'image.jpg',
            mimeType: 'image/jpeg',
          },
          {
            id: 'file2',
            fileUrl: 'https://example.com/document.pdf',
            fileName: 'document.pdf',
            mimeType: 'application/pdf',
          },
        ],
      }),
  })
);

const mockUser = {
  id: 'doc123',
  email: 'doc@example.com',
  role: 1,
};

const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser, isLoggedIn: true, loading: false }}>
        <PatientViewScreen />
      </AuthContext.Provider>
    </NavigationContainer>
  );

describe('PatientViewScreen', () => {
  it('renders fetched pdf and image files', async () => {
    const { getByText, getByTestId} = renderComponent();

    await waitFor(() => {
      //added ids to confirm if render for pdf and image working
       expect(getByTestId('thumbnail-pdf-file2')).toBeTruthy();
       expect(getByTestId('thumbnail-img-file1')).toBeTruthy();
    });
  });
});
