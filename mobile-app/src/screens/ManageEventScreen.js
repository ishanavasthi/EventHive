import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users, QrCode, CheckCircle, XCircle } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../services/api';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import GlassCard from '../components/ui/GlassCard';

const { width } = Dimensions.get('window');

const ManageEventScreen = ({ route, navigation }) => {
    const { event } = route.params;
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'scanner'
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Scanner states
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processingCheckin, setProcessingCheckin] = useState(false);

    useEffect(() => {
        if (activeTab === 'list') {
            fetchGuests();
        }
    }, [activeTab]);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/events/${event._id}/guests`);
            setGuests(res.data);
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch guest list');
        } finally {
            setLoading(false);
        }
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        setScanned(true);
        setProcessingCheckin(true);

        try {
            const res = await api.post(`/events/${event._id}/checkin`, { ticketCode: data });
            Alert.alert('Success', `Checked in successfully!\n${res.data.booking.user?.name || 'Guest'}`, [
                { text: 'Scan Next', onPress: () => setScanned(false) }
            ]);
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to check in';
            Alert.alert('Error', errorMsg, [
                { text: 'Try Again', onPress: () => setScanned(false) }
            ]);
        } finally {
            setProcessingCheckin(false);
        }
    };

    const renderGuest = ({ item }) => (
        <GlassCard style={styles.guestCard}>
            <View style={styles.guestRow}>
                <View style={styles.guestAvatar}>
                    <Text style={styles.avatarText}>{item.user?.name?.[0] || '?'}</Text>
                </View>
                <View style={styles.guestInfo}>
                    <Text style={styles.guestName}>{item.user?.name || 'Unknown'}</Text>
                    <Text style={styles.ticketCode}>{item.ticketCode}</Text>
                </View>
                <View style={styles.statusBadge}>
                    {item.checkedIn ? (
                        <CheckCircle color={COLORS.success} size={24} />
                    ) : (
                        <XCircle color={COLORS.warning} size={24} />
                    )}
                </View>
            </View>
        </GlassCard>
    );

    const renderScanner = () => {
        if (!permission) {
            return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
        }
        if (!permission.granted) {
            return (
                <View style={styles.center}>
                    <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                    <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                        <Text style={styles.permissionBtnText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.scannerContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                
                {/* Overlay for Scanner */}
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerCutout} />
                    <Text style={styles.scannerText}>
                        {processingCheckin ? 'Checking in...' : 'Align QR code within frame to scan'}
                    </Text>
                </View>

                {processingCheckin && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050511', '#0a0a2a']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={styles.headerTitle} numberOfLines={1}>Manage: {event.name}</Text>
                        <Text style={styles.headerSub}>Host Dashboard</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'list' && styles.activeTab]}
                        onPress={() => setActiveTab('list')}
                    >
                        <Users size={20} color={activeTab === 'list' ? COLORS.primary : COLORS.textDim} />
                        <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>Guest List</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'scanner' && styles.activeTab]}
                        onPress={() => setActiveTab('scanner')}
                    >
                        <QrCode size={20} color={activeTab === 'scanner' ? COLORS.primary : COLORS.textDim} />
                        <Text style={[styles.tabText, activeTab === 'scanner' && styles.activeTabText]}>Scan QR</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'list' ? (
                        loading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
                        ) : guests.length === 0 ? (
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>No guests have booked yet.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={guests}
                                keyExtractor={(item) => item._id}
                                renderItem={renderGuest}
                                contentContainerStyle={{ paddingBottom: 50 }}
                            />
                        )
                    ) : (
                        renderScanner()
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingTop: 20,
        paddingBottom: 15,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: { ...FONTS.h3, color: '#fff' },
    headerSub: { ...FONTS.body3, color: COLORS.primary },
    
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginBottom: 15,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        marginHorizontal: 5,
        gap: 8,
    },
    activeTab: {
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.3)',
    },
    tabText: {
        color: COLORS.textDim,
        ...FONTS.body2,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.primary,
    },

    content: {
        flex: 1,
        paddingHorizontal: SIZES.padding,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: COLORS.textDim, ...FONTS.body1 },

    guestCard: {
        padding: 15,
        marginBottom: 15,
    },
    guestRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guestAvatar: {
        width: 46, height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.tertiary,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15,
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    guestInfo: { flex: 1 },
    guestName: { color: '#fff', ...FONTS.h3, marginBottom: 4, fontSize: 16 },
    ticketCode: { color: COLORS.textDim, ...FONTS.body3 },
    statusBadge: { marginLeft: 10 },

    scannerContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerCutout: {
        width: width * 0.7,
        height: width * 0.7,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
        borderRadius: 20,
    },
    scannerText: {
        color: '#fff',
        ...FONTS.body2,
        marginTop: 40,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 10,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionText: {
        color: '#fff',
        ...FONTS.body1,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    permissionBtnText: {
        color: '#000',
        fontWeight: 'bold',
        ...FONTS.body2,
    }
});

export default ManageEventScreen;
