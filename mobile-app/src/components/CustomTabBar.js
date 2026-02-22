
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { House, Plus, User } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const TabButton = ({ state, descriptors, navigation, route, index, Icon }) => {
    const isFocused = state.index === index;

    // Animation shared values
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    React.useEffect(() => {
        if (isFocused) {
            scale.value = withSpring(1.2);
            translateY.value = withSpring(-5);
        } else {
            scale.value = withSpring(1);
            translateY.value = withSpring(0);
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { translateY: translateY.value }
            ]
        };
    });

    const onPress = () => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.8}
        >
            <Animated.View style={[animatedStyle, isFocused && styles.activeTab]}>
                <Icon
                    size={24}
                    color={isFocused ? (route.name === 'Host' ? '#FFF' : COLORS.primary) : COLORS.textDim}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const focusedOptions = descriptors[state.routes[state.index].key].options;

    if (focusedOptions.tabBarStyle?.display === 'none') {
        return null;
    }

    return (
        <View style={styles.container}>
            <BlurView
                intensity={30}
                tint="dark"
                style={[styles.blurContainer, StyleSheet.absoluteFill]}
            />

            <View style={styles.tabsContainer}>
                {state.routes.map((route, index) => {
                    let Icon;
                    if (route.name === 'HomeTab') Icon = House;
                    else if (route.name === 'Host') Icon = Plus;
                    else if (route.name === 'Profile') Icon = User;

                    // Special styling for the middle "Host" button
                    const isHost = route.name === 'Host';

                    if (isHost) {
                        return (
                            <View key={route.key} style={styles.hostButtonContainer}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate(route.name)}
                                    style={styles.hostButton}
                                    activeOpacity={0.9}
                                >
                                    <Plus size={32} color="#000" />
                                </TouchableOpacity>
                            </View>
                        )
                    }

                    return (
                        <TabButton
                            key={route.key}
                            state={state}
                            descriptors={descriptors}
                            navigation={navigation}
                            route={route}
                            index={index}
                            Icon={Icon}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        height: 70,
        // Removed overflow: 'hidden' to allow button to float outside
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 20,
    },
    blurContainer: {
        borderRadius: 30,
        overflow: 'hidden', // Clips the blur effect to the rounded corners
        backgroundColor: 'rgba(15, 12, 41, 0.85)',
    },
    tabsContainer: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    activeTab: {
        // Optional active state styling
    },
    hostButtonContainer: {
        top: -20, // Lift it up more visible
        justifyContent: 'center',
        alignItems: 'center',
    },
    hostButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    }
});

export default CustomTabBar;
