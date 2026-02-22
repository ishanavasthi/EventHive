
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
    // Brand Identity: "Aurora" (Blue/Green/Neon)
    primary: '#00F0FF',    // Cyan/Electric Blue
    secondary: '#00FF94',  // Neon Green
    tertiary: '#7000FF',   // Deep Violet (Accent)

    // Backgrounds - Dark Mode Focus
    background: '#050511', // Very dark blue/black
    surface: 'rgba(20, 20, 35, 0.7)', // Glassmorphism base
    surfaceLight: 'rgba(255, 255, 255, 0.1)',

    // Text
    text: '#FFFFFF',
    textDim: 'rgba(255, 255, 255, 0.6)',
    textDark: '#000000',

    // Status
    success: '#00FF94',
    error: '#FF0055',
    warning: '#FFCC00',

    // Gradients
    gradientPrimary: ['#00C6FF', '#0072FF'], // Deep Blue to Light Blue
    gradientSecondary: ['#11998e', '#38ef7d'], // Green gradient
    gradientDark: ['#0f0c29', '#302b63', '#24243e'], // Deep space
};

export const SIZES = {
    // Global Sizing
    base: 8,
    font: 14,
    radius: 16,
    padding: 24,

    // Font Sizes
    h1: 34,
    h2: 24,
    h3: 20,
    body1: 16,
    body2: 14,
    body3: 12,

    // App Dimensions
    width,
    height,
};

export const FONTS = {
    // We will stick to system fonts for now to avoid loading issues, but style them well
    h1: { fontSize: SIZES.h1, lineHeight: 40, fontWeight: '800', letterSpacing: 0.5 },
    h2: { fontSize: SIZES.h2, lineHeight: 30, fontWeight: '700', letterSpacing: 0.5 },
    h3: { fontSize: SIZES.h3, lineHeight: 26, fontWeight: '600' },
    body1: { fontSize: SIZES.body1, lineHeight: 24, fontWeight: '400' },
    body2: { fontSize: SIZES.body2, lineHeight: 22, fontWeight: '400' },
    body3: { fontSize: SIZES.body3, lineHeight: 20, fontWeight: '400' },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
