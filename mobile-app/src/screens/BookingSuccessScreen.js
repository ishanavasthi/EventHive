import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const BookingSuccessScreen = ({ route, navigation }) => {
    const { booking } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.success}>Booking Confirmed!</Text>
            <Text style={styles.info}>Ticket Code:</Text>
            <Text style={styles.code}>{booking.ticketCode}</Text>

            <Button title="Back to Home" onPress={() => navigation.navigate('OneEvent')} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8f5e9' },
    success: { fontSize: 24, fontWeight: 'bold', color: 'green', marginBottom: 20 },
    info: { fontSize: 18 },
    code: { fontSize: 30, fontWeight: 'bold', marginVertical: 20, letterSpacing: 2 }
});

export default BookingSuccessScreen;