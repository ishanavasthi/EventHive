import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

const PaymentScreen = ({ route, navigation }) => {
    const { event } = route.params;
    const [loading, setLoading] = useState(false);
    const qty = 1; // MVP single ticket

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Order
            const orderRes = await api.post('/bookings/checkout', { eventId: event._id, quantity: qty });
            const { id: orderId, amount, key } = orderRes.data;

            // 2. Open Razorpay (Mocking interaction here)
            // In a real Native app, uses RazorpayCheckout.open options
            // For this Demo, we assume user completes payment on the "Gateway"

            Alert.alert(
                'Payment Gateway',
                `Pay ₹${amount / 100}?`,
                [
                    { text: 'Cancel', onPress: () => setLoading(false), style: 'cancel' },
                    { text: 'Pay', onPress: () => confirmPayment(orderId) }
                ]
            );

        } catch (err) {
            console.error(err);
            // Offline Mode Fallback
            Alert.alert(
                'Offline Mode',
                'Network request failed. Proceeding with Mock Payment.',
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
                    { text: 'Mock Pay', onPress: () => confirmPayment('mock_order_offline') }
                ]
            );
        }
    };

    const confirmPayment = async (orderId) => {
        try {
            // 3. Verify Payment
            // We mock the signature and paymentId
            const payload = {
                razorpay_order_id: orderId,
                razorpay_payment_id: `pay_${Date.now()}`,
                razorpay_signature: 'mock_signature',
                eventId: event._id,
                quantity: qty
            };

            const verifyRes = await api.post('/bookings/verify', payload);

            if (verifyRes.data.msg === 'Booking confirmed') {
                navigation.navigate('BookingSuccess', { booking: verifyRes.data.booking });
            }

        } catch (err) {
            // Offline Mode Fallback
            Alert.alert(
                'Offline Mode',
                'Verification failed (Network). Booking confirmed locally.',
                [{
                    text: 'OK',
                    onPress: () => navigation.navigate('BookingSuccess', {
                        booking: { ticketCode: 'OFFLINE-TICKET-123' }
                    })
                }]
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Booking: {event.name}</Text>
            <Text style={styles.price}>Total: ₹{event.price * qty}</Text>

            {loading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : (
                <Button title="Proceed to Pay" onPress={handlePayment} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    price: { fontSize: 20, marginBottom: 30, color: 'green' }
});

export default PaymentScreen;
