
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch, Image, Alert, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { GOOGLE_MAPS_API_KEY } from '../constants/config';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import GradientButton from '../components/ui/GradientButton';
import GlassCard from '../components/ui/GlassCard';
import { MapPin, Calendar, Image as ImageIcon, X, ChevronDown, Check } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

// Constants for Picker
const MINUTES = ['00', '15', '30', '45'];
const AMPM = ['AM', 'PM'];
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push({
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            value: d
        });
    }
    return dates;
};
const DATES = generateDates();

const CreateEventScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Music');
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('start'); // 'start' | 'end' | 'deadline'
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 3600000));
    const [hasDeadline, setHasDeadline] = useState(false);
    const [deadlineDate, setDeadlineDate] = useState(new Date());

    // Location
    const [location, setLocation] = useState({ address: '', lat: 0, lng: 0 });
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationQuery, setLocationQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Other
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState('0');
    const [capacity, setCapacity] = useState('100');
    const [isExternalTicket, setIsExternalTicket] = useState(false);
    const [externalTicketUrl, setExternalTicketUrl] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- Actions ---
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9], quality: 0.5, base64: true
        });
        if (!result.canceled) setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    };

    // ... Date Logic
    const CustomDatePicker = ({ visible, onClose, onSelect, title, target, currentStartDate, value }) => {
        const [selDate, setSelDate] = useState(0);
        const [selHour, setSelHour] = useState(0);
        const [selMin, setSelMin] = useState(0);
        const [selAmPm, setSelAmPm] = useState(0); // 0 = AM, 1 = PM

        // Refs for auto-scrolling
        const dateListRef = React.useRef(null);
        const hourListRef = React.useRef(null);
        const minListRef = React.useRef(null);
        const ampmListRef = React.useRef(null);

        React.useEffect(() => {
            if (visible && value) {
                const valDateOnly = new Date(value);
                valDateOnly.setHours(0, 0, 0, 0);
                
                let dateIdx = DATES.findIndex(d => {
                    const compDate = new Date(d.value);
                    compDate.setHours(0, 0, 0, 0);
                    return compDate.getTime() === valDateOnly.getTime();
                });
                if (dateIdx === -1) dateIdx = 0;

                let hour24 = value.getHours();
                let isPm = hour24 >= 12;
                let hour12 = hour24 % 12;
                if (hour12 === 0) hour12 = 12;
                
                const hourIdx = HOURS.indexOf(hour12.toString());
                const ampmIdx = isPm ? 1 : 0;

                const minutesVal = value.getMinutes();
                let closestMinIdx = 0;
                let minDiff = 999;
                MINUTES.forEach((m, idx) => {
                    const diff = Math.abs(parseInt(m) - minutesVal);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestMinIdx = idx;
                    }
                });

                setSelDate(dateIdx);
                setSelHour(hourIdx !== -1 ? hourIdx : 0);
                setSelMin(closestMinIdx);
                setSelAmPm(ampmIdx);
            }
        }, [visible, value]);

        const scrollToIndexSafe = (ref, index) => {
            if (ref?.current && index >= 0) {
                setTimeout(() => {
                    try { ref.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 }); } catch (e) { }
                }, 100);
            }
        };

        // Effect to scroll when selection changes (or initial load)
        React.useEffect(() => { if (visible) scrollToIndexSafe(dateListRef, selDate); }, [visible, selDate]);
        React.useEffect(() => { if (visible) scrollToIndexSafe(hourListRef, selHour); }, [visible, selHour]);
        React.useEffect(() => { if (visible) scrollToIndexSafe(minListRef, selMin); }, [visible, selMin]);
        React.useEffect(() => { if (visible) scrollToIndexSafe(ampmListRef, selAmPm); }, [visible, selAmPm]);

        const handleConfirm = () => {
            const dObj = DATES[selDate].value;
            let h = parseInt(HOURS[selHour]);
            if (selAmPm === 1 && h !== 12) h += 12;
            if (selAmPm === 0 && h === 12) h = 0;

            const finalDate = new Date(dObj);
            finalDate.setHours(h);
            finalDate.setMinutes(parseInt(MINUTES[selMin]));
            finalDate.setSeconds(0);
            finalDate.setMilliseconds(0);

            // Validation: End Date >= Start Date + 15 mins
            if (target === 'end' && currentStartDate) {
                const diff = (finalDate - currentStartDate) / 1000 / 60; // diff in minutes
                if (diff < 15) {
                    Alert.alert("Invalid Time", "End time must be at least 15 minutes after start time.");
                    return;
                }
            }

            // Validation: End Date cannot be before Start Date
            if (target === 'end' && finalDate < currentStartDate) {
                Alert.alert("Invalid Time", "End time cannot be before start time.");
                return;
            }

            // Validation: Deadline <= Start Date
            if (target === 'deadline') {
                if (finalDate > currentStartDate) {
                    Alert.alert("Invalid Time", "Registration deadline must be before or equal to the event start date.");
                    return;
                }
            }

            onSelect(finalDate);
            onClose();
        };

        if (!visible) return null;

        const renderCol = (data, sel, setSel, w, ref) => (
            <View style={{ width: w, height: 180 }}>
                <FlatList
                    ref={ref}
                    data={data}
                    keyExtractor={(_, i) => i.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 70 }}
                    snapToInterval={40} decelerationRate="fast"
                    getItemLayout={(data, index) => ({ length: 40, offset: 40 * index, index })}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity onPress={() => setSel(index)} style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: sel === index ? COLORS.primary : COLORS.textDim, fontSize: sel === index ? 18 : 16, fontWeight: sel === index ? 'bold' : 'normal' }}>
                                {item.label || item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );

        return (
            <Modal visible={visible} transparent animationType="fade">
                <BlurView intensity={50} tint="dark" style={styles.modalBackdrop}>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <View style={styles.colsContainer}>
                            {renderCol(DATES, selDate, setSelDate, 120, dateListRef)}
                            {renderCol(HOURS, selHour, setSelHour, 50, hourListRef)}
                            {renderCol(MINUTES, selMin, setSelMin, 50, minListRef)}
                            {renderCol(AMPM, selAmPm, setSelAmPm, 50, ampmListRef)}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 }}>
                            <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: '#333' }]}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirm} style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Modal>
        );
    };


    const handleLocationSearch = async (text) => {
        setLocationQuery(text);
        if (text.length > 2) {
            // Mock or Real API
            if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes("YOUR")) {
                setSuggestions([{ description: 'Cyber Hub, Gurgaon' }, { description: 'Connaught Place, Delhi' }]);
            } else {
                try {
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}&language=en`
                    );
                    const data = await response.json();
                    if (data.status === 'OK') {
                        setSuggestions(data.predictions);
                    } else {
                        console.log('Google Places Error:', data.status);
                        setSuggestions([]);
                    }
                } catch (error) {
                    console.error('Error fetching places:', error);
                }
            }
        } else setSuggestions([]);
    };

    const handleSubmit = async () => {
        if (!name || !description || !location.address) return Alert.alert('Error', 'Please fill required fields');
        if (isExternalTicket && !externalTicketUrl) return Alert.alert('Error', 'Please provide a ticket URL');
        if (hasDeadline && deadlineDate > startDate) {
            return Alert.alert('Error', 'Registration deadline must be before or equal to the event start date');
        }
        setLoading(true);
        try {
            const payload = {
                name, description, category,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                location: location.address ? location : { address: 'Virtual' }, // Fallback
                ticketType: isExternalTicket ? 'Free' : (isPaid ? 'Paid' : 'Free'),
                price: isExternalTicket ? 0 : (isPaid ? Number(price) : 0),
                totalTickets: isExternalTicket ? 0 : Number(capacity),
                poster: image,
                isExternalTicket,
                externalTicketUrl: isExternalTicket ? externalTicketUrl : '',
                registrationDeadline: hasDeadline ? deadlineDate.toISOString() : null
            };
            await api.post('/events', payload);
            Alert.alert('Success', 'Event Created!');
            navigation.navigate('HomeTab');
        } catch (e) { Alert.alert('Error', 'Failed to create event'); }
        finally { setLoading(false); }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050511', '#0a0a2a', '#001a1a']}
                style={StyleSheet.absoluteFillObject}
            />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 100 }}>
                    <Text style={styles.headerTitle}>Host Event</Text>

                    {user?.userType === 'organization' && (
                        <GlassCard style={styles.orgTipCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Ionicons name="business" size={24} color={COLORS.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.orgTipTitle}>Organization Hosting Mode</Text>
                                    <Text style={styles.orgTipDesc}>
                                        Set custom registration deadlines and specify external ticket URLs for your conferences or workshops.
                                    </Text>
                                </View>
                            </View>
                        </GlassCard>
                    )}

                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.preview} />
                        ) : (
                            <View style={{ alignItems: 'center' }}>
                                <ImageIcon size={40} color={COLORS.primary} />
                                <Text style={styles.pickerText}>Upload Poster</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <GlassCard style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Event Name</Text>
                            <TextInput style={styles.input} placeholder="Ex: Neon Party" placeholderTextColor={COLORS.textDim} value={name} onChangeText={setName} />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline placeholder="Tell us more..." placeholderTextColor={COLORS.textDim} value={description} onChangeText={setDescription} />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowCategoryModal(true)}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.text }}>{category}</Text>
                                    <ChevronDown size={18} color={COLORS.textDim} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowLocationModal(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MapPin size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                    <Text style={{ color: location.address ? COLORS.text : COLORS.textDim }}>{location.address || 'Select Location'}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Starts</Text>
                            <TouchableOpacity style={styles.input} onPress={() => { setPickerTarget('start'); setPickerVisible(true); }}>
                                <Text style={{ color: COLORS.text }}>{startDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ends</Text>
                            <TouchableOpacity style={styles.input} onPress={() => { setPickerTarget('end'); setPickerVisible(true); }}>
                                <Text style={{ color: COLORS.text }}>{endDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.row, { alignItems: 'center', marginVertical: 10 }]}>
                            <Text style={[styles.label, { marginBottom: 0 }]}>Set Registration Deadline?</Text>
                            <Switch 
                                value={hasDeadline} 
                                onValueChange={(val) => {
                                    setHasDeadline(val);
                                    if (val) {
                                        const defaultDeadline = new Date(startDate.getTime() - 7200000); // 2 hours before start
                                        const now = new Date();
                                        if (defaultDeadline > now) {
                                            setDeadlineDate(defaultDeadline);
                                        } else {
                                            setDeadlineDate(new Date(startDate.getTime()));
                                        }
                                    }
                                }} 
                                trackColor={{ false: '#333', true: COLORS.primary }} 
                                thumbColor="#fff" 
                            />
                        </View>

                        {hasDeadline && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Registrations Close</Text>
                                <TouchableOpacity style={styles.input} onPress={() => { setPickerTarget('deadline'); setPickerVisible(true); }}>
                                    <Text style={{ color: COLORS.text }}>{deadlineDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.row, { alignItems: 'center', marginVertical: 10 }]}>
                            <Text style={[styles.label, { marginBottom: 0 }]}>Tickets on other website?</Text>
                            <Switch value={isExternalTicket} onValueChange={setIsExternalTicket} trackColor={{ false: '#333', true: COLORS.primary }} thumbColor="#fff" />
                        </View>

                        {isExternalTicket ? (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Ticket Page URL</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: https://college.edu/hackathon"
                                    placeholderTextColor={COLORS.textDim}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                    value={externalTicketUrl}
                                    onChangeText={setExternalTicketUrl}
                                />
                            </View>
                        ) : (
                            <>
                                <View style={[styles.row, { alignItems: 'center', marginVertical: 10 }]}>
                                    <Text style={[styles.label, { marginBottom: 0 }]}>Paid Event?</Text>
                                    <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ false: '#333', true: COLORS.primary }} thumbColor="#fff" />
                                </View>

                                {isPaid && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Price (₹)</Text>
                                        <TextInput style={styles.input} placeholder="0" placeholderTextColor={COLORS.textDim} keyboardType="numeric" value={price} onChangeText={setPrice} />
                                    </View>
                                )}

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Total Tickets</Text>
                                    <TextInput style={styles.input} placeholder="100" placeholderTextColor={COLORS.textDim} keyboardType="numeric" value={capacity} onChangeText={setCapacity} />
                                </View>
                            </>
                        )}

                        <GradientButton
                            text="Create Event"
                            onPress={handleSubmit}
                            isLoading={loading}
                            colors={['#1a1a1a', '#2a2a2a']} // Subtle dark gradient
                            containerStyle={{ marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                            textStyle={{ color: COLORS.primary, letterSpacing: 2 }}
                        />

                    </GlassCard>
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomDatePicker
                visible={pickerVisible}
                title={pickerTarget === 'start' ? "Select Start Time" : pickerTarget === 'end' ? "Select End Time" : "Select Registration Deadline"}
                target={pickerTarget}
                currentStartDate={startDate}
                value={pickerTarget === 'start' ? startDate : pickerTarget === 'end' ? endDate : deadlineDate}
                onClose={() => setPickerVisible(false)}
                onSelect={(d) => { 
                    if (pickerTarget === 'start') {
                        setStartDate(d);
                        if (endDate <= d) {
                            setEndDate(new Date(d.getTime() + 3600000));
                        }
                        if (hasDeadline && deadlineDate > d) {
                            setDeadlineDate(new Date(d.getTime()));
                        }
                    } 
                    else if (pickerTarget === 'end') {
                        setEndDate(d); 
                    }
                    else {
                        setDeadlineDate(d); 
                    }
                }}
            />

            {/* Category Modal */}
            <Modal visible={showCategoryModal} transparent animationType="fade">
                <BlurView intensity={90} tint="dark" style={styles.modalBackdrop}>
                    <View style={styles.categoryContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={['Tech', 'Art', 'Sports', 'Cultural', 'Cooking', 'Meetup', 'Music', 'Workshop', 'Other']}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.categoryItem, category === item && styles.categoryItemSelected]}
                                    onPress={() => {
                                        setCategory(item);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text style={[styles.categoryText, category === item && { color: '#000', fontWeight: 'bold' }]}>{item}</Text>
                                    {category === item && <Check size={18} color="#000" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </BlurView>
            </Modal>

            <Modal visible={showLocationModal} animationType="slide">
                <View style={styles.modalFull}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Search Location</Text>
                        <TouchableOpacity onPress={() => setShowLocationModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
                    </View>
                    <TextInput style={styles.input} placeholder="Search..." placeholderTextColor={COLORS.textDim} value={locationQuery} onChangeText={handleLocationSearch} autoFocus />
                    <FlatList
                        data={suggestions} keyExtractor={i => i.description || Math.random().toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.locItem} onPress={() => { setLocation({ address: item.description, lat: 0, lng: 0 }); setShowLocationModal(false); }}>
                                <MapPin size={16} color={COLORS.textDim} style={{ marginTop: 2 }} />
                                <Text style={styles.locText}>{item.description}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerTitle: { ...FONTS.h1, color: COLORS.primary, marginBottom: 20, textAlign: 'center', marginTop: 40 },
    imagePicker: {
        height: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', marginBottom: 25,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed'
    },
    preview: { width: '100%', height: '100%', borderRadius: 20 },
    pickerText: { color: COLORS.primary, marginTop: 10, fontWeight: '600' },

    formCard: { padding: 20 },
    inputGroup: { marginBottom: 15 },
    label: { ...FONTS.body3, color: COLORS.textDim, marginBottom: 8 },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)', color: COLORS.text, padding: 15, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 16
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },

    modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center' },
    pickerContainer: { width: '90%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, alignItems: 'center' },
    colsContainer: { flexDirection: 'row', justifyContent: 'space-around', height: 150, marginBottom: 20, width: '100%' },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    cancelText: { color: COLORS.error, fontSize: 16 },

    modalFull: { flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: COLORS.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    locItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', gap: 10 },
    locText: { color: COLORS.text, fontSize: 16 },
    modalBtn: { flex: 1, marginHorizontal: 5, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    categoryContainer: {
        width: '90%',
        maxHeight: '70%',
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    categoryItemSelected: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        borderBottomWidth: 0,
    },
    categoryText: {
        color: COLORS.text,
        fontSize: 16,
    },
    orgTipCard: {
        padding: 16,
        marginBottom: 20,
        borderColor: COLORS.primary,
        borderWidth: 1,
    },
    orgTipTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    orgTipDesc: {
        fontSize: 12,
        color: COLORS.textDim,
        lineHeight: 16,
    }
});

export default CreateEventScreen;
