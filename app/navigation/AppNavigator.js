import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import { Ionicons, MaterialCommunityIcons } from 'react-native-vector-icons';
import { colors } from '../../constants/theme';
import DummyScreen from '../screens/DummyScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AnalizScreen from '../screens/AnalizScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DuygularimScreen from '../screens/duygularımScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ email }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.gradientStart,
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          margin: 4,
          borderRadius: 12,
          height: 45,
        },
        tabBarLabel: ({ focused }) => (
          <Text style={{
            color: focused ? '#fff' : 'rgba(255,255,255,0.7)',
            fontWeight: focused ? 'bold' : 'normal',
            fontSize: 12,
            marginTop: 2,
            textAlign: 'center',
          }}>
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused }) => {
          let icon;
          const iconSize = 24;
          const iconColor = focused ? '#fff' : 'rgba(255,255,255,0.7)';

          if (route.name === 'Home') icon = <Ionicons name="home" size={iconSize} color={iconColor} />;
          if (route.name === 'Duygularım') icon = <Ionicons name="happy" size={iconSize} color={iconColor} />;
          if (route.name === 'Günlük') icon = <MaterialCommunityIcons name="notebook" size={iconSize} color={iconColor} />;
          if (route.name === 'Analiz') icon = <Ionicons name="bar-chart" size={iconSize} color={iconColor} />;
          if (route.name === 'Ayarlar') icon = <Ionicons name="settings" size={iconSize} color={iconColor} />;

          return (
            <View style={{
              backgroundColor: focused ? 'rgba(255,255,255,0.2)' : 'transparent',
              borderRadius: 12,
              padding: 8,
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
            }}>
              {icon}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeScreen {...props} email={email} />}
      </Tab.Screen>
      <Tab.Screen name="Duygularım" component={DuygularimScreen} />
      <Tab.Screen name="Günlük" component={DiaryScreen} />
      <Tab.Screen name="Analiz" component={AnalizScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
} 