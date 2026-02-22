
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/ui/GlassCard';
import { ChevronRight, LogOut, Ticket, User, CreditCard, Settings } from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
        ]);
    };

    const MenuItem = ({ icon: Icon, title, onPress, color = COLORS.text, showArrow = true }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: color === COLORS.error ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.05)' }]}>
                    <Icon size={20} color={color} />
                </View>
                <Text style={[styles.menuText, { color }]}>{title}</Text>
            </View>
            {showArrow && <ChevronRight size={20} color={COLORS.textDim} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050511', '#0a0a2a', '#001a1a']}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView contentContainerStyle={{ padding: SIZES.padding, paddingTop: 60 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        {user?.profilePicture ? (
                            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#000' }}>{user?.name?.[0] || 'U'}</Text>
                            </View>
                        )}
                        <View style={styles.verifiedBadge}>
                            <Text style={{ color: '#000', fontSize: 10 }}>✓</Text>
                        </View>
                    </View>
                    <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
                    <Text style={styles.email}>{user?.email || 'No email linked'}</Text>

                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
                        <Text style={styles.editBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu */}
                <GlassCard style={styles.menuContainer}>
                    <MenuItem
                        icon={Ticket}
                        title="My Events"
                        onPress={() => navigation.navigate('MyEvents')}
                    />
                    <View style={styles.divider} />

                    <MenuItem
                        icon={User}
                        title="Account Details"
                        onPress={() => navigation.navigate('EditProfile')}
                    />

                </GlassCard>

                <GlassCard style={[styles.menuContainer, { marginTop: 20 }]}>
                    <MenuItem
                        icon={LogOut}
                        title="Log Out"
                        color={COLORS.error}
                        onPress={handleLogout}
                        showArrow={false}
                    />
                </GlassCard>

                <Text style={styles.version}>Version 1.0.0 • EventHive</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: { marginBottom: 15 },
    avatar: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 3, borderColor: COLORS.secondary
    },
    verifiedBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: COLORS.secondary, width: 24, height: 24, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.background
    },
    name: { ...FONTS.h2, color: COLORS.text, marginBottom: 5 },
    email: { ...FONTS.body2, color: COLORS.textDim, marginBottom: 15 },
    editBtn: {
        paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.textDim
    },
    editBtnText: { color: COLORS.text, ...FONTS.body3 },

    menuContainer: { padding: 0, borderRadius: 16, overflow: 'hidden' },
    menuItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginRight: 15
    },
    menuText: { fontSize: 16, fontWeight: '500' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 67 },

    version: { textAlign: 'center', marginTop: 30, color: COLORS.textDim, fontSize: 12 }
});

export default ProfileScreen;
