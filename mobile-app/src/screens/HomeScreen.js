
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, RefreshControl, Modal, SafeAreaView, Platform, StatusBar, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/ui/GlassCard';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const MOCK_EVENTS = [
    { _id: '1', name: 'Neon Nights Party', date: new Date().toISOString(), price: 500, poster: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=500&q=80', description: 'Experience the flow.', location: { address: 'Cyber Hub, DLF' }, inventory: 100, ticketType: 'Paid', host: { name: 'Vibe Check' }, category: 'Music' },
    { _id: '2', name: 'Tech Prism 2026', date: new Date().toISOString(), price: 0, poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80', description: 'Future is now.', location: { address: 'Virtual' }, inventory: 500, ticketType: 'Free', host: { name: 'DeepMind' }, category: 'Tech' },
    { _id: '3', name: 'Zen Garden Workshop', date: new Date(Date.now() + 86400000).toISOString(), price: 1500, poster: 'https://images.unsplash.com/photo-1598556776374-2c28d2d689b6?w=500&q=80', description: 'Find your peace.', location: { address: 'Lodi Gardens' }, inventory: 20, ticketType: 'Paid', host: { name: 'Mindful Inc' }, category: 'Wellness' }
];

const CITIES = ['All Cities', 'New Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Virtual'];

const HomeScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [city, setCity] = useState('All Cities');
    const [showCityModal, setShowCityModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events');
            if (res.data.length > 0) {
                setEvents(res.data);
            } else {
                setEvents(MOCK_EVENTS);
            }
        } catch (err) {
            console.log('Using Mock Data for Home');
            setEvents(MOCK_EVENTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = events;
        if (city !== 'All Cities') {
            result = result.filter(e => e.location.address.toLowerCase().includes(city.toLowerCase()));
        }
        if (searchQuery) {
            result = result.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredEvents(result);
    }, [city, searchQuery, events]);

    const FeaturedCard = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EventDetails', { eventId: item._id, eventData: item })}
        >
            <Animated.View entering={FadeInRight.duration(600).springify()} style={styles.featuredCard}>
                <Image source={{ uri: item.poster || 'https://via.placeholder.com/300' }} style={styles.featuredImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.featuredOverlay}
                >

                    <Text style={styles.featuredTitle}>{item.name}</Text>
                    <Text style={styles.featuredDate}>{new Date(item.startDate || item.date).toDateString()} • {item.location.address}</Text>
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );

    const EventItem = ({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('EventDetails', { eventId: item._id, eventData: item })}
            >
                <GlassCard style={styles.eventCard}>
                    <View style={styles.eventRow}>
                        <Image source={{ uri: item.poster || 'https://via.placeholder.com/150' }} style={styles.thumb} />
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.eventMeta} numberOfLines={1}>📅 {new Date(item.startDate || item.date).toLocaleDateString()}</Text>
                            <Text style={styles.eventMeta} numberOfLines={1}>📍 {item.location.address}</Text>

                            <View style={styles.priceTag}>
                                <Text style={styles.priceText}>
                                    {item.ticketType === 'Free' ? 'Free' : `₹${item.price}`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050511', '#0a0a2a', '#001a1a']}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Ambient Background Glows */}
            <View style={[styles.glow, { top: -100, right: -100, backgroundColor: COLORS.secondary }]} />
            <View style={[styles.glow, { top: 300, left: -200, backgroundColor: COLORS.tertiary }]} />

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Explorer'} 👋</Text>
                        <Text style={styles.subGreeting}>Ready for your next adventure?</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                        {/* TODO: Avatar */}
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Search & Location Bar */}
                <View style={styles.searchBarContainer}>
                    <GlassCard
                        style={styles.searchBar}
                        contentContainerStyle={{
                            padding: 0,
                            paddingHorizontal: 15,
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            height: '100%'
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="search" size={20} color={COLORS.textDim} style={{ marginRight: 10 }} />
                            <TextInput
                                placeholder="Search events..."
                                placeholderTextColor={COLORS.textDim}
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderVerticalAlign="center" // Android fix
                            />
                        </View>
                        <TouchableOpacity onPress={() => setShowCityModal(true)} style={styles.locBtn}>
                            <Ionicons name="location" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </GlassCard>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchEvents} tintColor={COLORS.primary} />
                    }
                >
                    {/* Featured Carousel */}
                    {!searchQuery && (
                        <View>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Featured</Text>

                            </View>
                            <FlatList
                                horizontal
                                data={filteredEvents.slice(0, 5)}
                                renderItem={({ item }) => <FeaturedCard item={item} />}
                                keyExtractor={item => item._id}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingLeft: SIZES.padding }}
                                snapToInterval={width * 0.7 + 20}
                                decelerationRate="fast"
                            />
                        </View>
                    )}

                    {/* All Events List */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{searchQuery ? 'Search Results' : 'Upcoming Events'}</Text>
                        <View style={styles.filterPill}>
                            <Text style={styles.filterText}>{city}</Text>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: SIZES.padding }}>
                        {filteredEvents.map((item, index) => (
                            <EventItem key={item._id} item={item} index={index} />
                        ))}
                        {filteredEvents.length === 0 && (
                            <Text style={{ color: COLORS.textDim, textAlign: 'center', marginTop: 20 }}>
                                No vibes found here. Try another city?
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* City Modal */}
            <Modal visible={showCityModal} transparent animationType="fade">
                <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCityModal(false)} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Location</Text>
                        {CITIES.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.cityItem, city === c && styles.citySelected]}
                                onPress={() => { setCity(c); setShowCityModal(false); }}
                            >
                                <Text style={[styles.cityText, city === c && { color: COLORS.background }]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    glow: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        marginBottom: 20,
    },
    greeting: { ...FONTS.h2, color: COLORS.text },
    subGreeting: { ...FONTS.body3, color: COLORS.textDim },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary
    },
    avatarText: { ...FONTS.h3, color: COLORS.primary },

    searchBarContainer: { paddingHorizontal: SIZES.padding, marginBottom: 20 },
    searchBar: {
        borderRadius: 12,
        height: 50,
        justifyContent: 'center'
    },
    searchInput: { flex: 1, color: COLORS.text, ...FONTS.body2 },
    locBtn: { padding: 5, backgroundColor: 'rgba(0,240,255,0.1)', borderRadius: 8 },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        marginBottom: 15,
        marginTop: 10,
    },
    sectionTitle: { ...FONTS.h3, color: COLORS.text, fontWeight: 'bold' },
    sectionLink: { color: COLORS.secondary, ...FONTS.body3 },
    filterPill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    filterText: { color: COLORS.textDim, fontSize: 12 },

    featuredCard: {
        width: width * 0.7,
        height: 300,
        marginRight: 20,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
    },
    featuredImage: { width: '100%', height: '100%' },
    featuredOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        justifyContent: 'flex-end',
        padding: 15,
    },
    featuredBadge: {
        backgroundColor: COLORS.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    featuredBadgeText: { color: '#000', fontWeight: 'bold', fontSize: 10 },
    featuredTitle: { ...FONTS.h2, color: '#FFF', marginBottom: 4 },
    featuredDate: { ...FONTS.body3, color: 'rgba(255,255,255,0.8)' },

    eventCard: {
        marginBottom: 15,
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 100 // Enforce typical height
    },
    eventRow: { flexDirection: 'row', alignItems: 'center' },
    thumb: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#333' },
    eventInfo: { flex: 1, marginLeft: 15 },
    eventTitle: { ...FONTS.h3, color: COLORS.text, marginBottom: 4 },
    eventMeta: { ...FONTS.body3, color: COLORS.textDim, marginBottom: 2 },
    priceTag: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    priceText: { color: COLORS.success, fontWeight: 'bold', fontSize: 12 },

    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        paddingBottom: 50,
        borderTopWidth: 1,
        borderTopColor: COLORS.surfaceLight
    },
    modalTitle: { ...FONTS.h2, color: COLORS.text, textAlign: 'center', marginBottom: 20 },
    cityItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    citySelected: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 10, borderBottomWidth: 0 },
    cityText: { ...FONTS.body1, color: COLORS.textDim }
});

export default HomeScreen;
