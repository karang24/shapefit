import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type RootStackParamList = {
  CoachQR: undefined;
  Dashboard: undefined;
};

type CoachQRScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CoachQR'>;

interface Props {
  navigation: CoachQRScreenNavigationProp;
}

const CoachQRScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { user } = useAuth();
  const { mode, colors } = useTheme();

  const qrUri = useMemo(() => `${API_BASE_URL}/api/coach-qr?ts=${Date.now()}-${refreshToken}`, [refreshToken]);

  const refreshQr = () => {
    setLoading(true);
    setFailed(false);
    setRefreshToken((prev) => prev + 1);
  };

  if (user?.role !== 'coach') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Halaman ini khusus coach.</Text>
        <TouchableOpacity style={[styles.backButton, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.textPrimary }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}>QR Session Coach</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        QR di-generate otomatis saat akun coach login.
      </Text>

      <View
        style={[
          styles.qrCard,
          {
            backgroundColor: colors.surface,
            borderColor: mode === 'light' ? '#9FD8FF' : '#2BE572',
            shadowColor: mode === 'light' ? '#9FD8FF' : '#2BE572',
          },
        ]}
      >
        {loading && <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />}
        <Image
          source={{ uri: qrUri }}
          style={styles.qrImage}
          resizeMode="contain"
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      </View>

      {failed && <Text style={[styles.errorText, { color: '#FF6A6A' }]}>QR belum tersedia. Coba refresh.</Text>}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: mode === 'light' ? '#EAF4FF' : '#122139',
              borderColor: colors.border,
            },
          ]}
          onPress={refreshQr}
        >
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Refresh QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: mode === 'light' ? '#FFECEC' : '#2D1717',
              borderColor: '#FF6A6A',
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.actionText, { color: '#FF6A6A' }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrCard: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  qrImage: {
    width: '86%',
    height: '86%',
  },
  loader: {
    position: 'absolute',
  },
  actions: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CoachQRScreen;

