
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import CustomInput from '../components/ui/CustomInput';
import GradientButton from '../components/ui/GradientButton';
import GlassCard from '../components/ui/GlassCard';
import { Mail, Lock, User, CreditCard, Building, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const RegisterScreen = ({ navigation }) => {
    const { register } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('individual'); // 'individual' | 'organization'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        city: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: ''
    });

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleRegister = async () => {
        const { name, email, password, city, accountNumber, ifscCode, accountHolderName } = formData;
        if (!name || !email || !password) {
            Alert.alert('Error', 'Name, Email and Password are required');
            return;
        }

        setLoading(true);
        const bankDetails = { accountNumber, ifscCode, accountHolderName };
        try {
            const res = await register(name, email, password, bankDetails, userType, city);
            if (!res.success) {
                Alert.alert('Registration Failed', res.msg);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#050511', '#0a0a2a', '#001a1a']}
                style={StyleSheet.absoluteFillObject}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join the hive.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(1000).springify()}>
                        <GlassCard style={styles.card}>
                            <Text style={styles.sectionTitle}>Account Type</Text>
                            <View style={styles.selectorContainer}>
                                <TouchableOpacity
                                    style={[styles.selectorBtn, userType === 'individual' && styles.selectorBtnActive]}
                                    onPress={() => setUserType('individual')}
                                >
                                    <Text style={[styles.selectorBtnText, userType === 'individual' && styles.selectorBtnTextActive]}>Individual</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.selectorBtn, userType === 'organization' && styles.selectorBtnActive]}
                                    onPress={() => setUserType('organization')}
                                >
                                    <Text style={[styles.selectorBtnText, userType === 'organization' && styles.selectorBtnTextActive]}>Organization</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
                                {userType === 'individual' ? 'Personal Info' : 'Organization Details'}
                            </Text>
                            <CustomInput
                                icon={userType === 'individual' ? User : Building}
                                placeholder={userType === 'individual' ? "Full Name" : "Organization Name"}
                                value={formData.name}
                                onChangeText={(t) => handleChange('name', t)}
                            />
                            <CustomInput
                                icon={Mail}
                                placeholder="Email Address"
                                value={formData.email}
                                onChangeText={(t) => handleChange('email', t)}
                                keyboardType="email-address"
                            />
                            <CustomInput
                                icon={Lock}
                                placeholder="Password"
                                value={formData.password}
                                onChangeText={(t) => handleChange('password', t)}
                                secureTextEntry
                            />
                            <CustomInput
                                icon={MapPin}
                                placeholder="City (e.g. Bengaluru, Mumbai)"
                                value={formData.city}
                                onChangeText={(t) => handleChange('city', t)}
                            />

                            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payout Details (Optional)</Text>
                            <CustomInput
                                icon={User}
                                placeholder="Account Holder Name"
                                value={formData.accountHolderName}
                                onChangeText={(t) => handleChange('accountHolderName', t)}
                            />
                            <CustomInput
                                icon={CreditCard}
                                placeholder="Account Number"
                                value={formData.accountNumber}
                                onChangeText={(t) => handleChange('accountNumber', t)}
                                keyboardType="numeric"
                            />
                            <CustomInput
                                icon={Building}
                                placeholder="IFSC Code"
                                value={formData.ifscCode}
                                onChangeText={(t) => handleChange('ifscCode', t)}
                            />

                            <GradientButton
                                text="Sign Up"
                                onPress={handleRegister}
                                isLoading={loading}
                                containerStyle={{ marginTop: 20 }}
                            />

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <Text
                                    style={styles.link}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    Sign In
                                </Text>
                            </View>
                        </GlassCard>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: SIZES.padding, paddingBottom: 50, paddingTop: 60 },
    title: { ...FONTS.h1, color: COLORS.primary, textAlign: 'center', marginBottom: 5 },
    subtitle: { ...FONTS.body1, color: COLORS.textDim, textAlign: 'center', marginBottom: 30 },
    card: { padding: 15 },
    sectionTitle: { ...FONTS.h3, color: COLORS.text, marginBottom: 15, fontWeight: '600' },
    selectorContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectorBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    selectorBtnActive: {
        backgroundColor: COLORS.primary,
    },
    selectorBtnText: {
        color: COLORS.textDim,
        fontWeight: '600',
        fontSize: 14,
    },
    selectorBtnTextActive: {
        color: '#000',
        fontWeight: 'bold',
    },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { ...FONTS.body2, color: COLORS.textDim },
    link: { ...FONTS.body2, color: COLORS.secondary, fontWeight: 'bold' }
});

export default RegisterScreen;
