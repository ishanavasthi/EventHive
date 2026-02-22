import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback construction if makeRedirectUri fails to pick up the proxy
  const manualRedirectUri = 'https://auth.expo.io/@arjunojha/mobile-app';
  const redirectUri = makeRedirectUri({ useProxy: true });

  console.log('------------------------------------------------');
  console.log('GOOGLE AUTH REDIRECT URI (Add this to Google Cloud):');
  console.log('If the one below says exp://, use THIS one instead:');
  console.log(manualRedirectUri);
  console.log('Generated:', redirectUri);
  console.log('------------------------------------------------');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '878257577448-jlb8ocmbha6jgublnlmp60fjl6haogjf.apps.googleusercontent.com',
    androidClientId: '878257577448-jlb8ocmbha6jgublnlmp60fjl6haogjf.apps.googleusercontent.com',
    iosClientId: '878257577448-jlb8ocmbha6jgublnlmp60fjl6haogjf.apps.googleusercontent.com',
    redirectUri: redirectUri
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const { authentication } = response;
      // Depending on the flow, id_token might be in params or authentication
      const token = id_token || authentication?.idToken || authentication?.accessToken;
      // Note: Backend expects 'idToken' usually, but 'accessToken' can be verified via userinfo endpoint. 
      // Our backend verifies `idToken`. Implicit flow returns it in params.
      handleGoogleLogin(token);
    }
  }, [response]);

  const handleGoogleLogin = async (token) => {
    try {
      const res = await api.post('/auth/google', { token });
      const { token: jwt, user } = res.data;

      setUser(user);
      api.defaults.headers.common['x-auth-token'] = jwt;
      await AsyncStorage.setItem('token', jwt);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
    } catch (err) {
      console.error('Google Login Error', err);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['x-auth-token'] = token;
        // Verify token or get user profile?
        // Ideally call GET /api/auth/me, but for MVP we might just assume valid or decode.
        // Let's assume we stored user data too or fetch it.
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) setUser(JSON.parse(userInfo));
      }
    } catch (e) {
      console.log('Failed to load user', e);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data; // Assuming backend returns { token, user } or similar
      // Check backend/routes/auth.js to be sure.

      setUser(user); // If user is not returned, we might need to decode or fetch.
      api.defaults.headers.common['x-auth-token'] = token;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user || {})); // Guard if user is undefined
      return { success: true };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (name, email, password, bankDetails) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, bankDetails });
      const { token, user } = res.data; // Assuming same structure

      setUser(user);
      api.defaults.headers.common['x-auth-token'] = token;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user || {}));
      return { success: true };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Registration failed' };
    }
  };

  const guestLogin = async () => {
    const guestUser = {
      _id: 'guest_123',
      name: 'Guest User',
      email: 'guest@eventhive.local',
      role: 'user'
    };
    setUser(guestUser);
    // Don't set token or save to async storage to keep it ephemeral or maybe save if needed?
    // For testing, ephemeral is fine, but reload will log them out.
    // Let's save it so reload works.
    await AsyncStorage.setItem('userInfo', JSON.stringify(guestUser));
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    delete api.defaults.headers.common['x-auth-token'];
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, guestLogin, logout, promptAsync }}>
      {children}
    </AuthContext.Provider>
  );
};