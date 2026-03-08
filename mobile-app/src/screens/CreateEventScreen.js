
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
import { MapPin, Calendar, Image as ImageIcon, X } from 'lucide-react-native';

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

    // Picker State
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTarget, setPickerTarget] = useState('start'); // 'start' | 'end'
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 3600000));

    // Location
    const [location, setLocation] = useState({ address: '', lat: 0, lng: 0 });
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationQuery, setLocationQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Other
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState('0');
    const [capacity, setCapacity] = useState('100');
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

    // ... Date Logic (Simplified for brevity, same methodology)
    const CustomDatePicker = ({ visible, onClose, onSelect, title }) => {
        // Simple Index State
        const [selDate, setSelDate] = useState(0);
        const [selHour, setSelHour] = useState(0);
        const [selMin, setSelMin] = useState(0);
        const [selAmPm, setSelAmPm] = useState(0);

        const handleConfirm = () => {
            const dObj = DATES[selDate].value;
            let h = parseInt(HOURS[selHour]);
            if (selAmPm === 1 && h !== 12) h += 12;
            if (selAmPm === 0 && h === 12) h = 0;
            const finalDate = new Date(dObj);
            finalDate.setHours(h);
            finalDate.setMinutes(parseInt(MINUTES[selMin]));
            onSelect(finalDate);
            onClose();
        };

        if (!visible) return null;
        const renderCol = (data, sel, setSel, w) => (
            <View style={{ width: w, height: 150 }}>
                <FlatListWithSelection data={data} selected={sel} onSelect={setSel} />
            </View>
        );

        return (
            <Modal visible={visible} transparent animationType="fade">
                <BlurView intensity={50} tint="dark" style={styles.modalBackdrop}>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <View style={styles.colsContainer}>
                            {renderCol(DATES, selDate, setSelDate, 120)}
                            {renderCol(HOURS, selHour, setSelHour, 50)}
                            {renderCol(MINUTES, selMin, setSelMin, 50)}
                            {renderCol(AMPM, selAmPm, setSelAmPm, 50)}
                        </View>
                        <GradientButton text="Confirm" onPress={handleConfirm} colors={COLORS.gradientPrimary} containerStyle={{ height: 45 }} />
                        <TouchableOpacity onPress={onClose} style={{ marginTop: 15 }}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                    </View>
                </BlurView>
            </Modal>
        );
    };

    // Helper for Picker List
    const FlatListWithSelection = ({ data, selected, onSelect }) => (
        <FlatList
            data={data}
            keyExtractor={(_, i) => i.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 55 }}
            snapToInterval={40} decelerationRate="fast"
            renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => onSelect(index)} style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: selected === index ? COLORS.primary : COLORS.textDim, fontSize: selected === index ? 18 : 16, fontWeight: selected === index ? 'bold' : 'normal' }}>
                        {item.label || item}
                    </Text>
                </TouchableOpacity>
            )}
        />
    );


    const handleLocationSearch = async (text) => {
        setLocationQuery(text);
        if (text.length > 2) {
            // Mock or Real API
            if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes("YOUR")) {
                setSuggestions([{ description: 'Cyber Hub, Gurgaon' }, { description: 'Connaught Place, Delhi' }]);
            } else { /* Call API */ }
        } else setSuggestions([]);
    };

    const handleSubmit = async () => {
        if (!name || !description || !location.address) return Alert.alert('Error', 'Please fill required fields');
        setLoading(true);
        try {
            const payload = {
                name, description, category,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                location: location.address ? location : { address: 'Virtual' }, // Fallback
                ticketType: isPaid ? 'Paid' : 'Free',
                price: isPaid ? Number(price) : 0,
                totalTickets: Number(capacity),
                poster: image
            };
            await api.post('/events', payload);
            Alert.alert('Success', 'Event Created!');
            navigation.navigate('HomeTab');
        } catch (e) { Alert.alert('Error', 'Failed'); }
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
                            <Text style={styles.label}>Location</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowLocationModal(true)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MapPin size={18} color={COLORS.secondary} style={{ marginRight: 10 }} />
                                    <Text style={{ color: location.address ? COLORS.text : COLORS.textDim }}>{location.address || 'Select Location'}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Starts</Text>
                                <TouchableOpacity style={styles.input} onPress={() => { setPickerTarget('start'); setPickerVisible(true); }}>
                                    <Text style={{ color: COLORS.text }}>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Ends</Text>
                                <TouchableOpacity style={styles.input} onPress={() => { setPickerTarget('end'); setPickerVisible(true); }}>
                                    <Text style={{ color: COLORS.text }}>{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

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

                        <GradientButton text="Create Event" onPress={handleSubmit} isLoading={loading} containerStyle={{ marginTop: 20 }} />

                    </GlassCard>
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomDatePicker visible={pickerVisible} title="Select Time" onClose={() => setPickerVisible(false)} onSelect={(d) => { if (pickerTarget === 'start') setStartDate(d); else setEndDate(d); }} />

            <Modal visible={showLocationModal} animationType="slide" transparent>
                <BlurView intensity={100} tint="dark" style={styles.modalFull}>
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
                </BlurView>
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

    modalFull: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    locItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', gap: 10 },
    locText: { color: COLORS.text, fontSize: 16 }
});

export default CreateEventScreen;
