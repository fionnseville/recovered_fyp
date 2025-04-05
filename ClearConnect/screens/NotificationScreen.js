import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker'; 
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseconfig';
import { AuthContext } from '../AuthContext';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function NotificationsScreen() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(null); 
  const [openDropdown, setOpenDropdown] = useState(false); 

  const { valid, validating, revalidate } = useSessionValidation();

  useFocusEffect(
      React.useCallback(() => {
        //navigation.goBack();
        revalidate(); 
      }, [])
    );  

  useEffect(() => {
    if (!user || !user.id) return;

    console.log("Fetching notifications for user:", user.id);

    const q = query(
      collection(db, 'notifications'),
      where('userid', '==', user.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(fetchedNotifications);
      setFilteredNotifications(fetchedNotifications); 
    });

    return () => unsubscribe();
  }, [user]);

  //mark notifications as read
  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  //filtering notifications by search and priority
  useEffect(() => {
    let filtered = notifications;

    if (priorityFilter && priorityFilter !== 'all') {
      filtered = filtered.filter((n) => n.priority.toString() === priorityFilter);
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((n) =>
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [searchQuery, priorityFilter, notifications]);

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
      <Text style={styles.title}>Notifications</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search notifications..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/*Notification level*/}
      <DropDownPicker
        open={openDropdown}
        value={priorityFilter}
        items={[
          { label: "All", value: "all" },
          { label: "Priority 1", value: "1" },
          { label: "Priority 2", value: "2" },
          { label: "Priority 3", value: "3" },
          { label: "Priority 4", value: "4" },
          { label: "Priority 5", value: "5" },
        ]}
        setOpen={setOpenDropdown}
        setValue={setPriorityFilter}
        containerStyle={styles.dropdownContainer}
        style={styles.dropdown}
        dropDownStyle={styles.dropdownOptions}
        placeholder="Sort by Priority"
      />

      {filteredNotifications.length === 0 ? (
        <Text style={styles.noNotifications}>No notifications available</Text>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notification, item.read ? styles.read : styles.unread]}
              onPress={() => markAsRead(item.id)}
            >
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.timestamp}>
                {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : "No Timestamp"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderColor: '#ccc',
  },
  dropdownOptions: {
    backgroundColor: '#ffffff',
  },
  noNotifications: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  notification: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  unread: {
    backgroundColor: '#e6f7ff',
  },
  read: {
    backgroundColor: '#d9d9d9',
  },
  message: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
    marginTop: 5,
  },
});
