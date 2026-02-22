
import React, { useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/ui/GlassCard';
import { RefreshControl } from 'react-native';

const { width } = Dimensions.get('window');

const MyEventsScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Attended'); // 'Attended' or 'Hosted'
    const [hostedEvents, setHostedEvents] = useState([]);
    const [attendedEvents, setAttendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyEvents = async () => {
        // Don't show full loader on refetch to keep it smooth, or use refresh control state
        if (hostedEvents.length === 0) setLoading(true);
        try {
            // 1. Fetch Hosted
            const hostedRes = await api.get('/events');
            const myHosted = hostedRes.data.filter(e => (e.host._id || e.host) === user._id);
            setHostedEvents(myHosted);

            // 2. Fetch Attended
            const bookingRes = await api.get('/bookings/my-bookings');
            const myAttended = bookingRes.data.map(b => ({
                ...b.event,
                bookingId: b._id,
                bookingStatus: b.status,
                ticketCode: b.ticketCode
            }));
            setAttendedEvents(myAttended);

        } catch (err) {
            console.log('Error fetching my events', err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyEvents();
        }, [])
    );

    const filterEvents = (events) => {
        const now = new Date();
        const upcoming = events.filter(e => new Date(e.startDate || e.date) >= now);
        const past = events.filter(e => new Date(e.startDate || e.date) < now);
        return { upcoming, past };
    };

    const EventCard = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EventDetails', { eventId: item._id, eventData: item })}
        >
            <GlassCard style={styles.card}>
                <Image source={{ uri: item.poster || 'https://via.placeholder.com/150' }} style={styles.poster} />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.date}>{new Date(item.startDate || item.date).toDateString()}</Text>

                    {activeTab === 'Attended' && (
                        <View style={[styles.statusBadge, { backgroundColor: item.bookingStatus === 'Confirmed' ? COLORS.success : COLORS.warning }]}>
                            <Text style={styles.statusText}>{item.bookingStatus}</Text>
                        </View>
                    )}
                </View>
            </GlassCard>
        </TouchableOpacity>
    );

    const renderSection = (title, data) => (
        <View style={{ marginBottom: 25 }}>
            <Text style={styles.sectionHeader}>{title} ({data.length})</Text>
            {data.length === 0 ? (
                <Text style={styles.emptyText}>No events.</Text>
            ) : (
                <FlatList
                    data={data}
                    renderItem={({ item }) => <EventCard item={item} />}
                    keyExtractor={item => item._id + (item.bookingId || '')}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: SIZES.padding }}
                />
            )}
        </View>
    );

    const { upcoming: hostedUpcoming, past: hostedPast } = filterEvents(hostedEvents);
    const { upcoming: attendedUpcoming, past: attendedPast } = filterEvents(attendedEvents);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050511', '#0a0a2a', '#001a1a']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'Attended' && styles.activeTab]} onPress={() => setActiveTab('Attended')}>
                    <Text style={[styles.tabText, activeTab === 'Attended' && styles.activeTabText]}>Going</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'Hosted' && styles.activeTab]} onPress={() => setActiveTab('Hosted')}>
                    <Text style={[styles.tabText, activeTab === 'Hosted' && styles.activeTabText]}>Hosting</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMyEvents} tintColor={COLORS.primary} />}
            >
                {activeTab === 'Hosted' ? (
                    <>
                        {renderSection('Upcoming', hostedUpcoming)}
                        {renderSection('Past History', hostedPast)}
                    </>
                ) : (
                    <>
                        {renderSection('Upcoming', attendedUpcoming)}
                        {renderSection('Past History', attendedPast)}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    tabContainer: { flexDirection: 'row', padding: 20, paddingTop: 60, paddingBottom: 10 },
    tab: { marginRight: 25, paddingBottom: 5 },
    activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
    tabText: { ...FONTS.h2, color: COLORS.textDim },
    activeTabText: { color: COLORS.text },

    sectionHeader: { ...FONTS.h3, marginLeft: SIZES.padding, marginBottom: 15, color: COLORS.text },
    emptyText: { marginLeft: SIZES.padding, color: COLORS.textDim, fontStyle: 'italic' },

    card: { width: 220, marginRight: 15, padding: 0, height: 260 },
    poster: { width: '100%', height: 160, borderRadius: 12 },
    info: { padding: 12 },
    title: { ...FONTS.h3, color: COLORS.text, marginBottom: 4 },
    date: { ...FONTS.body3, color: COLORS.textDim },
    statusBadge: {
        position: 'absolute', top: -150, right: 10,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
    },
    statusText: { color: '#000', fontSize: 10, fontWeight: 'bold' }
});

export default MyEventsScreen;
