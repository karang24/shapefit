import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { bodyMetricsApi, dashboardApi, progressionApi } from '../api/endpoints';
import { BodyMetric, DashboardSummary, GoalProfileState, WeeklyMissionSummary } from '../types';
import ProgressCard from '../components/ProgressCard';
import MetricCard from '../components/MetricCard';

type RootStackParamList = {
  GoalSetup: undefined;
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

type TrendType = 'weight' | 'waist';

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [dashboard, setDashboard] = useState<DashboardSummary>({
    sessions_this_week: 0,
    latest_weight: null,
    latest_waist: null,
    rank: 'F',
    next_rank: 'E',
    total_exp: 0,
    exp_to_next_rank: 500,
    rank_progress_percent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [goalProfile, setGoalProfile] = useState<GoalProfileState | null>(null);
  const [weeklyMission, setWeeklyMission] = useState<WeeklyMissionSummary | null>(null);
  const [bodyHistory, setBodyHistory] = useState<BodyMetric[]>([]);
  const [trendType, setTrendType] = useState<TrendType>('weight');
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { mode, colors, toggleTheme } = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      const [dashboardData, goalData, metricData] = await Promise.all([
        dashboardApi.getSummary(),
        progressionApi.getGoalProfile(),
        bodyMetricsApi.getAll(),
      ]);

      setDashboard(dashboardData);
      setGoalProfile(goalData);
      setBodyHistory(metricData);

      if (goalData.has_profile) {
        const mission = await progressionApi.getCurrentWeeklyMission();
        setWeeklyMission(mission);
      } else {
        setWeeklyMission(null);
      }
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

  const trendSeries = useMemo(() => {
    const sorted = [...bodyHistory].sort((a, b) => a.date.localeCompare(b.date));
    const mapped = sorted
      .map((item) => ({
        date: item.date,
        value: trendType === 'weight' ? item.weight_kg : (item.waist_cm ?? null),
      }))
      .filter((item) => item.value !== null) as Array<{ date: string; value: number }>;

    return mapped.slice(-8);
  }, [bodyHistory, trendType]);

  const trendMeta = useMemo(() => {
    if (trendSeries.length === 0) {
      return {
        min: 0,
        max: 1,
        changeText: 'Belum ada data.',
      };
    }

    const values = trendSeries.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;

    let changeText = 'Stabil';
    if (diff > 0) changeText = `Naik ${diff.toFixed(1)} ${trendType === 'weight' ? 'kg' : 'cm'}`;
    if (diff < 0) changeText = `Turun ${Math.abs(diff).toFixed(1)} ${trendType === 'weight' ? 'kg' : 'cm'}`;

    return {
      min,
      max,
      changeText,
    };
  }, [trendSeries, trendType]);

  const firstName = user?.name?.split(' ')[0] ?? 'Athlete';
  const isCoach = user?.role === 'coach';

  const sidebarItems: Array<{ label: string; onPress: () => void }> = [
    { label: isCoach ? 'QR Coach' : 'Pindai QR', onPress: () => navigation.navigate(isCoach ? 'CoachQR' : 'QRScanner') },
    { label: 'Mulai Latihan', onPress: () => navigation.navigate('AddExercise', { sessionId: 0 }) },
    { label: 'Metrik Tubuh', onPress: () => navigation.navigate('BodyMetrics') },
    { label: 'Riwayat', onPress: () => navigation.navigate('History') },
    { label: 'Target Kalori', onPress: () => navigation.navigate('CalorieTarget') },
    { label: 'Food AI', onPress: () => navigation.navigate('FoodAI') },
    { label: 'BLE Scale', onPress: () => navigation.navigate('BleScale') },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
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
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setMenuOpen(true)}
          >
            <Ionicons name="menu" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.welcomeWrap}>
            <Text style={[styles.welcomePrefix, { color: mode === 'light' ? '#1B2952' : '#2F73C8' }]}>Welcome, </Text>
            <Text style={[styles.welcomeName, { color: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}>{firstName}!</Text>
          </View>
          <TouchableOpacity
            style={[styles.modeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
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

        <View style={[styles.trendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.trendTitle, { color: colors.textPrimary }]}>Grafik History</Text>
          <View style={styles.trendSwitchRow}>
            <TouchableOpacity
              style={[styles.trendPill, trendType === 'weight' && styles.trendPillActive]}
              onPress={() => setTrendType('weight')}
            >
              <Text style={styles.trendPillText}>Berat Badan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.trendPill, trendType === 'waist' && styles.trendPillActive]}
              onPress={() => setTrendType('waist')}
            >
              <Text style={styles.trendPillText}>Lingkar Perut</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartArea}>
            {trendSeries.length === 0 ? (
              <Text style={[styles.noChartText, { color: colors.textSecondary }]}>Belum ada data untuk ditampilkan.</Text>
            ) : (
              trendSeries.map((point, index) => {
                const range = Math.max(trendMeta.max - trendMeta.min, 1);
                const pct = ((point.value - trendMeta.min) / range) * 100;
                const height = Math.max(10, Math.round((pct / 100) * 120));
                return (
                  <View key={`${point.date}-${index}`} style={styles.chartBarWrap}>
                    <View style={[styles.chartBar, { height, backgroundColor: trendType === 'weight' ? '#2A86FF' : '#FF9D4D' }]} />
                  </View>
                );
              })
            )}
          </View>

          <Text style={[styles.trendHint, { color: colors.textSecondary }]}>Trend: {trendMeta.changeText}</Text>
        </View>

        {!goalProfile?.has_profile ? (
          <View style={[styles.goalCtaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.goalCtaTitle, { color: colors.textPrimary }]}>Set Goal Dulu</Text>
            <Text style={[styles.goalCtaText, { color: colors.textSecondary }]}>Isi goal profile untuk mengaktifkan misi mingguan dan bonus EXP checklist.</Text>
            <TouchableOpacity
              style={[styles.goalCtaButton, { backgroundColor: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}
              onPress={() => navigation.navigate('GoalSetup')}
            >
              <Text style={styles.goalCtaButtonText}>Atur Goal</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {goalProfile?.has_profile && weeklyMission ? (
          <View style={[styles.missionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.missionTitle, { color: colors.textPrimary }]}>Misi Mingguan</Text>
            <Text style={[styles.missionSub, { color: colors.textSecondary }]}>{weeklyMission.week_start} s/d {weeklyMission.week_end}</Text>
            {weeklyMission.checklist.map((item) => (
              <Text key={item.item_key} style={[styles.missionItem, { color: colors.textPrimary }]}>[{item.completed ? 'x' : ' '}] {item.title} ({item.progress}/{item.target})</Text>
            ))}
            <Text style={[styles.missionBonus, { color: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}>Bonus minggu ini: +{weeklyMission.total_bonus_exp} EXP</Text>
          </View>
        ) : null}

        <View style={[styles.rankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.rankTitle, { color: colors.textPrimary }]}>Rank Training</Text>
          <View style={styles.rankRow}>
            <Text style={[styles.rankBadge, { color: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}>Rank {dashboard.rank}</Text>
            <Text style={[styles.rankExpText, { color: colors.textSecondary }]}>{dashboard.total_exp} EXP</Text>
          </View>
          <View style={[styles.rankProgressTrack, { backgroundColor: mode === 'light' ? '#E6ECF4' : '#242B3A' }]}>
            <View
              style={[
                styles.rankProgressFill,
                {
                  width: `${Math.max(0, Math.min(dashboard.rank_progress_percent, 100))}%`,
                  backgroundColor: mode === 'light' ? '#2A86FF' : '#2BE572',
                },
              ]}
            />
          </View>
          <Text style={[styles.rankHint, { color: colors.textSecondary }]}>
            {dashboard.next_rank ? `${dashboard.exp_to_next_rank} EXP lagi menuju Rank ${dashboard.next_rank}` : 'Rank maksimal tercapai'}
          </Text>
        </View>

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
      </ScrollView>

      {menuOpen ? (
        <View style={styles.sideMenuLayer}>
          <View style={[styles.sideMenuPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sideMenuTitle, { color: colors.textPrimary }]}>Menu</Text>
            {sidebarItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.sideMenuItem}
                onPress={() => {
                  setMenuOpen(false);
                  item.onPress();
                }}
              >
                <Text style={[styles.sideMenuItemText, { color: colors.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.sideMenuItem, styles.sideMenuDanger]}
              onPress={async () => {
                setMenuOpen(false);
                await handleLogout();
              }}
            >
              <Text style={styles.sideMenuDangerText}>Keluar dari Aplikasi</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sideMenuBackdrop} onPress={() => setMenuOpen(false)} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
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
  menuButton: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  welcomeWrap: {
    flex: 1,
    marginLeft: 12,
  },
  welcomePrefix: {
    fontSize: 24,
    fontWeight: '800',
  },
  welcomeName: {
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
  },
  modeToggle: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  rankCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  trendCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  trendSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  trendPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#D8E7FA',
  },
  trendPillActive: {
    backgroundColor: '#2A86FF',
  },
  trendPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#123A73',
  },
  chartArea: {
    height: 130,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: 14,
    borderRadius: 6,
  },
  noChartText: {
    fontSize: 12,
  },
  trendHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  missionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  missionSub: {
    fontSize: 12,
    marginBottom: 8,
  },
  missionItem: {
    fontSize: 13,
    marginBottom: 5,
  },
  missionBonus: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
  },
  goalCtaCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  goalCtaTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  goalCtaText: {
    fontSize: 13,
    marginBottom: 10,
  },
  goalCtaButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  goalCtaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  rankTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    fontSize: 24,
    fontWeight: '800',
  },
  rankExpText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rankProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  rankProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  rankHint: {
    fontSize: 12,
    fontWeight: '600',
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
  sideMenuLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  sideMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sideMenuPanel: {
    width: 260,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sideMenuTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  sideMenuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE5EF',
  },
  sideMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sideMenuDanger: {
    marginTop: 10,
    borderBottomWidth: 0,
  },
  sideMenuDangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E25252',
  },
});

export default DashboardScreen;
