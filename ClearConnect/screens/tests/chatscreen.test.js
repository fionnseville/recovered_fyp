import React from 'react';
import { render, waitFor ,fireEvent } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';
import { AuthContext } from '../../AuthContext';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('../../Utils/useSessionValidation', () => ({
  useSessionValidation: () => ({
    valid: true,
    validating: false,
    revalidate: jest.fn(),
  }),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'Message sent' }),
  })
);


jest.mock('../../firebaseconfig', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: (q, callback) => {
    callback({
      docs: [
        {
          id: 'msg1',
          data: () => ({
            senderId: 'user456',
            receiverId: 'user123',
            messageText: 'Hello from Jane!',
            timestamp: {
              toDate: () => new Date('2025-04-05T10:00:00Z'),
            },
            isRead: false,
          }),
          ref: {}, 
        },
      ],
    });
    return jest.fn(); 
  },
  updateDoc: jest.fn(),
}));
  

const mockUser = {
  id: 'user123',
  firstname: 'Test',
  surname: 'User',
  role: 0,
  email: 'test@example.com',
};

const route = {
  params: {
    chatId: 'user456',
    name: 'Jane Doe',
  },
};


const renderChat = () =>
  render(
    <NavigationContainer>
      <AuthContext.Provider value={{ user: mockUser }}>
        <ChatScreen route={route} />
      </AuthContext.Provider>
    </NavigationContainer>
  );

describe('rendering checks', () => {
  it('renders the chat header with recipient name', async () => {
    const { getByText } = renderChat();

    await waitFor(() => {
      expect(getByText('Chat with Jane Doe')).toBeTruthy();
    });
  });

  it('displays a message from the chat partner', async () => {
    const { getByText } = renderChat();

    await waitFor(() => {
      expect(getByText('Hello from Jane!')).toBeTruthy();
    });
  });
});


describe('Send a message successfully', () => {

    it('sends a message when the send button is pressed', async () => {
        const { getByPlaceholderText, getByText } = renderChat();
    
        const input = getByPlaceholderText('Type your message');
        const sendButton = getByText('Send');
    
        fireEvent.changeText(input, 'This is a test message.');
        fireEvent.press(sendButton);
    
        await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            'https://us-central1-healthguard-b70e1.cloudfunctions.net/sendMessage',
            expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: 'user123',
                receiverId: 'user456',
                messageText: 'This is a test message.',
            }),
            })
        );
        
        });
        
    });
});
  

