import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { sessionsApi } from '../api/endpoints';

type RootStackParamList = {
  QRScanner: undefined;
  AddExercise: { sessionId: number };
  Dashboard: undefined;
};

type QRScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRScanner'>;

interface Props {
  navigation: QRScannerScreenNavigationProp;
}

const QRScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);
    
    try {
      const session = await sessionsApi.start(data);
      Alert.alert(
        'Session Started',
        'Your workout session has been started!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('AddExercise', { sessionId: session.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to start session',
        [
          {
            text: 'Retry',
            onPress: () => setScanned(false),
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.instructionText}>
          {scanned ? 'Scanning...' : 'Scan the coach QR code'}
        </Text>
        {scanned && (
          <TouchableOpacity style={styles.retryButton} onPress={() => setScanned(false)}>
            <Text style={styles.retryButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
  },
});

export default QRScannerScreen;
