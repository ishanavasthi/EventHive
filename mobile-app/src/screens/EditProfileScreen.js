import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';

const EditProfileScreen = ({ navigation }) => {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState(user?.email || '');
    const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');

    // Bank Details
    const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
    const [ifscCode, setIfscCode] = useState(user?.bankDetails?.ifscCode || '');
    const [accountHolderName, setAccountHolderName] = useState(user?.bankDetails?.accountHolderName || '');

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true
        });

        if (!result.canceled) {
            setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                email,
                profilePicture,
                bankDetails: {
                    accountNumber,
                    ifscCode,
                    accountHolderName
                }
            };

            const res = await api.put('/auth/profile', payload);

            // Update Context
            // We need to merge the new user data with the existing token logic if needed, 
            // but setUser usually just updates the user object in state.
            setUser(res.data);

            Alert.alert('Success', 'Profile Updated Successfully!');
            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={{ uri: profilePicture || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    <View style={styles.editIconBadge}>
                        <Text style={{ color: '#fff', fontSize: 12 }}>Edit</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Personal Details</Text>

            <Text style={styles.label}>Full Name (Cannot be changed)</Text>
            <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.name}
                editable={false}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Bank Details (For Payouts)</Text>

            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
                style={styles.input}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="Name as per Passbook"
                placeholderTextColor={COLORS.textDim}
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={COLORS.textDim}
            />

            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
                style={styles.input}
                value={ifscCode}
                onChangeText={setIfscCode}
                autoCapitalize="characters"
                placeholder="ABCD0123456"
                placeholderTextColor={COLORS.textDim}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Save Changes</Text>}
            </TouchableOpacity>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: COLORS.background, flexGrow: 1 },
    header: { alignItems: 'center', marginBottom: 30 },
    avatar: {
        width: 120, height: 120, borderRadius: 60,
        borderWidth: 2, borderColor: COLORS.primary
    },
    editIconBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12, overflow: 'hidden'
    },
    sectionTitle: { ...FONTS.h3, color: COLORS.primary, marginBottom: 15, marginTop: 10 },
    label: { ...FONTS.body, color: COLORS.textDim, marginBottom: 5 },
    input: {
        backgroundColor: COLORS.surface, color: COLORS.text,
        padding: 12, borderRadius: 10, marginBottom: 15,
        borderWidth: 1, borderColor: COLORS.border
    },
    disabledInput: { backgroundColor: COLORS.background, color: COLORS.textDim, borderColor: COLORS.border },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
    saveBtn: {
        backgroundColor: COLORS.primary, padding: 15, borderRadius: 12,
        alignItems: 'center', marginTop: 30, marginBottom: 30
    },
    btnText: { fontWeight: 'bold', fontSize: 16 }
});

export default EditProfileScreen;