import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import CustomTabBar from '../components/CustomTabBar'; // Import CustomTabBar


// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PaymentScreen from '../screens/PaymentScreen';
import BookingSuccessScreen from '../screens/BookingSuccessScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import { COLORS } from '../constants/theme';
import ProfileScreen from '../screens/ProfileScreen'; // Optional

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => (
    <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: 'bold' }
    }}>
        <Stack.Screen name="OneEvent" component={HomeScreen} options={{ title: 'EventHive', headerShown: false }} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details' }} />
        <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
        <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
);

const ProfileStack = () => (
    <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: 'bold' }
    }}>
        <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ title: 'My Events' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const myTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: COLORS.background,
        },
    };

    const getTabBarVisibility = (route) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? 'OneEvent';
        if (routeName === 'EventDetails') {
            return 'none';
        }
        return 'flex';
    };

    return (
        <NavigationContainer theme={myTheme}>
            {user ? (
                <Tab.Navigator
                    tabBar={props => <CustomTabBar {...props} />}
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: {
                            backgroundColor: 'transparent',
                            elevation: 0,
                            borderTopWidth: 0,
                            position: 'absolute'
                        }
                    }}
                >
                    <Tab.Screen
                        name="HomeTab"
                        component={HomeStack}
                        options={({ route }) => ({
                            title: 'Discover',
                            tabBarStyle: { display: getTabBarVisibility(route) }
                        })}
                    />
                    <Tab.Screen
                        name="Host"
                        component={CreateEventScreen}
                        options={{
                            title: 'Host Event',
                            tabBarStyle: { display: 'none' }
                        }}
                    />
                    <Tab.Screen name="Profile" component={ProfileStack} />
                </Tab.Navigator>
            ) : (
                <Stack.Navigator screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background }
                }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
};

export default AppNavigator;
