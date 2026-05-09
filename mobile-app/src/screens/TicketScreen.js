import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, Calendar, Clock } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import GlassCard from '../components/ui/GlassCard';

const { width } = Dimensions.get('window');

const TicketScreen = ({ route, navigation }) => {
    const { ticket, event } = route.params;

    const formatDate = (isoString) => new Date(isoString).toDateString();
    const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                    <Text style={styles.headerTitle}>My Ticket</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.ticketContainer}>
                    <GlassCard style={styles.ticketCard}>
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventName}>{event.name}</Text>
                            
                            <View style={styles.infoRow}>
                                <Calendar size={16} color={COLORS.primary} />
                                <Text style={styles.infoText}>{event.startDate ? formatDate(event.startDate) : formatDate(event.date)}</Text>
                            </View>
                            
                            <View style={styles.infoRow}>
                                <Clock size={16} color={COLORS.primary} />
                                <Text style={styles.infoText}>{event.startDate ? `${formatTime(event.startDate)} - ${formatTime(event.endDate)}` : 'Time TBD'}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <MapPin size={16} color={COLORS.primary} />
                                <Text style={styles.infoText} numberOfLines={1}>{event.location?.address || 'Location TBD'}</Text>
                            </View>
                        </View>

                        <View style={styles.dashedLineContainer}>
                            <View style={styles.notchLeft} />
                            <View style={styles.dashedLine} />
                            <View style={styles.notchRight} />
                        </View>

                        <View style={styles.qrContainer}>
                            <View style={styles.qrWrapper}>
                                <QRCode
                                    value={ticket.ticketCode}
                                    size={width * 0.55}
                                    color="#000"
                                    backgroundColor="#fff"
                                />
                            </View>
                            <Text style={styles.ticketCodeText}>{ticket.ticketCode}</Text>
                            <Text style={styles.statusText}>Status: <Text style={{color: ticket.checkedIn ? COLORS.success : COLORS.warning}}>{ticket.checkedIn ? 'Checked In' : ticket.status}</Text></Text>
                            
                            {ticket.checkedIn && (
                                <View style={styles.checkedInBadge}>
                                    <Text style={styles.checkedInText}>SCANNED</Text>
                                </View>
                            )}
                        </View>
                    </GlassCard>
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
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingTop: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: { ...FONTS.h2, color: '#fff' },
    ticketContainer: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        paddingBottom: 40,
    },
    ticketCard: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: 20,
    },
    eventInfo: {
        padding: 25,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    eventName: {
        ...FONTS.h2,
        color: '#fff',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        ...FONTS.body2,
        color: COLORS.textDim,
        marginLeft: 10,
        flex: 1,
    },
    dashedLineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    notchLeft: {
        width: 20,
        height: 40,
        backgroundColor: COLORS.background,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        marginLeft: -1,
    },
    notchRight: {
        width: 20,
        height: 40,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        marginRight: -1,
    },
    dashedLine: {
        flex: 1,
        height: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    qrContainer: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    qrWrapper: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    ticketCodeText: {
        ...FONTS.h3,
        color: COLORS.text,
        letterSpacing: 2,
        marginBottom: 5,
    },
    statusText: {
        ...FONTS.body2,
        color: COLORS.textDim,
    },
    checkedInBadge: {
        position: 'absolute',
        top: '40%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.success,
        transform: [{ rotate: '-15deg' }],
    },
    checkedInText: {
        color: COLORS.success,
        fontWeight: 'bold',
        fontSize: 24,
        letterSpacing: 4,
    }
});

export default TicketScreen;
