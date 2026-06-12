import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Ticket, CheckCircle2, AlertTriangle, Bell, Check, Trash2 } from 'lucide-react-native';
import { NotificationContext } from '../context/NotificationContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import GlassCard from '../components/ui/GlassCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const NotificationsScreen = ({ navigation }) => {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useContext(NotificationContext);

  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return { component: Ticket, color: COLORS.primary, bg: 'rgba(0, 240, 255, 0.1)' };
      case 'check_in':
        return { component: CheckCircle2, color: COLORS.secondary, bg: 'rgba(0, 255, 148, 0.1)' };
      case 'event_cancelled':
        return { component: AlertTriangle, color: COLORS.error, bg: 'rgba(255, 0, 85, 0.1)' };
      default:
        return { component: Bell, color: COLORS.tertiary, bg: 'rgba(112, 0, 255, 0.1)' };
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }) => {
    const iconConfig = getIcon(item.type);
    const IconComponent = iconConfig.component;

    return (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => !item.read && markAsRead(item._id)}
        >
          <GlassCard
            style={[
              styles.card,
              !item.read && styles.unreadCard
            ]}
            contentContainerStyle={styles.cardContent}
          >
            <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
              <IconComponent size={20} color={iconConfig.color} />
            </View>

            <View style={styles.textContainer}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, !item.read && styles.unreadText]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.timeText}>
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.messageText} numberOfLines={2}>
                {item.message}
              </Text>
            </View>

            {!item.read && (
              <View style={styles.unreadDot} />
            )}
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050511', '#0a0a2a', '#001a1a']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          
          {notifications.some(n => !n.read) ? (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
              <Check size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchNotifications}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={60} color={COLORS.textDim} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>You don&apos;t have any notifications at the moment.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h2,
    color: '#fff',
    fontWeight: 'bold',
  },
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  unreadCard: {
    borderColor: 'rgba(0, 240, 255, 0.15)',
    backgroundColor: 'rgba(0, 240, 255, 0.02)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...FONTS.body1,
    fontWeight: '600',
    color: COLORS.textDim,
    fontSize: 15,
    maxWidth: width * 0.45,
  },
  unreadText: {
    color: '#fff',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textDim,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.textDim,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.3,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...FONTS.body2,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
