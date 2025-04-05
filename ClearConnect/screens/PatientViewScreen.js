import React, { useState, useEffect,useContext } from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,Alert,ActivityIndicator,Image,Modal,Linking} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {collection,query,where,getDocs,addDoc,serverTimestamp,} from 'firebase/firestore';
import {ref,uploadBytes,getDownloadURL,} from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { db, storage } from '../firebaseconfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionValidation } from '../Utils/useSessionValidation';

export default function PatientViewScreen() {
  const route = useRoute();
  const { isLoggedIn, user, loading } = useContext(AuthContext);

  const { patientId, patientName } = route.params || {};
  const [files, setFiles] = useState([]);
  const [fileloading, setfileLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const { valid, validating, revalidate } = useSessionValidation();
  
  useFocusEffect(
      React.useCallback(() => {
      //navigation.goBack();
      revalidate();
    }, [])
  );  


  const fetchFiles = async () => {
    setfileLoading(true);
    try {
      const filesQuery = query(
        collection(db, 'patientFiles'),
        where('patientId', '==', patientId)
      );
      const querySnapshot = await getDocs(filesQuery);
      const filesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFiles(filesList);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
    setfileLoading(false);
  };
  

  useEffect(() => {
    if (patientId) {
      fetchFiles();
    }
  }, [patientId]);


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


  const uploadFile = async () => {
    try {
      if (!patientId) {
        Alert.alert('Error', 'Invalid patient ID. Cannot upload.');
        return;
      }

      Alert.alert(
        'Select File Type',
        'Choose a file type to upload',
        [
          {
            text: 'Image',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'You need to enable permissions to upload images.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
              });

              if (result.canceled) return;

              const uri = result.assets[0].uri;
              const response = await fetch(uri);
              const blob = await response.blob();
              const fileName = `image_${Date.now()}.jpg`;
              await handleFileUpload(blob, fileName, 'image/jpeg');
            },
          },
          {
            text: 'PDF',
            onPress: async () => {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
              });

              if (result.canceled || !result.assets?.[0]) return;

              const { uri, name } = result.assets[0];
              const response = await fetch(uri);
              const blob = await response.blob();
              const fileName = name || `file_${Date.now()}.pdf`;
              await handleFileUpload(blob, fileName, 'application/pdf');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', `Failed to upload file: ${error.message}`);
    }
  };

  const handleFileUpload = async (blob, fileName, mimeType) => {
    const validPatientId = String(patientId).trim();
    const storageRef = ref(storage, `patient_files/${validPatientId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    const fileUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, 'patientFiles'), {
      patientId: validPatientId,
      fileName,
      fileUrl,
      mimeType,
      timestamp: serverTimestamp(),
    });

    Alert.alert('Success', 'File uploaded successfully!');
    fetchFiles();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{patientName}'s Files</Text>

      <TouchableOpacity style={styles.uploadButton} onPress={uploadFile}>
        <Text style={styles.uploadButtonText}>Upload File</Text>
      </TouchableOpacity>

      {fileloading && <ActivityIndicator size="large" color="#007AFF" />}

      {files.length === 0 && !fileloading ? (
        <Text style={styles.noFilesText}>No files available</Text>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.fileItem}
              onPress={() => {
                if (item.mimeType === 'application/pdf') {
                  setSelectedPdf(item.fileUrl);
                } else {
                  setSelectedImage(item.fileUrl);
                }
              }}
            >
              {item.mimeType === 'application/pdf' ? (
                <Image
                  source={require('../assets/pdf-icon.png')}
                  style={styles.thumbnail}
                />
              ) : (
                <Image source={{ uri: item.fileUrl }} style={styles.thumbnail} />
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/*Fullscreen for images */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.fullscreenContainer}
          onPress={() => setSelectedImage(null)}
        >
          <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} />
        </TouchableOpacity>
      </Modal>

      {/* Fullscreen PDF using WebView #007AFF*/}
      <Modal visible={!!selectedPdf} transparent={false} animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#f50a21' }}>
          <TouchableOpacity
            onPress={() => setSelectedPdf(null)}
            style={{
              backgroundColor: '#f50a21',
              padding: 14,
              marginTop: 40,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close PDF</Text>
          </TouchableOpacity>

          {selectedPdf && (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
              <WebView
                source={{ uri: selectedPdf }}
                style={{ flex: 1 }}
                useWebKit
                originWhitelist={['*']}
              />
            </View>
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5dc' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  uploadButtonText: { color: '#fff', fontWeight: 'bold' },
  noFilesText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
    marginTop: 20,
  },
  thumbnail: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 5,
    resizeMode: 'cover',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  fileItem: {
    padding: 15,
    borderRadius: 28,
    marginBottom: 10,
    borderWidth: 7.5,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
