import { Image, ImageBackground, Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons';

import IndexScreen from './screens/index';
import ContactsScreen from './screens/messageScreen';
import UserGuideScreen from './screens/HealthMetricScreen';
import HelpScreen from './screens/NotificationScreen';
import PatientLoginScreen from './screens/Patient_login';
import DoctorLoginScreen from './screens/Doctor_login';
import DoctorDashboardScreen from './screens/DoctorDashboardScreen'; 
import CreateAppointmentScreen from './screens/CreateAppointmentScreen'
import Editappscreen from './screens/editappointmentscreen';
import PatientDashboardScreen from './screens/PatientDashboard'
import ChatScreen from './screens/ChatScreen';
import RegisterScreen from './screens/registry';
import SettingsScreen from './screens/SettingsScreen';
import { Platform } from 'react-native';
import PatientViewScreen from './screens/PatientViewScreen'; 
//import PatientOptions from './screens/PatientOptionsScreen'; 



import { AuthContext } from './AuthContext'; 
//import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native';
import PatientDetailScreen from './screens/PatientDetailScreen';
import { useNavigation } from '@react-navigation/native';
import PatientOptionsScreen from './screens/PatientOptionsScreen';
import PatientReports from './screens/PatientReportScreen';
import FullReportDetail from './screens/FullReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { height, width } = Dimensions.get('window');
const baseFontSize = Math.min(width, height) * 0.05;


function SettingsButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
      <FontAwesome name="cog" size={32} color="#ffffff" />
    </TouchableOpacity>
  );
}

//common stack
function CommonStack({ component, title ,isLoggedIn}) {
  //const { isLoggedIn } = useContext(AuthContext); 
  console.log('navigation - isLoggedIn:', isLoggedIn);
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={title}
        component={component}
        options={{
          headerTitle: () => (
            //<SafeAreaView>
              <Image
                source={require('./assets/final_cleaned_icon.png')}
                //style={styles.floatingImage}
                style={{ width: Math.min(baseFontSize * 2.8), height: Math.min(baseFontSize * 2.65), resizeMode: 'contain', marginTop: Platform.OS === 'ios' ? -6 : 0 ,zIndex: 999}}
                
              />
            //</SafeAreaView>
          ),
          headerBackground: () => (
            <Image
              source={require('./assets/background.jpg')}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          ),
          headerStyle: {
            height: height * 0.13,
            borderBottomWidth: 2,
            borderBottomColor: '#000',
          },
          headerTintColor: '#f5f5dc',
          headerTitleAlign: 'center',
          //headerRight: isLoggedIn ? () => <LogoutButton /> : null, 
          //headerRight: () => <SettingsButton />,
          headerRight: isLoggedIn ? () => <SettingsButton /> : null,
        }}
      />


      {title === 'Home' && (
        <>
          <Stack.Screen
            name="DoctorLogin"
            component={DoctorLoginScreen}
            options={{
              headerTitle: () => (
                <Image
                  source={require('./assets/final_cleaned_icon.png')}
                  //style={{ width: Math.min(baseFontSize * 3), height: Math.min(baseFontSize * 3), resizeMode: 'contain', marginTop: -13 }}
                  style={{ width: Math.min(baseFontSize * 2.8), height: Math.min(baseFontSize * 2.65), resizeMode: 'contain', marginTop: Platform.OS === 'ios' ? -6 : 0 ,zIndex: 999}}
                />
              ),
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="PatientLogin"
            component={PatientLoginScreen}
            options={{
              headerTitle: () => (
                <Image
                  source={require('./assets/final_cleaned_icon.png')}
                  style={{ width: Math.min(baseFontSize * 2.8), height: Math.min(baseFontSize * 2.65), resizeMode: 'contain', marginTop: Platform.OS === 'ios' ? -6 : 0 ,zIndex: 999}}
                  //style={{ width: Math.min(baseFontSize * 3), height: Math.min(baseFontSize * 3), resizeMode: 'contain', marginTop: -13 }}
                />
              ),
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="PatientDashboard"
            component={PatientDashboardScreen}
            options={{
              headerTitle: 'Patient Dashboard',
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
              headerRight: isLoggedIn ? () => <SettingsButton /> : null,
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              headerTitle: () => (
                <Image
                  source={require('./assets/final_cleaned_icon.png')}
                  //style={{ width: Math.min(baseFontSize * 3), height: Math.min(baseFontSize * 3), resizeMode: 'contain', marginTop: -13 }}
                  style={{ width: Math.min(baseFontSize * 2.8), height: Math.min(baseFontSize * 2.65), resizeMode: 'contain', marginTop: Platform.OS === 'ios' ? -6 : 0 ,zIndex: 999}}
                />
              ),
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DoctorDashboardScreen}
            options={{
              headerTitle: 'Dashboard',
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="EditAppointment"
            component={Editappscreen}
            options={{
              headerTitle: 'Edit Appointment',
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
            }}
          />
          <Stack.Screen
            name="CreateAppointment"
            component={CreateAppointmentScreen}
            options={{
              headerTitle: 'Create Appointment',
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
            }}
          />
        </>
      )}


      {title === 'Messages' && (
        <>
          <Stack.Screen
            name="ChatScreen"
            component={ChatScreen} 
            options={({ route }) => ({
              title: `Chat with ${route.params.name}`, 
              headerBackground: () => (
                <Image
                  source={require('./assets/background.jpg')}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                  }}
                />
              ),
              headerStyle: {
                height: height * 0.13,
                borderBottomWidth: 2,
                borderBottomColor: '#000',
              },
              headerTintColor: '#f5f5dc',
              headerTitleAlign: 'center',
            })}
          />
        </>
      )}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
          headerBackground: () => (
            <Image
              source={require('./assets/background.jpg')}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          ),
          headerStyle: {
            height: height * 0.13,
            borderBottomWidth: 2,
            borderBottomColor: '#000',
          },
          headerTintColor: '#f5f5dc',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
}


//top bar
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <ImageBackground
      source={require('./assets/background.jpg')}
      style={styles.tabBarBackground}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabButton}
            >
              <View style={styles.iconAndLabel}>
                <FontAwesome
                  name={options.iconName}
                  size={24}
                  color={isFocused ? '#f5f5dc' : '#a9a9a9'}
                />
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>{label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ImageBackground>
  );
}

//bottom tabs
export default function Navigation() {
  const { isLoggedIn,user  } = useContext(AuthContext); //retrieves loggedin state

  return (
    
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarStyle: {
            keyboardHidesTabBar: true,//should fix bottom tab on android
            backgroundColor: 'transparent',
            height: height * 0.1,
          },
          tabBarActiveTintColor: '#f5f5dc',
          tabBarInactiveTintColor: '#a9a9a9',
          headerShown: false, 
        }}
      >
        {/* dynamic home tab */}
        <Tab.Screen
          name="Home_"
          options={{
            tabBarLabel: 'Home',
            iconName: 'home',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="home" color={color} size={size} />
            ),
          }}
          children={() =>
            <CommonStack
              //component={isLoggedIn ? PatientDashboardScreen : IndexScreen} // switching screen dynamically
              component={
                isLoggedIn
                  ? user?.role === 1
                    ? DoctorDashboardScreen
                    : PatientDashboardScreen
                  : IndexScreen
              }             
              isLoggedIn={isLoggedIn}//passes state to common stack 
              title="Home"
            />
          }
        />
        {/* tabs rendered post login*/}
        {isLoggedIn && (
          <>
            <Tab.Screen  
              name="HealthMetrics_"
              options={{
                tabBarLabel: 'Health',
                iconName: 'heartbeat',
                tabBarIcon: ({ color, size }) => (
                  <FontAwesome name="heartbeat" color={color} size={size} />
                ),
              }}
              children={() => {
                const { user } = useContext(AuthContext); 
                const isDoctor = user?.role === 1;

                if (!isDoctor) {
                  return (
                    <CommonStack
                      component={UserGuideScreen}
                      title="Health Metrics"
                      isLoggedIn={true}
                    />
                  );
                }

                return (
                  <Stack.Navigator>
                    <Stack.Screen
                      name="PatientDetailScreen"
                      component={PatientDetailScreen}
                      options={{
                        headerTitle: () => (
                          <Image
                            source={require('./assets/final_cleaned_icon.png')}
                            style={{
                              width: Math.min(baseFontSize * 2.8),
                              height: Math.min(baseFontSize * 2.65),
                              resizeMode: 'contain',
                              marginTop: Platform.OS === 'ios' ? -6 : 0,
                              zIndex: 999,
                            }}
                          />
                        ),
                        headerBackground: () => (
                          <Image
                            source={require('./assets/background.jpg')}
                            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                          />
                        ),
                        headerStyle: {
                          height: height * 0.13,
                          borderBottomWidth: 2,
                          borderBottomColor: '#000',
                        },
                        headerTintColor: '#f5f5dc',
                        headerTitleAlign: 'center',
                        headerRight: () => <SettingsButton />,
                      }}
                    />

                    <Stack.Screen
                      name="PatientViewScreen"
                      component={PatientViewScreen}
                      options={({ route }) => ({
                        title: `${route.params.patientName}'s Files`,
                        animation: 'slide_from_right',
                        headerBackground: () => (
                          <Image
                            source={require('./assets/background.jpg')}
                            style={{
                              width: '100%',
                              height: '100%',
                              resizeMode: 'cover',
                            }}
                          />
                        ),
                        headerStyle: {
                          height: height * 0.13,
                          borderBottomWidth: 2,
                          borderBottomColor: '#000',
                        },
                        headerTintColor: '#f5f5dc',
                        headerTitleAlign: 'center',
                      })}
                    />
                    <Stack.Screen
                      name="PatientOptions"
                      component={PatientOptionsScreen}
                      options={({ route }) => ({
                        //title: `${route.params.patientName}'s Files`,
                        animation: 'slide_from_right',
                        headerBackground: () => (
                          <Image
                            source={require('./assets/background.jpg')}
                            style={{
                              width: '100%',
                              height: '100%',
                              resizeMode: 'cover',
                            }}
                          />
                        ),
                        headerStyle: {
                          height: height * 0.13,
                          borderBottomWidth: 2,
                          borderBottomColor: '#000',
                        },
                        headerTintColor: '#f5f5dc',
                        headerTitleAlign: 'center',
                      })}
                    />
                    <Stack.Screen
                      name="ReportScreen"
                      component={PatientReports}
                      options={({ route }) => ({
                        title: `${route.params.patientName}'s Report's`,
                        animation: 'slide_from_right',
                        headerBackground: () => (
                          <Image
                            source={require('./assets/background.jpg')}
                            style={{
                              width: '100%',
                              height: '100%',
                              resizeMode: 'cover',
                            }}
                          />
                        ),
                        headerStyle: {
                          height: height * 0.13,
                          borderBottomWidth: 2,
                          borderBottomColor: '#000',
                        },
                        headerTintColor: '#f5f5dc',
                        headerTitleAlign: 'center',
                      })}
                    />
                    <Stack.Screen
                      name="FullReport"
                      component={FullReportDetail}
                      options={({ route }) => ({
                        title: `${route.params.patientName}'s Full Report`,
                        animation: 'slide_from_right',
                        headerBackground: () => (
                          <Image
                            source={require('./assets/background.jpg')}
                            style={{
                              width: '100%',
                              height: '100%',
                              resizeMode: 'cover',
                            }}
                          />
                        ),
                        headerStyle: {
                          height: height * 0.13,
                          borderBottomWidth: 2,
                          borderBottomColor: '#000',
                        },
                        headerTintColor: '#f5f5dc',
                        headerTitleAlign: 'center',
                      })}
                    />
                  </Stack.Navigator>
                );
              }}
            />

            <Tab.Screen
              name="messages_"
              options={{
                tabBarLabel: 'Message',
                iconName: 'envelope',
                tabBarIcon: ({ color, size }) => (
                  <FontAwesome name="envelope" color={color} size={size} />
                ),
              }}
              children={() => <CommonStack component={ContactsScreen} title="Messages" isLoggedIn={isLoggedIn}/>}
            />
            <Tab.Screen
              name="Notifications_"
              options={{
                tabBarLabel: 'Alerts',
                iconName: 'bell',
                tabBarIcon: ({ color, size }) => (
                  <FontAwesome name="bell" color={color} size={size} />
                ),
              }}
              children={() => <CommonStack component={HelpScreen} title="Alerts" isLoggedIn={isLoggedIn}/>}
            /> 
          </>
        )}
      </Tab.Navigator>
    
  );
}


const styles = StyleSheet.create({
  tabBarBackground: {
    width: '100%',
    height: height * 0.1,
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAndLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: Math.min(baseFontSize * 1.5, 24),
    color: '#a9a9a9',
    fontWeight: 'bold',
    marginTop: 5,
  },
  tabLabelFocused: {
    color: '#f5f5dc',
  },
});
