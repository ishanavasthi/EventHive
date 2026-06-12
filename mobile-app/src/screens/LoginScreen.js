import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import CustomInput from '../components/ui/CustomInput';
import GradientButton from '../components/ui/GradientButton';
import GlassCard from '../components/ui/GlassCard';
import { Mail, Lock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, promptAsync, appleLogin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Sign In button pressed. Attempting login for:', email);
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const res = await appleLogin(credential.identityToken, credential.fullName);
      if (!res.success) {
        Alert.alert('Apple Sign-In Failed', res.msg);
      }
    } catch (error) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0a2a', '#001a1a']} // Deep space/ocean background
        style={StyleSheet.absoluteFillObject}
      />
      {/* Ambient Background Glows */}
      <View style={[styles.glow, { top: -100, left: -50, backgroundColor: COLORS.primary }]} />
      <View style={[styles.glow, { bottom: -100, right: -50, backgroundColor: COLORS.secondary }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
          <Text style={styles.title}>EventHive</Text>
          <Text style={styles.subtitle}>Discover the extraordinary.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(1000).springify()}>
          <GlassCard style={styles.card}>
            <Text style={styles.loginText}>Welcome Back</Text>

            <CustomInput
              icon={Mail}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <CustomInput
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <GradientButton
              text="Sign In"
              onPress={handleLogin}
              isLoading={loading}
              containerStyle={{ marginTop: 10 }}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <GradientButton
              text="Continue with Google"
              onPress={handleGoogleLogin}
              colors={['#4285F4', '#2a69c7']}
              containerStyle={{ marginTop: 0 }}
            />

            {Platform.OS === 'ios' && (
              <View style={{ marginTop: 10 }}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                  style={styles.appleButton}
                  onPress={handleAppleLogin}
                />
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Register')}
              >
                Create Account
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.2,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: COLORS.primary,
    textShadowRadius: 20,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    padding: 10,
  },
  loginText: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    ...FONTS.body2,
    color: COLORS.textDim,
  },
  link: {
    ...FONTS.body2,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.textDim,
    opacity: 0.3,
  },
  dividerText: {
    ...FONTS.body2,
    color: COLORS.textDim,
    paddingHorizontal: 10,
  },
  appleButton: {
    width: '100%',
    height: 56,
  }
});

export default LoginScreen;