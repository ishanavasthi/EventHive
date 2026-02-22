
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Animated } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { LucideIcon } from 'lucide-react-native';

const CustomInput = ({
    icon: Icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default'
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[
            styles.container,
            isFocused && styles.focusedContainer
        ]}>
            {Icon && (
                <Icon
                    size={20}
                    color={isFocused ? COLORS.primary : COLORS.textDim}
                    style={styles.icon}
                />
            )}
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textDim}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCapitalize="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        height: 56,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    focusedContainer: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(0, 240, 255, 0.05)', // Tint with primary color
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        ...FONTS.body2,
    }
});

export default CustomInput;
