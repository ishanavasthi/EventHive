
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, RefreshControl, Modal, SafeAreaView, Platform, StatusBar, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
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
const CATEGORIES = ['All Categories', 'Tech', 'Art', 'Sports', 'Cultural', 'Cooking', 'Meetup', 'Music', 'Workshop', 'Other'];
const DATE_OPTIONS = ['All Dates', 'Today', 'Tomorrow', 'This Week', 'This Month'];

const HomeScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const { unreadCount } = useContext(NotificationContext);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [city, setCity] = useState('All Cities');
    const [showCityModal, setShowCityModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedDateOption, setSelectedDateOption] = useState('All Dates');
    const [showDateModal, setShowDateModal] = useState(false);
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
        
        // Exclude ended events
        const now = new Date();
        result = result.filter(e => {
            const eventEnd = e.endDate ? new Date(e.endDate) : (e.startDate ? new Date(e.startDate) : new Date(e.date));
            return eventEnd >= now;
        });
        
        // City Filter
        if (city !== 'All Cities') {
            result = result.filter(e => e.location && e.location.address && e.location.address.toLowerCase().includes(city.toLowerCase()));
        }
        
        // Category Filter
        if (selectedCategory !== 'All Categories') {
            result = result.filter(e => e.category && e.category.toLowerCase() === selectedCategory.toLowerCase());
        }
        
        // Date Filter
        if (selectedDateOption !== 'All Dates') {
            const now = new Date();
            
            if (selectedDateOption === 'Today') {
                const todayStart = new Date();
                todayStart.setHours(0,0,0,0);
                const todayEnd = new Date();
                todayEnd.setHours(23,59,59,999);
                result = result.filter(e => {
                    const d = new Date(e.startDate || e.date);
                    return d >= todayStart && d <= todayEnd;
                });
            } else if (selectedDateOption === 'Tomorrow') {
                const tomorrowStart = new Date();
                tomorrowStart.setDate(tomorrowStart.getDate() + 1);
                tomorrowStart.setHours(0,0,0,0);
                const tomorrowEnd = new Date();
                tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
                tomorrowEnd.setHours(23,59,59,999);
                result = result.filter(e => {
                    const d = new Date(e.startDate || e.date);
                    return d >= tomorrowStart && d <= tomorrowEnd;
                });
            } else if (selectedDateOption === 'This Week') {
                const weekEnd = new Date();
                weekEnd.setDate(weekEnd.getDate() + 7);
                weekEnd.setHours(23,59,59,999);
                const todayStart = new Date();
                todayStart.setHours(0,0,0,0);
                result = result.filter(e => {
                    const d = new Date(e.startDate || e.date);
                    return d >= todayStart && d <= weekEnd;
                });
            } else if (selectedDateOption === 'This Month') {
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                const todayStart = new Date();
                todayStart.setHours(0,0,0,0);
                result = result.filter(e => {
                    const d = new Date(e.startDate || e.date);
                    return d >= todayStart && d <= monthEnd;
                });
            }
        }
        
        // Search Query Filter
        if (searchQuery) {
            result = result.filter(e => e.name && e.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredEvents(result);
    }, [city, selectedCategory, selectedDateOption, searchQuery, events]);

    const getClosingSoonStatus = (event) => {
        if (!event.registrationDeadline) return null;
        const deadline = new Date(event.registrationDeadline);
        const now = new Date();
        const diffMs = deadline - now;
        
        if (diffMs <= 0) return 'Closed';
        
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffHours < 24) {
            return diffHours < 1 ? 'Closes <1h' : `Closes in ${diffHours}h`;
        }
        return null;
    };

    const FeaturedCard = ({ item }) => {
        const closingText = getClosingSoonStatus(item);
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('EventDetails', { eventId: item._id, eventData: item })}
            >
                <Animated.View entering={FadeInRight.duration(600).springify()} style={styles.featuredCard}>
                    <Image source={{ uri: item.poster || 'https://via.placeholder.com/300' }} style={styles.featuredImage} />
                    
                    {closingText && (
                        <View style={[styles.featuredClosingBadge, { backgroundColor: closingText === 'Closed' ? COLORS.error : COLORS.secondary }]}>
                            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 10 }}>
                                {closingText.toUpperCase()}
                            </Text>
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={styles.featuredOverlay}
                    >
                        {item.host?.userType === 'organization' && (
                            <View style={styles.featuredHostBadge}>
                                <Ionicons name="checkmark-circle" size={10} color="#000" style={{ marginRight: 3 }} />
                                <Text style={styles.featuredHostBadgeText}>ORGANIZATION</Text>
                            </View>
                        )}
                        <Text style={styles.featuredTitle}>{item.name}</Text>
                        <Text style={styles.featuredDate}>{item.host ? `${item.host.name} • ` : ''}{new Date(item.startDate || item.date).toDateString()} • {item.location.address}</Text>
                    </LinearGradient>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const EventItem = ({ item, index }) => {
        const closingText = getClosingSoonStatus(item);
        return (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('EventDetails', { eventId: item._id, eventData: item })}
                >
                    <GlassCard style={styles.eventCard}>
                        <View style={styles.eventRow}>
                            <View style={{ position: 'relative' }}>
                                <Image source={{ uri: item.poster || 'https://via.placeholder.com/150' }} style={styles.thumb} />
                                {closingText && (
                                    <View style={[styles.closingOverlayBadge, { backgroundColor: closingText === 'Closed' ? 'rgba(255, 0, 85, 0.85)' : 'rgba(0, 240, 255, 0.85)' }]}>
                                        <Text style={{ color: '#000', fontSize: 8, fontWeight: 'bold' }}>
                                            {closingText.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventTitle} numberOfLines={1}>{item.name}</Text>
                                {item.host && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                        <Text style={{ fontSize: 12, color: COLORS.textDim }} numberOfLines={1}>by {item.host.name}</Text>
                                        {item.host.userType === 'organization' && (
                                            <View style={styles.miniVerifiedBadge}>
                                                <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
                                            </View>
                                        )}
                                    </View>
                                )}
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
    };

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
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.greeting} numberOfLines={1}>Hello, {user?.name?.split(' ')[0] || 'Explorer'} 👋</Text>
                        <Text style={styles.subGreeting} numberOfLines={1}>Ready for your next adventure?</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity
                            style={styles.bellBtn}
                            onPress={() => navigation.navigate('Notifications')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="notifications-outline" size={22} color="#fff" />
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                            {/* TODO: Avatar */}
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
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

                {/* Filter Chips Bar */}
                <View style={styles.filterBarContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarContent}>
                        <TouchableOpacity onPress={() => setShowCityModal(true)} style={[styles.filterChip, city !== 'All Cities' && styles.filterChipActive]}>
                            <Ionicons name="location-outline" size={16} color={city !== 'All Cities' ? '#000' : COLORS.primary} style={{ marginRight: 6 }} />
                            <Text style={[styles.filterChipText, city !== 'All Cities' && styles.filterChipTextActive]}>{city}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowCategoryModal(true)} style={[styles.filterChip, selectedCategory !== 'All Categories' && styles.filterChipActive]}>
                            <Ionicons name="pricetag-outline" size={16} color={selectedCategory !== 'All Categories' ? '#000' : COLORS.primary} style={{ marginRight: 6 }} />
                            <Text style={[styles.filterChipText, selectedCategory !== 'All Categories' && styles.filterChipTextActive]}>{selectedCategory}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowDateModal(true)} style={[styles.filterChip, selectedDateOption !== 'All Dates' && styles.filterChipActive]}>
                            <Ionicons name="calendar-outline" size={16} color={selectedDateOption !== 'All Dates' ? '#000' : COLORS.primary} style={{ marginRight: 6 }} />
                            <Text style={[styles.filterChipText, selectedDateOption !== 'All Dates' && styles.filterChipTextActive]}>{selectedDateOption}</Text>
                        </TouchableOpacity>
                    </ScrollView>
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

            {/* Category Filter Modal */}
            <Modal visible={showCategoryModal} transparent animationType="fade">
                <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCategoryModal(false)} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Category</Text>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.cityItem, selectedCategory === cat && styles.citySelected]}
                                    onPress={() => { setSelectedCategory(cat); setShowCategoryModal(false); }}
                                >
                                    <Text style={[styles.cityText, selectedCategory === cat && { color: COLORS.background }]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </BlurView>
            </Modal>

            {/* Date Filter Modal */}
            <Modal visible={showDateModal} transparent animationType="fade">
                <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDateModal(false)} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Date</Text>
                        {DATE_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.cityItem, selectedDateOption === opt && styles.citySelected]}
                                onPress={() => { setSelectedDateOption(opt); setShowDateModal(false); }}
                            >
                                <Text style={[styles.cityText, selectedDateOption === opt && { color: COLORS.background }]}>{opt}</Text>
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
    filterBarContainer: {
        paddingHorizontal: SIZES.padding,
        marginBottom: 15,
    },
    filterBarContent: {
        gap: 10,
        paddingRight: 20,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#000',
        fontWeight: 'bold',
    },

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
    cityText: { ...FONTS.body1, color: COLORS.textDim },
    bellBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)'
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: COLORS.error,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    featuredClosingBadge: {
        position: 'absolute',
        top: 15,
        left: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 5
    },
    closingOverlayBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12
    },
    featuredHostBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    featuredHostBadgeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 9,
    },
    miniVerifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default HomeScreen;
