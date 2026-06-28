
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking, Platform, Dimensions, StatusBar, Modal } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import GradientButton from '../components/ui/GradientButton';
import GlassCard from '../components/ui/GlassCard';
import { MapPin, Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const EventDetailsScreen = ({ route, navigation }) => {
    const { eventId, eventData } = route.params;
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(eventData || null);
    const [loading, setLoading] = useState(!eventData);
    const [isBooked, setIsBooked] = useState(false);
    const [myTicket, setMyTicket] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showRedirectModal, setShowRedirectModal] = useState(false);

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

    useEffect(() => {
        if (!event || !event.registrationDeadline) return;

        const updateTimer = () => {
            const diffMs = new Date(event.registrationDeadline) - new Date();
            setTimeLeft(diffMs > 0 ? diffMs : 0);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [event?.registrationDeadline]);

    const getDeadlineStatus = () => {
        if (!event?.registrationDeadline) return null;
        if (timeLeft === null) return null;
        
        if (timeLeft <= 0) {
            return { status: 'closed', text: 'Registrations Closed 🚫', color: COLORS.error, countdown: null };
        }
        
        const diffSeconds = Math.floor(timeLeft / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays >= 2) {
            return { 
                status: 'open', 
                text: `Registrations close in ${diffDays} days ⏳`, 
                color: COLORS.primary,
                countdown: null
            };
        } else {
            const displayHours = diffHours.toString().padStart(2, '0');
            const displayMins = (diffMinutes % 60).toString().padStart(2, '0');
            const displaySecs = (diffSeconds % 60).toString().padStart(2, '0');
            const displayDaysStr = diffDays > 0 ? `${diffDays}d : ` : '';
            return { 
                status: 'urgent', 
                text: `Closing Soon! Closes in ${displayDaysStr}${displayHours % 24}h : ${displayMins}m : ${displaySecs}s ⏳`, 
                color: COLORS.warning,
                countdown: `${displayDaysStr}${displayHours % 24}h : ${displayMins}m : ${displaySecs}s`
            };
        }
    };

    const deadlineInfo = getDeadlineStatus();
    const isClosed = deadlineInfo && deadlineInfo.status === 'closed';

    const handleBook = () => {
        if (isClosed) {
            Alert.alert('Notice', 'Registrations for this event have closed.');
            return;
        }
        if (event.isExternalTicket) {
            setShowRedirectModal(true);
            return;
        }
        if (!user) return navigation.navigate('Login');
        if (event.host._id === user._id) return Alert.alert('Notice', 'You are the host.');
        navigation.navigate('Payment', { event });
    };

    const confirmExternalRedirect = () => {
        setShowRedirectModal(false);
        let url = event.externalTicketUrl;
        if (url) {
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            Linking.openURL(url).catch(err => Alert.alert('Error', 'Invalid link or cannot open URL'));
        } else {
            Alert.alert('Error', 'No external link provided for tickets');
        }
    };

    const showTicket = () => {
        navigation.navigate('Ticket', { ticket: myTicket, event: event });
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
    
    const getEmbedUrl = (url) => {
        if (!url) return null;
        const cleanUrl = url.trim();
        
        // Robust YouTube Parser (matches watch, shorts, embed, short-links, and ignores tracking queries)
        const ytRegExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
        const ytMatch = cleanUrl.match(ytRegExp);
        if (ytMatch && ytMatch[1]) {
            return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?origin=https://www.youtube-nocookie.com`;
        }
        
        // Robust Vimeo Parser
        const vimeoRegExp = /(?:vimeo\.com\/)(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/;
        const vimeoMatch = cleanUrl.match(vimeoRegExp);
        const vimeoId = vimeoMatch ? (vimeoMatch[3] || vimeoMatch[0].match(/\d+/)?.[0]) : null;
        if (vimeoId) {
            return `https://player.vimeo.com/video/${vimeoId}`;
        }
        return null;
    };

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
                        {deadlineInfo && (
                            <GlassCard
                                style={[
                                    styles.deadlineCard,
                                    { borderColor: deadlineInfo.color, marginBottom: 15 }
                                ]}
                                contentContainerStyle={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                            >
                                <Clock size={16} color={deadlineInfo.color} />
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>
                                    {deadlineInfo.text}
                                </Text>
                            </GlassCard>
                        )}

                        <View style={styles.tagRow}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{event.ticketType === 'Free' ? 'FREE' : `₹${event.price}`}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: COLORS.secondary }]}>
                                <Text style={[styles.badgeText, { color: '#000' }]}>{event.category}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: COLORS.tertiary }]}>
                                <Text style={[styles.badgeText, { color: '#fff' }]}>{event.targetAgeGroup || 'All Ages'}</Text>
                            </View>
                        </View>

                        <Text style={styles.title}>{event.name}</Text>

                        <GlassCard style={styles.hostCard}>
                            <View style={styles.hostRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{event.host?.name?.[0] || '?'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.hostLabel}>Hosted by</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <Text style={styles.hostName}>{event.host?.name || 'Unknown'}</Text>
                                        {event.host?.userType === 'organization' && (
                                            <View style={styles.verifiedBadge}>
                                                <Ionicons name="checkmark-circle" size={12} color="#000" style={{ marginRight: 3 }} />
                                                <Text style={styles.verifiedText}>VERIFIED ORG</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </GlassCard>

                        {/* Visual Event Timeline */}
                        {event.registrationDeadline && (
                            <GlassCard style={styles.timelineCard}>
                                <Text style={styles.timelineTitle}>Registration & Event Schedule</Text>
                                
                                <View style={styles.timelineRow}>
                                    <View style={styles.timelineIconContainer}>
                                        <View style={[styles.timelineNode, { backgroundColor: isClosed ? COLORS.error : COLORS.primary }]} />
                                        <View style={styles.timelineLine} />
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineStepTitle}>Registration Deadline</Text>
                                        <Text style={styles.timelineStepDate}>
                                            {new Date(event.registrationDeadline).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {new Date(event.registrationDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <Text style={[styles.timelineStepStatus, { color: isClosed ? COLORS.error : COLORS.success }]}>
                                            {isClosed ? 'Registrations Closed' : deadlineInfo?.countdown ? `Closes in ${deadlineInfo.countdown}` : 'Open (Booking Available)'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.timelineRow, { marginBottom: 0 }]}>
                                    <View style={styles.timelineIconContainer}>
                                        <View style={[styles.timelineNode, { backgroundColor: COLORS.secondary }]} />
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineStepTitle}>Event Starts</Text>
                                        <Text style={styles.timelineStepDate}>
                                            {new Date(event.startDate || event.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {new Date(event.startDate || event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>
                                            Actual event occurs on this date
                                        </Text>
                                    </View>
                                </View>
                            </GlassCard>
                        )}

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

                        {event.videoUrl && getEmbedUrl(event.videoUrl) && (
                            <View style={{ marginBottom: 25 }}>
                                <Text style={styles.sectionTitle}>Event Video Preview</Text>
                                <View style={{ borderRadius: 16, overflow: 'hidden', height: 200, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 10, backgroundColor: '#000' }}>
                                    <WebView
                                        source={{ 
                                            uri: getEmbedUrl(event.videoUrl),
                                            headers: {
                                                Referer: 'https://www.youtube-nocookie.com'
                                            }
                                        }}
                                        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
                                        style={{ flex: 1, backgroundColor: '#000' }}
                                        allowsFullScreenVideo={true}
                                        javaScriptEnabled={true}
                                        domStorageEnabled={true}
                                    />
                                </View>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>About this Event</Text>
                        <Text style={styles.desc}>{event.description}</Text>

                    </Animated.View>
                </View>
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            <BlurView intensity={80} tint="dark" style={styles.actionBar}>
                <View style={styles.priceBlock}>
                    <Text style={styles.priceLabel}>{event.isExternalTicket ? 'Ticket Source' : 'Total Price'}</Text>
                    <Text style={styles.priceValue}>{event.isExternalTicket ? 'External' : event.ticketType === 'Free' ? 'Free' : `₹${event.price}`}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 20 }}>
                    {user && user._id === event.host._id && !event.isExternalTicket ? (
                        <GradientButton
                            text="Manage Event"
                            colors={[COLORS.error, '#ff4444']}
                            onPress={() => navigation.navigate('ManageEvent', { event })}
                        />
                    ) : isClosed ? (
                        <GradientButton
                            text="Registrations Closed"
                            colors={['#333', '#444']}
                            disabled={true}
                            onPress={() => {}}
                        />
                    ) : isBooked && !event.isExternalTicket ? (
                        <GradientButton
                            text="View Ticket"
                            colors={[COLORS.success, '#00b894']}
                            onPress={showTicket}
                        />
                    ) : (
                        <GradientButton
                            text={event.isExternalTicket ? "Book on Website" : event.inventory > 0 ? "Book Now" : "Sold Out"}
                            colors={event.isExternalTicket || event.inventory > 0 ? COLORS.gradientPrimary : ['#555', '#777']}
                            onPress={handleBook}
                            isLoading={actionLoading}
                            disabled={!event.isExternalTicket && event.inventory <= 0}
                        />
                    )}
                </View>
            </BlurView>

            {/* External Redirect Modal */}
            <Modal visible={showRedirectModal} transparent animationType="fade">
                <BlurView intensity={90} tint="dark" style={styles.modalBackdrop}>
                    <GlassCard style={styles.redirectModalCard}>
                        <Text style={styles.redirectTitle}>Leaving EventHive 🌐</Text>
                        <Text style={styles.redirectMessage}>
                            You are being redirected to register for this event on the official host website:
                        </Text>
                        
                        <View style={styles.urlBox}>
                            <Text style={styles.urlText} numberOfLines={2}>
                                {event.externalTicketUrl || 'External Website'}
                            </Text>
                        </View>
                        
                        {event.registrationDeadline && (
                            <View style={styles.redirectWarningBox}>
                                <Clock size={16} color={COLORS.warning} style={{ marginTop: 2 }} />
                                <Text style={styles.redirectWarningText}>
                                    Make sure to complete your registration before registrations close on:{'\n'}
                                    <Text style={{ fontWeight: 'bold' }}>
                                        {new Date(event.registrationDeadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(event.registrationDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </Text>
                            </View>
                        )}
                        
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: '#333' }]} 
                                onPress={() => setShowRedirectModal(false)}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} 
                                onPress={confirmExternalRedirect}
                            >
                                <Text style={{ color: '#000', fontWeight: 'bold' }}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </BlurView>
            </Modal>
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
    priceValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    verifiedText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5
    },
    timelineCard: {
        padding: 16,
        marginBottom: 25,
        borderRadius: 12,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    timelineRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    timelineIconContainer: {
        alignItems: 'center',
        marginRight: 15,
        width: 16,
    },
    timelineNode: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 4,
        minHeight: 25,
    },
    timelineContent: {
        flex: 1,
    },
    timelineStepTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    timelineStepDate: {
        fontSize: 13,
        color: COLORS.text,
        marginTop: 2,
    },
    timelineStepStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    redirectModalCard: {
        width: '85%',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    redirectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    redirectMessage: {
        fontSize: 14,
        color: COLORS.textDim,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 15,
    },
    urlBox: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 15,
    },
    urlText: {
        color: COLORS.primary,
        fontSize: 13,
        textAlign: 'center',
    },
    redirectWarningBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,165,0,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,165,0,0.2)',
        padding: 12,
        borderRadius: 10,
        gap: 8,
        width: '100%',
        marginBottom: 20,
    },
    redirectWarningText: {
        color: COLORS.text,
        fontSize: 12,
        flex: 1,
        lineHeight: 16,
    },
    modalBtnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 15,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
    }
});

export default EventDetailsScreen;
