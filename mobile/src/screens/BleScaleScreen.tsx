import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { bodyMetricsApi } from '../api/endpoints';

type RootStackParamList = {
  BleScale: undefined;
  Dashboard: undefined;
};

type BleScaleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BleScale'>;

interface Props {
  navigation: BleScaleScreenNavigationProp;
}

type ScaleDevice = {
  id: string;
  name: string;
  rssi: number | null;
};

type ScaleMetrics = {
  weightKg?: number;
  bodyFatPercent?: number;
  musclePercent?: number;
  bodyWaterPercent?: number;
  bmrKcal?: number;
  impedanceOhm?: number;
  bmi?: number;
};

const TARGET_NAME_HINTS = ['okok', 'gasbord', 'scale', 'cf', 'health'];

const formatNow = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

const base64ToBytes = (value: string): number[] => {
  try {
    const atobFn = (global as any).atob;
    if (!atobFn) {
      return [];
    }
    const binary = atobFn(value);
    const bytes: number[] = [];
    for (let i = 0; i < binary.length; i += 1) {
      bytes.push(binary.charCodeAt(i));
    }
    return bytes;
  } catch {
    return [];
  }
};

const bytesToHex = (bytes: number[]) => bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');

const u16le = (bytes: number[], offset: number): number => {
  if (offset + 1 >= bytes.length) return 0;
  return bytes[offset] | (bytes[offset + 1] << 8);
};

const tryParseWeightKg = (bytes: number[]): number | null => {
  if (bytes.length < 2) return null;
  const littleEndianRaw = bytes[0] | (bytes[1] << 8);
  const bigEndianRaw = (bytes[0] << 8) | bytes[1];
  const candidates = [littleEndianRaw / 100, bigEndianRaw / 100, littleEndianRaw / 10, bigEndianRaw / 10];
  for (const value of candidates) {
    if (value >= 20 && value <= 300) {
      return Number(value.toFixed(2));
    }
  }
  return null;
};

const parseWeightScaleMeasurement = (bytes: number[]): ScaleMetrics | null => {
  if (bytes.length < 3) return null;
  const flags = bytes[0];
  const isImperial = (flags & 0x01) !== 0;
  const hasTimestamp = (flags & 0x02) !== 0;
  const hasUserId = (flags & 0x04) !== 0;
  const hasBmiAndHeight = (flags & 0x08) !== 0;

  let index = 1;
  const rawWeight = u16le(bytes, index);
  index += 2;

  let weightKg: number;
  if (isImperial) {
    const lb = rawWeight / 100;
    weightKg = lb * 0.45359237;
  } else {
    // Most BLE scales use 0.005 kg resolution (raw / 200)
    weightKg = rawWeight / 200;
    if (weightKg < 20 || weightKg > 300) {
      weightKg = rawWeight / 100;
    }
  }

  if (hasTimestamp) index += 7;
  if (hasUserId) index += 1;

  let bmi: number | undefined;
  if (hasBmiAndHeight && index + 3 < bytes.length) {
    bmi = Number((u16le(bytes, index) / 10).toFixed(1));
  }

  if (weightKg < 20 || weightKg > 300) return null;
  return { weightKg: Number(weightKg.toFixed(2)), bmi };
};

const parseBodyCompositionMeasurement = (bytes: number[]): ScaleMetrics | null => {
  // Based on standard BLE Body Composition Measurement (0x2A9C) with optional fields.
  if (bytes.length < 4) return null;
  const flags = u16le(bytes, 0);
  let index = 2;

  if (index + 1 >= bytes.length) return null;
  const metrics: ScaleMetrics = {
    bodyFatPercent: Number((u16le(bytes, index) / 10).toFixed(1)),
  };
  index += 2;

  if ((flags & 0x0002) !== 0) index += 7; // timestamp
  if ((flags & 0x0004) !== 0) index += 1; // user id
  if ((flags & 0x0008) !== 0 && index + 1 < bytes.length) {
    metrics.bmrKcal = u16le(bytes, index);
    index += 2;
  }
  if ((flags & 0x0010) !== 0 && index + 1 < bytes.length) {
    metrics.musclePercent = Number((u16le(bytes, index) / 10).toFixed(1));
    index += 2;
  }
  if ((flags & 0x0080) !== 0 && index + 1 < bytes.length) {
    // Body water mass in kg (common implementation raw/10). Convert to percent if weight available later.
    const waterMassKg = u16le(bytes, index) / 10;
    if (metrics.weightKg && metrics.weightKg > 0) {
      metrics.bodyWaterPercent = Number(((waterMassKg / metrics.weightKg) * 100).toFixed(1));
    }
    index += 2;
  }
  if ((flags & 0x0200) !== 0 && index + 1 < bytes.length) {
    metrics.impedanceOhm = u16le(bytes, index);
    index += 2;
  }
  if ((flags & 0x0400) !== 0 && index + 1 < bytes.length) {
    const rawWeight = u16le(bytes, index);
    const parsedWeight = rawWeight / 200;
    if (parsedWeight >= 20 && parsedWeight <= 300) {
      metrics.weightKg = Number(parsedWeight.toFixed(2));
    }
  }

  return metrics;
};

const BleScaleScreen: React.FC<Props> = ({ navigation }) => {
  const { mode, colors } = useTheme();
  const managerRef = useRef<BleManager | null>(null);
  const monitorSubsRef = useRef<Subscription[]>([]);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [scanning, setScanning] = useState(false);
  const [permissionReady, setPermissionReady] = useState(false);
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connected, setConnected] = useState<Device | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<ScaleMetrics>({});
  const [savingWeight, setSavingWeight] = useState(false);

  const isConnected = useMemo(() => Boolean(connected), [connected]);

  const addLog = useCallback((message: string) => {
    const line = `[${formatNow()}] ${message}`;
    setLogs((prev) => [line, ...prev].slice(0, 80));
  }, []);

  const clearMonitorSubscriptions = () => {
    monitorSubsRef.current.forEach((sub) => sub.remove());
    monitorSubsRef.current = [];
  };

  const stopScan = useCallback(() => {
    const manager = managerRef.current;
    if (!manager) return;
    manager.stopDeviceScan();
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    setScanning(false);
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setPermissionReady(true);
      return true;
    }

    try {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        const granted =
          result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
          result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        setPermissionReady(granted);
        if (!granted) addLog('Izin BLE belum diberikan.');
        return granted;
      }

      const location = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      const granted = location === PermissionsAndroid.RESULTS.GRANTED;
      setPermissionReady(granted);
      if (!granted) addLog('Izin lokasi diperlukan untuk scan BLE.');
      return granted;
    } catch (error) {
      addLog(`Gagal request permission: ${String(error)}`);
      setPermissionReady(false);
      return false;
    }
  }, [addLog]);

  useEffect(() => {
    managerRef.current = new BleManager();
    requestPermissions();
    return () => {
      stopScan();
      clearMonitorSubscriptions();
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, [requestPermissions, stopScan]);

  const startScan = async () => {
    const manager = managerRef.current;
    if (!manager || scanning) return;

    const granted = await requestPermissions();
    if (!granted) return;

    setDevices([]);
    setScanning(true);
    addLog('Memulai scan BLE...');

    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        addLog(`Scan error: ${error.message}`);
        stopScan();
        return;
      }
      if (!device) return;

      const rawName = (device.name || device.localName || '').trim();
      if (!rawName) return;
      const normalized = rawName.toLowerCase();
      const isTarget = TARGET_NAME_HINTS.some((hint) => normalized.includes(hint));
      if (!isTarget) return;

      setDevices((prev) => {
        const exists = prev.find((d) => d.id === device.id);
        if (exists) return prev.map((d) => (d.id === device.id ? { ...d, rssi: device.rssi ?? null, name: rawName } : d));
        addLog(`Device ditemukan: ${rawName} (${device.id})`);
        return [...prev, { id: device.id, name: rawName, rssi: device.rssi ?? null }];
      });
    });

    scanTimeoutRef.current = setTimeout(() => {
      stopScan();
      addLog('Scan selesai (timeout 15 detik).');
    }, 15000);
  };

  const connectToDevice = async (deviceId: string) => {
    const manager = managerRef.current;
    if (!manager) return;
    setConnectingId(deviceId);
    stopScan();
    clearMonitorSubscriptions();
    setMetrics({});

    try {
      addLog(`Menghubungkan ke device ${deviceId}...`);
      const connectedDevice = await manager.connectToDevice(deviceId, { autoConnect: false });
      await connectedDevice.discoverAllServicesAndCharacteristics();
      setConnected(connectedDevice);
      addLog(`Terhubung: ${connectedDevice.name || connectedDevice.localName || connectedDevice.id}`);

      const services = await connectedDevice.services();
      addLog(`Service count: ${services.length}`);

      for (const service of services) {
        const characteristics = await connectedDevice.characteristicsForService(service.uuid);
        for (const char of characteristics) {
          if (!char.isNotifiable && !char.isIndicatable) continue;
          const sub = connectedDevice.monitorCharacteristicForService(
            service.uuid,
            char.uuid,
            (error, characteristic) => {
              if (error) {
                addLog(`Notify error ${char.uuid}: ${error.message}`);
                return;
              }
              if (!characteristic?.value) return;
              const bytes = base64ToBytes(characteristic.value);
              const hex = bytesToHex(bytes);
              const charId = char.uuid.toLowerCase();
              addLog(`Notify ${service.uuid.slice(0, 8)}/${charId.slice(0, 8)} -> ${hex}`);

              let nextMetrics: ScaleMetrics | null = null;
              if (charId.includes('2a9d')) {
                nextMetrics = parseWeightScaleMeasurement(bytes);
              } else if (charId.includes('2a9c')) {
                nextMetrics = parseBodyCompositionMeasurement(bytes);
              } else {
                const parsedWeight = tryParseWeightKg(bytes);
                if (parsedWeight) {
                  nextMetrics = { weightKg: parsedWeight };
                }
              }

              if (nextMetrics) {
                setMetrics((prev) => {
                  const merged = { ...prev, ...nextMetrics };
                  // If body water mass was parsed before weight, recalc once weight exists.
                  if (!merged.bodyWaterPercent && merged.weightKg && nextMetrics?.bodyWaterPercent) {
                    merged.bodyWaterPercent = nextMetrics.bodyWaterPercent;
                  }
                  return merged;
                });
              }
            }
          );
          monitorSubsRef.current.push(sub);
        }
      }
      addLog('Monitoring notifiable characteristics dimulai.');
    } catch (error: any) {
      addLog(`Gagal connect: ${error?.message || String(error)}`);
      setConnected(null);
    } finally {
      setConnectingId(null);
    }
  };

  const disconnect = async () => {
    try {
      clearMonitorSubscriptions();
      if (connected) {
        await connected.cancelConnection();
        addLog('Perangkat terputus.');
      }
    } catch (error: any) {
      addLog(`Disconnect error: ${error?.message || String(error)}`);
    } finally {
      setConnected(null);
    }
  };

  const saveWeightToMetrics = async () => {
    if (!metrics.weightKg) return;
    setSavingWeight(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      await bodyMetricsApi.log(metrics.weightKg, null, date);
      addLog(`Berat ${metrics.weightKg} kg disimpan ke Body Metrics.`);
    } catch (error: any) {
      addLog(`Gagal simpan berat: ${error?.response?.data?.detail || error?.message || String(error)}`);
    } finally {
      setSavingWeight(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>BLE Smart Scale</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Scan dan hubungkan Gasbord/OKOK via Bluetooth (BLE).
      </Text>

      <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
          Status: {isConnected ? 'Connected' : scanning ? 'Scanning...' : permissionReady ? 'Ready' : 'Permission needed'}
        </Text>
        {connected ? (
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
            Device: {connected.name || connected.localName || connected.id}
          </Text>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: mode === 'light' ? '#EAF4FF' : '#162B44', borderColor: colors.border }]}
          onPress={startScan}
          disabled={scanning}
        >
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>{scanning ? 'Scanning...' : 'Scan Device'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: mode === 'light' ? '#FFEDEE' : '#3A1E24', borderColor: '#FF8DA1' }]}
          onPress={disconnect}
        >
          <Text style={[styles.actionText, { color: '#FF7C95' }]}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {metrics.weightKg || metrics.bodyFatPercent || metrics.musclePercent || metrics.bodyWaterPercent || metrics.bmrKcal || metrics.impedanceOhm || metrics.bmi ? (
        <View style={[styles.weightCard, { backgroundColor: mode === 'light' ? '#F6FBFF' : colors.surfaceSoft, borderColor: colors.border }]}>
          <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>Latest metrics (detected)</Text>
          {metrics.weightKg ? (
            <Text style={[styles.weightValue, { color: mode === 'light' ? '#1D5DB8' : '#6CC0FF' }]}>{metrics.weightKg} kg</Text>
          ) : null}
          <View style={styles.metricsGrid}>
            {metrics.bodyFatPercent !== undefined ? (
              <Text style={[styles.metricSmall, { color: colors.textPrimary }]}>Body Fat: {metrics.bodyFatPercent}%</Text>
            ) : null}
            {metrics.musclePercent !== undefined ? (
              <Text style={[styles.metricSmall, { color: colors.textPrimary }]}>Muscle: {metrics.musclePercent}%</Text>
            ) : null}
            {metrics.bodyWaterPercent !== undefined ? (
              <Text style={[styles.metricSmall, { color: colors.textPrimary }]}>Body Water: {metrics.bodyWaterPercent}%</Text>
            ) : null}
            {metrics.bmrKcal !== undefined ? (
              <Text style={[styles.metricSmall, { color: colors.textPrimary }]}>BMR: {metrics.bmrKcal} kcal</Text>
            ) : null}
            {metrics.impedanceOhm !== undefined ? (
              <Text style={[styles.metricSmall, { color: colors.textPrimary }]}>Impedance: {metrics.impedanceOhm} ohm</Text>
            ) : null}
            {metrics.bmi !== undefined ? (
              <Text style={[styles.metricSmall, { color: colors.textPrimary }]}>BMI: {metrics.bmi}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: mode === 'light' ? '#2A86FF' : '#3B9CFF' }]}
            onPress={saveWeightToMetrics}
            disabled={savingWeight || !metrics.weightKg}
          >
            {savingWeight ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Simpan ke Body Metrics</Text>
            )}
          </TouchableOpacity>
          <Text style={[styles.parseHint, { color: colors.textSecondary }]}>
            Catatan: metrik selain berat tergantung dukungan protokol dari scale (UUID 0x2A9C/format vendor).
          </Text>
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Devices</Text>
      {devices.length === 0 ? (
        <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Belum ada device target ditemukan.</Text>
      ) : (
        devices.map((device) => (
          <View key={device.id} style={[styles.deviceRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{device.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{device.id}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>RSSI: {device.rssi ?? '-'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.connectBtn, { borderColor: colors.border, backgroundColor: mode === 'light' ? '#ECFFF4' : '#173727' }]}
              onPress={() => connectToDevice(device.id)}
              disabled={Boolean(connectingId)}
            >
              <Text style={{ color: '#39C16D', fontWeight: '700' }}>
                {connectingId === device.id ? 'Connecting...' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>BLE Logs</Text>
      <View style={[styles.logsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {logs.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>Belum ada log.</Text>
        ) : (
          logs.map((line, idx) => (
            <Text key={`${idx}-${line}`} style={[styles.logLine, { color: colors.textSecondary }]}>
              {line}
            </Text>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Kembali ke Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontWeight: '700',
  },
  weightCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  weightLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  weightValue: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 34,
    fontWeight: '800',
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  metricsGrid: {
    marginBottom: 8,
    gap: 2,
  },
  metricSmall: {
    fontSize: 13,
    fontWeight: '600',
  },
  parseHint: {
    marginTop: 6,
    fontSize: 11,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '800',
  },
  deviceRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connectBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  logsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    minHeight: 140,
  },
  logLine: {
    fontSize: 11,
    marginBottom: 4,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default BleScaleScreen;
