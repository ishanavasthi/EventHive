
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../../constants/theme';

const GlassCard = ({ children, style, contentContainerStyle, intensity = 20 }) => {
    return (
        <View style={[styles.container, style]}>
            {/* Background Blur - Non-interactive */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            </View>

            {/* Content Layer */}
            <View style={[styles.content, contentContainerStyle]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        backgroundColor: 'rgba(5, 5, 17, 0.5)',
    },
    content: {
        padding: SIZES.padding,
        zIndex: 1, // Ensure content is above blur
    }
});

export default GlassCard;
