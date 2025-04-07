import React, { useState, useEffect, useContext,useRef  } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform ,ActivityIndicator} from 'react-native';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,updateDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { AuthContext } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function ChatScreen({ route }) {
  const { chatId, name } = route.params; 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const flatListRef = useRef(null);

  const { valid, validating, revalidate } = useSessionValidation();
  
  const { user } = useContext(AuthContext);  
  const currentUserId = user?.id;  // retrieve user ID from session


  useFocusEffect(
      React.useCallback(() => {
      //navigation.goBack();
      revalidate();
    }, [])
  );

  // fetches messages between users
  useEffect(() => {
    if (!currentUserId) return;
  
    const q = query(
      collection(db, 'messages'),
      where('senderId', 'in', [currentUserId, chatId]),
      where('receiverId', 'in', [currentUserId, chatId]),
      orderBy('timestamp', 'asc')
    );
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setMessages(chatMessages);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
  
      const unread = snapshot.docs.filter(
        (doc) =>
          doc.data().receiverId === currentUserId &&
          doc.data().senderId === chatId &&
          doc.data().isRead !== true
      );
  
      for (const docSnap of unread) {
        await updateDoc(docSnap.ref, { isRead: true });
      }
    });
  
    return unsubscribe;
  }, [currentUserId, chatId]);
  
  /*const sendMessage = async () => {
    if (input.trim()) {
      try {
        await addDoc(collection(db, 'messages'), {
          senderId: currentUserId,
          receiverId: chatId,
          messageText: input,
          timestamp: serverTimestamp(),  // timestamp in order to order messages
          isRead: false,
        });
        setInput('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);        
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }

    
  };*/
  const sendMessage = async () => {
    if (input.trim()) {
      try {
        await fetch('https://us-central1-healthguard-b70e1.cloudfunctions.net/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: currentUserId,
            receiverId: chatId,
            messageText: input,
          }),
        });
  
        setInput('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };
  

  if (validating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    ); 
  }
    
  if (!valid) {
    return (
      <View style={styles.centered}>
        <Text>Session expired or invalid. Please log in again.</Text>
      </View>
    );
  }      

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={90} //keyboardVerticalOffset={100}
    >
      <Text style={styles.chatHeader}>Chat with {name}</Text>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.senderId === currentUserId ? styles.sentMessage : styles.receivedMessage]}>
            <Text>{item.messageText}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message"
          placeholderTextColor="#888"  
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    padding: 10,
  },
  chatHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    maxWidth: '80%',
  },
  sentMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
    color: '#fff',
    borderRadius: 12,
  },
  receivedMessage: {
    backgroundColor: '#e1ffc7',
    alignSelf: 'flex-start',
    borderRadius: 12,
  },
  /*inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 10,  
    borderRadius: 15
  },*/
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',  
    borderRadius: 20,  
    padding: 10,  
    borderWidth: 1,  
    borderColor: '#ccc',  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, //android shadow 
    marginBottom: 10,
  },    
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
