import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { CustomButton } from '../../components/common/CustomButton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(1));

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await logout(); } catch { Alert.alert('Error', 'Failed to logout.'); }
        },
      },
    ]);
  };

  const profileMenuItems = [
    { icon: 'person-outline' as const, label: 'Edit Profile', color: Colors.primary },
    { icon: 'notifications-outline' as const, label: 'Notifications', color: '#F59E0B' },
    { icon: 'lock-closed-outline' as const, label: 'Change Password', color: '#EF4444' },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', color: '#10B981' },
    { icon: 'information-circle-outline' as const, label: 'About Crammer+', color: '#8B5CF6' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.full_name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.rolePill}>
            <Ionicons
              name={user.role === 'student' ? 'school' : user.role === 'mentor' ? 'people' : 'shield-checkmark'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.roleText}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Study Hours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Files</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>78%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        {profileMenuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => Alert.alert(item.label, 'This feature will be available soon!')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <CustomButton title="Logout" onPress={handleLogout} variant="outline" />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBg: {
    backgroundColor: '#2563EB',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl + 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Shadows.large,
  },
  avatarContainer: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.text.primary },
  statLabel: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  menuSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  menuIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.text.primary },
  logoutSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
});
