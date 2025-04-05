import React, { useEffect, useState, useContext } from 'react';
import {View,Text,StyleSheet,FlatList,TouchableOpacity,TextInput,Modal,ActivityIndicator} from 'react-native';
import { collection, doc, getDoc,getDocs, where, query, or, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { useNavigation ,useFocusEffect} from '@react-navigation/native';
import { AuthContext } from '../AuthContext';
import { AntDesign } from '@expo/vector-icons';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function MessagesScreen() {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [linkedUsers, setLinkedUsers] = useState([]); 
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id; 
  const isDoctor = user?.role === 1; 

  const { valid, validating, revalidate } = useSessionValidation();

  useFocusEffect(
    React.useCallback(() => {
      //navigation.goBack();
      revalidate(); 
    }, [])
  );  

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChats = () => {
      const messagesRef = collection(db, 'messages');

      // Query messages where the user is either the sender OR receiver
      const q = query(
        messagesRef,
        or(
          where('senderId', '==', currentUserId),
          where('receiverId', '==', currentUserId)
        )
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const allMessages = [];
        const tempUnreadMap = {};

        for (const messageDoc of snapshot.docs) {
          const data = messageDoc.data();
          const chatPartnerId =
            data.senderId === currentUserId ? data.receiverId : data.senderId;

          // tracks read/unread
          if (
            data.receiverId === currentUserId &&
            data.senderId === chatPartnerId &&
            data.isRead === false
          ) {
            tempUnreadMap[chatPartnerId] = true;
          }

          const partnerRef = doc(db, 'users', chatPartnerId);
          const partnerSnap = await getDoc(partnerRef);

          let partnerName = 'Unknown';
          if (partnerSnap.exists()) {
            const partnerData = partnerSnap.data();
            partnerName = `${partnerData.firstname} ${partnerData.surname}`;
          }

          allMessages.push({
            id: messageDoc.id,
            chatPartnerId,
            chatPartnerName: partnerName,
            messageText: data.messageText,
            timestamp: data.timestamp ? data.timestamp.toDate() : new Date(0),
            //isUnread: hasUnread,
          });
        }


        const uniqueChats = allMessages.reduce((acc, chat) => {
          const existingChat = acc.find(
            (item) => item.chatPartnerId === chat.chatPartnerId
          );
        
          if (!existingChat || existingChat.timestamp < chat.timestamp) {
            acc = acc.filter((item) => item.chatPartnerId !== chat.chatPartnerId);
            acc.push({
              ...chat,
              isUnread: tempUnreadMap[chat.chatPartnerId] === true, 
            });
          }
          return acc;
        }, []);
        
        uniqueChats.sort((a, b) => b.timestamp - a.timestamp)
        setChats(uniqueChats);
        setFilteredChats(uniqueChats);
      });

      return () => unsubscribe();
    };

    fetchChats();
  }, [currentUserId]);

  // Filter chats when search query changes
  useEffect(() => {
    const filtered = chats.filter((chat) =>
      chat.chatPartnerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchQuery, chats]);

  const fetchLinkedUsers = async () => {
  if (!currentUserId) {
    console.error("Current user ID is undefined");
    return;
  }

  try {
    if (isDoctor) {
      const patientsQuery = query(
        collection(db, 'users'),
        where('doctorIds', 'array-contains', currentUserId) 
      );

      const querySnapshot = await getDocs(patientsQuery);
      const patients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().firstname} ${doc.data().surname}`
      }));

      console.log("Linked Patients:", patients);
      setLinkedUsers(patients);
      setFilteredUsers(patients);
    } else {
      // If user is a patient, get their linked doctors
      const userRef = doc(db, 'users', currentUserId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("User document does not exist in Firestore");
        return;
      }

      const userData = userSnap.data();
      let linkedIds = userData.doctorIds || []; // Get assigned doctors

      if (!Array.isArray(linkedIds) || linkedIds.length === 0) {
        console.log("No linked users found");
        setLinkedUsers([]);
        setFilteredUsers([]);
        return;
      }

      console.log("Linked doctor IDs:", linkedIds);

      const doctorPromises = linkedIds.map(async (doctorId) => {
        const doctorRef = doc(db, 'users', doctorId);
        const doctorSnap = await getDoc(doctorRef);

        if (doctorSnap.exists()) {
          const doctorData = doctorSnap.data();
          return {
            id: doctorId,
            name: `${doctorData.firstname} ${doctorData.surname}`,
          };
        } else {
          console.warn(`Doctor with ID ${doctorId} does not exist`);
          return null;
        }
      });

      const doctors = (await Promise.all(doctorPromises)).filter(Boolean);

      console.log("Linked doctors:", doctors);

      setLinkedUsers(doctors);
      setFilteredUsers(doctors);
    }
  } catch (error) {
    console.error("Error fetching linked users:", error);
  }
};

  useEffect(() => {
    const filtered = linkedUsers.filter((user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [userSearchQuery, linkedUsers]);

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
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by name..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No messages found</Text>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatItem, item.isUnread && styles.unreadChatItem]}
              onPress={() =>
                navigation.navigate('ChatScreen', {
                  chatId: item.chatPartnerId,
                  name: item.chatPartnerName,
                })
              }
            >
              <View style={styles.chatRow}>
                <Text style={[styles.chatName, item.isUnread && styles.unreadText]}>
                  {item.chatPartnerName}
                </Text>
                {item.isUnread && <View style={styles.redDot} />}
              </View>
              <Text style={[styles.latestMessage, item.isUnread && styles.unreadText]}>
                {item.messageText}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* New Chat Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          setModalVisible(true);
          fetchLinkedUsers();
        }}
      >
        <AntDesign name="message1" size={30} color="#007AFF" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setModalVisible(false)}
            >
              <AntDesign name="close" size={24} color="red" />
            </TouchableOpacity>

            <TextInput
              style={styles.modalSearchBar}
              placeholder="Search users..."
              placeholderTextColor="#888"
              value={userSearchQuery}
              onChangeText={setUserSearchQuery}
            />

            {/* List of Users */}
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalDoctorItem}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('ChatScreen', {
                      chatId: item.id,
                      name: item.name,
                    });
                  }}
                >
                  <Text style={styles.modalDoctorName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    padding: 10,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  chatItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#ccc',
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  latestMessage: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    borderWidth: 6,
    borderColor: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 45, 
    paddingBottom: 45,
  },
  modalContent: {
    width: '90%',
    height: '80%', 
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    position: 'relative', 
    paddingTop:50
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10, 
    zIndex: 1,
  },
  modalSearchBar: {
    backgroundColor: '#f0f0f0', 
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    width: '100%', 
    //paddingTop:
    
  },
  modalDoctorItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%', 
  },
  modalDoctorName: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center', 
  },
  chatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadText: {
    fontWeight: 'bold',
    color: 'blue',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'blue',
  },
  unreadChatItem: {
    borderColor: 'blue',//#39FF14

  },  
});
