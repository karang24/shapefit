import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardApi } from '../api/endpoints';
import { DashboardSummary } from '../types';
import ProgressCard from '../components/ProgressCard';
import MetricCard from '../components/MetricCard';
import QuickActionButton from '../components/QuickActionButton';

type RootStackParamList = {
  Dashboard: undefined;
  QRScanner: undefined;
  CoachQR: undefined;
  AddExercise: { sessionId: number };
  BodyMetrics: undefined;
  CalorieTarget: undefined;
  FoodAI: undefined;
  BleScale: undefined;
  History: undefined;
  Auth: undefined;
};

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [dashboard, setDashboard] = useState<DashboardSummary>({
    sessions_this_week: 0,
    latest_weight: null,
    latest_waist: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { mode, colors, toggleTheme } = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      const data = await dashboardApi.getSummary();
      setDashboard(data);
      setLoadError(null);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoadError('Gagal memuat dashboard. Cek koneksi backend lalu tarik ke bawah untuk refresh.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Auth');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>Loading dashboard...</Text>
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'Athlete';
  const isCoach = user?.role === 'coach';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.brandRow}>
        <View style={[styles.brandBadge, { backgroundColor: mode === 'light' ? '#FFEAEA' : '#2A1C22' }]}>
          <Ionicons name="play" size={11} color="#EF4D4D" />
        </View>
        <View style={[styles.brandBadge, { backgroundColor: mode === 'light' ? '#ECFFF1' : '#183223' }]}>
          <MaterialCommunityIcons name="dumbbell" size={11} color="#36C466" />
        </View>
      </View>

      <View style={[styles.topGlow, { backgroundColor: mode === 'light' ? '#DBEDFF' : '#10243A' }]} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomePrefix, { color: mode === 'light' ? '#1B2952' : '#2F73C8' }]}>Welcome, </Text>
          <Text style={[styles.welcomeName, { color: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}>{firstName}!</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.modeToggle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleTheme}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{mode === 'light' ? 'Dark' : 'Light'}</Text>
        </TouchableOpacity>
      </View>

      {loadError ? (
        <View style={[styles.errorBanner, { backgroundColor: mode === 'light' ? '#FFECEF' : '#3A1C25', borderColor: '#FF8DA1' }]}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      <ProgressCard title="Latihan minggu ini" current={dashboard.sessions_this_week} target={3} />

      <View style={styles.metricsRow}>
        <MetricCard
          title="Berat badan"
          value={dashboard.latest_weight?.toString() || '-'}
          unit="kg"
          decorationIcon={<MaterialCommunityIcons name="weight-kilogram" size={42} color={mode === 'light' ? '#5CA7E5' : '#7DDAFF'} />}
        />
        <MetricCard
          title="Lingkar perut"
          value={dashboard.latest_waist?.toString() || '-'}
          unit="cm"
          decorationIcon={<MaterialCommunityIcons name="tape-measure" size={42} color={mode === 'light' ? '#5CA7E5' : '#7DDAFF'} />}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <QuickActionButton
          title={isCoach ? 'QR COACH' : 'PINDAI QR'}
          icon={<MaterialCommunityIcons name="qrcode-scan" size={28} color="#4DDB66" />}
          onPress={() => navigation.navigate(isCoach ? 'CoachQR' : 'QRScanner')}
          color="#4DDB66"
        />
        <QuickActionButton
          title="MULAI LATIHAN"
          icon={<MaterialCommunityIcons name="arm-flex" size={28} color="#45A9FF" />}
          onPress={() => navigation.navigate('AddExercise', { sessionId: 0 })}
          color="#45A9FF"
        />
        <QuickActionButton
          title="METRIK TUBUH"
          icon={<Feather name="bar-chart-2" size={26} color="#FFB347" />}
          onPress={() => navigation.navigate('BodyMetrics')}
          color="#FFB347"
        />
        <QuickActionButton
          title="RIWAYAT"
          icon={<Ionicons name="clipboard-outline" size={26} color="#CF73FF" />}
          onPress={() => navigation.navigate('History')}
          color="#CF73FF"
        />
      </View>

      <View style={styles.secondaryActionRow}>
        <View style={styles.secondaryButtonsWrap}>
          <QuickActionButton
            title="TARGET KALORI"
            icon={<Feather name="target" size={24} color="#3EC8A5" />}
            onPress={() => navigation.navigate('CalorieTarget')}
            color="#3EC8A5"
            variant="compact"
          />
          <QuickActionButton
            title="FOOD AI"
            icon={<MaterialCommunityIcons name="food-apple" size={24} color="#FF9D4D" />}
            onPress={() => navigation.navigate('FoodAI')}
            color="#FF9D4D"
            variant="compact"
          />
        </View>
      </View>

      <View style={styles.secondaryActionRow}>
        <QuickActionButton
          title="BLE SCALE"
          icon={<MaterialCommunityIcons name="bluetooth-connect" size={24} color="#4D8DFF" />}
          onPress={() => navigation.navigate('BleScale')}
          color="#4D8DFF"
          variant="compact"
        />
      </View>

      <View style={styles.footer}>
        <QuickActionButton
          title="KELUAR DARI APLIKASI"
          icon={<Feather name="log-out" size={24} color="#FF6A6A" />}
          onPress={handleLogout}
          color="#FF6A6A"
          variant="compact"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 10,
    paddingBottom: 28,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginBottom: 8,
  },
  brandBadge: {
    width: 20,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGlow: {
    position: 'absolute',
    width: 260,
    height: 160,
    borderRadius: 130,
    alignSelf: 'center',
    top: -48,
    opacity: 0.35,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomePrefix: {
    fontSize: 24,
    fontWeight: '800',
  },
  welcomeName: {
    fontSize: 46,
    fontWeight: '800',
    lineHeight: 48,
  },
  modeToggle: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  secondaryActionRow: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonsWrap: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#FF6A86',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});

export default DashboardScreen;
