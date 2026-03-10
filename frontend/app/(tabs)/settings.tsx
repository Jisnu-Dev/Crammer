import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';
import { useAuth } from '../../contexts/AuthContext';

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  type: 'toggle' | 'nav' | 'danger';
  key: string;
}

const settingSections: { title: string; items: SettingItem[] }[] = [
  {
    title: 'Preferences',
    items: [
      { icon: 'moon-outline', label: 'Dark Mode', type: 'toggle', key: 'darkMode' },
      { icon: 'notifications-outline', label: 'Push Notifications', type: 'toggle', key: 'pushNotifications' },
      { icon: 'mail-outline', label: 'Email Notifications', type: 'toggle', key: 'emailNotifications' },
      { icon: 'volume-high-outline', label: 'Sound Effects', type: 'toggle', key: 'sound' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', type: 'nav', key: 'editProfile' },
      { icon: 'lock-closed-outline', label: 'Change Password', type: 'nav', key: 'changePassword' },
      { icon: 'language-outline', label: 'Language', type: 'nav', key: 'language' },
      { icon: 'cloud-download-outline', label: 'Download Data', type: 'nav', key: 'downloadData' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help & FAQ', type: 'nav', key: 'help' },
      { icon: 'chatbubble-outline', label: 'Contact Support', type: 'nav', key: 'contact' },
      { icon: 'star-outline', label: 'Rate the App', type: 'nav', key: 'rate' },
      { icon: 'information-circle-outline', label: 'About', type: 'nav', key: 'about' },
    ],
  },
  {
    title: 'Danger Zone',
    items: [
      { icon: 'trash-outline', label: 'Delete Account', type: 'danger', key: 'deleteAccount' },
    ],
  },
];

export default function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    darkMode: false,
    pushNotifications: true,
    emailNotifications: true,
    sound: true,
  });

  const handleToggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNav = (key: string) => {
    Alert.alert('Coming Soon', 'This feature will be available in the next update.');
  };

  const handleDanger = (key: string) => {
    if (key === 'deleteAccount') {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => {} },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your preferences</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {settingSections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.row, ii < section.items.length - 1 && styles.rowBorder]}
                  onPress={() => {
                    if (item.type === 'nav') handleNav(item.key);
                    if (item.type === 'danger') handleDanger(item.key);
                  }}
                  activeOpacity={item.type === 'toggle' ? 1 : 0.6}
                >
                  <View style={[styles.iconBox, item.type === 'danger' && { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name={item.icon} size={20} color={item.type === 'danger' ? '#EF4444' : '#64748B'} />
                  </View>
                  <Text style={[styles.rowLabel, item.type === 'danger' && { color: '#EF4444' }]}>{item.label}</Text>
                  {item.type === 'toggle' && (
                    <Switch
                      value={toggles[item.key] ?? false}
                      onValueChange={() => handleToggle(item.key)}
                      trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                      thumbColor={toggles[item.key] ? '#2563EB' : '#CBD5E1'}
                    />
                  )}
                  {item.type === 'nav' && (
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  )}
                  {item.type === 'danger' && (
                    <Ionicons name="chevron-forward" size={18} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>Crammer+ v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerBg: {
    backgroundColor: '#475569',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.large,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginLeft: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text.primary },
  logoutBtn: {
    backgroundColor: '#EF4444',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.small,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  version: { textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: Spacing.lg },
});
