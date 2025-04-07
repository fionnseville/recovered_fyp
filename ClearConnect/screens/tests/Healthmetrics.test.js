import React from 'react';
import { render, waitFor ,fireEvent} from '@testing-library/react-native';
import HealthMetrics from '../HealthMetricScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import { getDocs,addDoc } from 'firebase/firestore';

let mockFirestoreData = {
  bpm: 91,
  O2: 96,
  timestamp: {
    toDate: () => new Date('2025-04-04T20:32:10Z'),
  },
  userid: 'cR6yuMS9S7KRbj4H2KDb',
};

jest.spyOn(Alert, 'alert');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: (q, callback) => {
    callback({
      forEach: (fn) => fn({ data: () => mockFirestoreData }),
    });
    return jest.fn(); // unsubscribes
  },
  getDocs: jest.fn(), 
  addDoc: jest.fn(),
  Timestamp: {
    fromDate: () => ({}),
    now: () => ({}),
  },
}));

jest.mock('../../firebaseconfig', () => ({
  db: {},
}));

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    validating: false,
    valid: true,
    revalidate: jest.fn(),
  }),
}));


const mockUser = {
  id: 'cR6yuMS9S7KRbj4H2KDb',
  firstname: 'Fionn',
  surname: 'Seville',
  email: 'fionnseville@gmail.com',
};

const renderComponent = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser }}>
        <HealthMetrics />
      </AuthContext.Provider>
    </NavigationContainer>
  );

describe('HealthMetrics - Render Tests', () => {
  beforeEach(() => {
    mockFirestoreData = {
      bpm: 91,
      O2: 96,
      timestamp: {
        toDate: () => new Date('2025-04-04T20:32:10Z'),
      },
      userid: 'cR6yuMS9S7KRbj4H2KDb',
    };
  });

  it('renders current heart rate and SpO2 values', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText(/Current Heart Rate:/i)).toBeTruthy();
      expect(getByText(/91 bpm/i)).toBeTruthy();
      expect(getByText(/Current SpO2:/i)).toBeTruthy();
      expect(getByText(/96%/i)).toBeTruthy();
    });
  });

  it('shows no data message when theres no valid readings', async () => {
    mockFirestoreData = { bpm: 0, O2: 0 };

    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('No valid heart rate data to display.')).toBeTruthy();
      expect(getByText('No valid SpO2 data to display.')).toBeTruthy();
    });
  });


  it('renders charts when valid heart rate and SpO2 data is present', async () => {
    mockFirestoreData = {
      bpm: 75,
      O2: 97,
      timestamp: {
        toDate: () => new Date('2025-04-04T20:00:00Z'),
      },
      userid: 'cR6yuMS9S7KRbj4H2KDb',
    };
  
    const { queryByText } = renderComponent();
  
    await waitFor(() => {
      //instead of checking for charts i checked the other conditional rendering option wasnt rendered instead implying the charts are
      expect(queryByText('No valid heart rate data to display.')).toBeNull();
      expect(queryByText('No valid SpO2 data to display.')).toBeNull();
    });
  });

  it('renders charts when valid heart rate and SpO2 data is not present', async () => {
    mockFirestoreData = {
      bpm: 0,
      O2: 0,
      timestamp: {
        toDate: () => new Date('2025-04-04T20:00:00Z'),
      },
      userid: 'cR6yuMS9S7KRbj4H2KDb',
    };
  
    const { queryByText } = renderComponent();
  
    await waitFor(() => {
      expect(queryByText('No valid heart rate data to display.'));
      expect(queryByText('No valid SpO2 data to display.'));
    });
  });

  it('renders alert for invalid export', async () => {
    // fakes empty export data
    getDocs.mockResolvedValueOnce({
      forEach: jest.fn(), // no data
    });
  
    const { getByText } = renderComponent();
  
    fireEvent.press(getByText('Export'));
  
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'No Data',
        'No readings available for that time window.'
      );
    });
  });

  it('renders alert for valid export', async () => {
    // fakes valid export data
    getDocs.mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              bpm: 88,
              O2: 97,
              timestamp: {
                toDate: () => new Date('2025-04-04T20:00:00Z'),
              },
            }),
          },
        ],
        forEach: function (cb) {
          this.docs.forEach(cb);
        },
      });
  

    addDoc.mockResolvedValueOnce(); 
    const { getByText } = renderComponent();
  
    fireEvent.press(getByText('Export'));
  
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Readings exported for doctor review.'
      );
    });
  });

});
