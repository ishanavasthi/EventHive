
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking, Platform, Dimensions, StatusBar } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import GradientButton from '../components/ui/GradientButton';
import GlassCard from '../components/ui/GlassCard';
import { MapPin, Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const EventDetailsScreen = ({ route, navigation }) => {
    const { eventId, eventData } = route.params;
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(eventData || null);
    const [loading, setLoading] = useState(!eventData);
    const [isBooked, setIsBooked] = useState(false);
    const [myTicket, setMyTicket] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${eventId}`);
                setEvent(res.data);
            } catch (err) {
                if (!eventData) Alert.alert('Error', 'Failed to load event details');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();

        const checkBookingStatus = async () => {
            if (!user) return;
            try {
                const res = await api.get('/bookings/my-bookings');
                const booking = res.data.find(b => b.event._id === eventId);
                if (booking) {
                    setIsBooked(true);
                    setMyTicket(booking);
                }
            } catch (err) {
                console.log('Failed to check booking status');
            }
        };
        checkBookingStatus();
    }, [eventId, user]);

    const handleBook = () => {
        if (!user) return navigation.navigate('Login');
        if (event.host._id === user._id) return Alert.alert('Notice', 'You are the host.');
        navigation.navigate('Payment', { event });
    };

    const showTicket = () => {
        Alert.alert(
            "Your Ticket",
            `Ticket Code: ${myTicket.ticketCode}\nStatus: ${myTicket.status}`,
            [{ text: "OK" }]
        );
    };

    const openMaps = () => {
        const { lat, lng, address } = event.location;
        const query = lat && lng ? `${lat},${lng}` : address;
        const url = Platform.select({ ios: `maps:0,0?q=${query}`, android: `geo:0,0?q=${query}` });
        Linking.openURL(url);
    };

    if (loading) return (
        <View style={styles.center}>
            <LinearGradient colors={['#000', '#111']} style={StyleSheet.absoluteFill} />
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );

    if (!event) return (
        <View style={styles.center}>
            <Text style={{ color: COLORS.text }}>Event not found</Text>
        </View>
    );

    // Helpers
    const formatDate = (isoString) => new Date(isoString).toDateString();
    const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050511', '#0a0a2a']}
                style={StyleSheet.absoluteFillObject}
            />

            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: event.poster || 'https://via.placeholder.com/300' }} style={styles.poster} />
                    <LinearGradient
                        colors={['transparent', 'rgba(5,5,17,0.8)', '#050511']}
                        locations={[0, 0.7, 1]}
                        style={styles.imageOverlay}
                    />

                    {/* Header Actions */}
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <ArrowLeft size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Share2 size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Animated.View entering={FadeInDown.duration(600).springify()}>
                        <View style={styles.tagRow}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{event.ticketType === 'Free' ? 'FREE' : `₹${event.price}`}</Text>
                            </View>

                        </View>

                        <Text style={styles.title}>{event.name}</Text>

                        <GlassCard style={styles.hostCard}>
                            <View style={styles.hostRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{event.host?.name?.[0] || '?'}</Text>
                                </View>
                                <View>
                                    <Text style={styles.hostLabel}>Hosted by</Text>
                                    <Text style={styles.hostName}>{event.host?.name || 'Unknown'}</Text>
                                </View>
                            </View>
                        </GlassCard>

                        {/* Info Section */}
                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <View style={styles.iconBox}>
                                    <Calendar size={24} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.infoTitle}>{event.startDate ? formatDate(event.startDate) : formatDate(event.date)}</Text>
                                    <Text style={styles.infoSub}>{event.startDate ? `${formatTime(event.startDate)} - ${formatTime(event.endDate)}` : 'Time TBD'}</Text>
                                </View>
                            </View>

                            <View style={[styles.infoRow, { marginTop: 20 }]}>
                                <View style={styles.iconBox}>
                                    <MapPin size={24} color={COLORS.secondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.infoTitle}>{event.location.address}</Text>
                                    <TouchableOpacity onPress={openMaps}>
                                        <Text style={styles.linkText}>View on Map</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>About this Event</Text>
                        <Text style={styles.desc}>{event.description}</Text>

                    </Animated.View>
                </View>
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            <BlurView intensity={80} tint="dark" style={styles.actionBar}>
                <View style={styles.priceBlock}>
                    <Text style={styles.priceLabel}>Total Price</Text>
                    <Text style={styles.priceValue}>{event.ticketType === 'Free' ? 'Free' : `₹${event.price}`}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 20 }}>
                    {user && user._id === event.host._id ? (
                        <GradientButton
                            text="Manage Event"
                            colors={[COLORS.error, '#ff4444']}
                            onPress={() => Alert.alert('Manage', 'Host options coming soon.')}
                        />
                    ) : isBooked ? (
                        <GradientButton
                            text="View Ticket"
                            colors={[COLORS.success, '#00b894']}
                            onPress={showTicket}
                        />
                    ) : (
                        <GradientButton
                            text={event.inventory > 0 ? "Book Now" : "Sold Out"}
                            colors={event.inventory > 0 ? COLORS.gradientPrimary : ['#555', '#777']}
                            onPress={handleBook}
                            isLoading={actionLoading}
                            disabled={event.inventory <= 0}
                        />
                    )}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageContainer: { height: 350, width: '100%' },
    poster: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
    headerActions: {
        position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40,
        left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between'
    },
    iconBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
    },

    content: {
        paddingHorizontal: SIZES.padding,
        marginTop: -60, // Overlap image
        paddingBottom: 20
    },
    tagRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    badge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    badgeText: { color: '#000', fontWeight: 'bold', fontSize: 12 },

    title: { ...FONTS.h1, color: '#fff', fontSize: 32, lineHeight: 38, marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },

    hostCard: { padding: 12, marginBottom: 25, borderRadius: 12 },
    hostRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.tertiary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    hostLabel: { color: COLORS.textDim, fontSize: 12 },
    hostName: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },

    infoSection: { marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center', marginRight: 15
    },
    infoTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginBottom: 2 },
    infoSub: { color: COLORS.textDim, fontSize: 14 },
    linkText: { color: COLORS.primary, fontWeight: '600', marginTop: 4 },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 25 },
    sectionTitle: { ...FONTS.h2, color: COLORS.text, marginBottom: 10 },
    desc: { ...FONTS.body2, color: COLORS.textDim, lineHeight: 24 },

    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)'
    },
    priceBlock: { justifyContent: 'center' },
    priceLabel: { color: COLORS.textDim, fontSize: 12, marginBottom: 2 },
    priceValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' }
});

export default EventDetailsScreen;