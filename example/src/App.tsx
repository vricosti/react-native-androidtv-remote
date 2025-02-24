import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PairingDialog } from './components/PairingDialog';
import { AndroidRemote, RemoteKeyCode, RemoteDirection } from 'react-native-androidtv-remote';
import { GoogleCastDiscovery, DeviceInfo } from './services/GoogleCastDiscovery';

function App(): React.JSX.Element {
  const [connectionStatuses, setConnectionStatuses] = useState<{ [host: string]: string }>({});
  const [showPairingDialog, setShowPairingDialog] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  const androidRemotesRef = useRef<Map<string, AndroidRemote>>(new Map());
  const discoveryRef = useRef<GoogleCastDiscovery | null>(null);
  const certificateRef = useRef<Map<string, { key: string | null; cert: string | null }>>(new Map());

  useEffect(() => {
    console.log('useEffect({}, []');
    discoveryRef.current = new GoogleCastDiscovery();
    return () => {
      androidRemotesRef.current.forEach((remote) => remote.stop());
      androidRemotesRef.current.clear();
      discoveryRef.current?.stop();
    };
  }, []);

  const handleScan = async () => {
    console.log('handleScan()');
    if (!discoveryRef.current) return;

    setScanning(true);
    setDevices([]);
    setSelectedDevice('');

    try {
      const results = await discoveryRef.current.scan();
      setDevices(results.devices);
      if (results.devices.length > 0) {
        setSelectedDevice(results.devices[0].host || '');
      }
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to discover devices');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = () => {
    console.log('handleConnect()');
    if (!selectedDevice) {
      Alert.alert('Error', 'Please select a device first');
      return;
    }

    const currentStatus = connectionStatuses[selectedDevice] || 'Disconnected';
    if (currentStatus === 'Connected') {
      const remote = androidRemotesRef.current.get(selectedDevice);
      if (remote) {
        remote.stop();
        androidRemotesRef.current.delete(selectedDevice);
        setConnectionStatuses((prev) => ({ ...prev, [selectedDevice]: 'Disconnected' }));
      }
      return;
    }

    const options = {
      pairing_port: 6467,
      remote_port: 6466,
      service_name: 'com.vricosti.androidtv.example',
      systeminfo: {
        manufacturer: 'default-manufacturer',
        model: 'default-model',
      },
      cert: {
        key: certificateRef.current.get(selectedDevice)?.key || null,
        cert: certificateRef.current.get(selectedDevice)?.cert || null,
        androidKeyStore: 'AndroidKeyStore',
        certAlias: 'remotectl-atv-cert',
        keyAlias: 'remotectl-atv',
      },
    };

    const androidRemote = new AndroidRemote(selectedDevice, options);
    androidRemotesRef.current.set(selectedDevice, androidRemote);

    androidRemote.on('secret', () => {
      setShowPairingDialog(true);
      setConnectionStatuses((prev) => ({ ...prev, [selectedDevice]: 'Pairing Needed' }));
    });

    androidRemote.on('ready', () => {
      const cert = androidRemote.getCertificate();
      if (cert && cert.key && cert.cert) {
        certificateRef.current.set(selectedDevice, cert);
      }
      setConnectionStatuses((prev) => ({ ...prev, [selectedDevice]: 'Connected' }));
      Alert.alert("Connected", `Remote is ready for ${selectedDevice}`);
    });

    androidRemote.on('error', (error: Error) => {
      Alert.alert("Error", error.toString());
    });

    androidRemote.on('unpaired', () => {
      setConnectionStatuses((prev) => ({ ...prev, [selectedDevice]: 'Unpaired' }));
      Alert.alert("Unpaired", `The device ${selectedDevice} has been unpaired`);
    });

    androidRemote.start().catch((error: Error) => {
      Alert.alert("Connection Error", error.message);
    });
  };

  const handlePairingCodeSubmit = async (pairingCode: string | null) => {
    console.log('entering handlePairingCodeSubmit()');
    if (!selectedDevice || !androidRemotesRef.current.has(selectedDevice)) return;

    const remote = androidRemotesRef.current.get(selectedDevice);
    if (!remote) return;

    if (pairingCode === null) {
      console.log('before cancelPairing()');
      await remote.cancelPairing();
      setShowPairingDialog(false);
      remote.stop();
      androidRemotesRef.current.delete(selectedDevice);
      setConnectionStatuses((prev) => ({ ...prev, [selectedDevice]: 'Disconnected' }));
      return;
    }

    try {
      console.log('before sendPairingCode()');
      await remote.sendPairingCode(pairingCode);
      setShowPairingDialog(false);
    } catch (error) {
      console.error('Error during pairing:', error);
      setShowPairingDialog(false);
    }
  };

  const handleCommandSend = (cmd) => {
    console.log('handleCommandSend()');
    if (!selectedDevice || !androidRemotesRef.current.has(selectedDevice)) return;
    const remote = androidRemotesRef.current.get(selectedDevice);
    if (!remote) return;
    console.log('before sendKey()');
    remote.sendKey(RemoteKeyCode[cmd], RemoteDirection.SHORT);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.statusText}>Status: {connectionStatuses[selectedDevice] || 'Disconnected'}</Text>

      <Button title="Search Devices" onPress={handleScan} />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedDevice}
          onValueChange={(itemValue) => setSelectedDevice(itemValue)}
          style={styles.picker}
          enabled={!scanning && devices.length > 0}
        >
          {devices.length === 0 ? (
            <Picker.Item label="No devices found" value="" />
          ) : (
            devices.map((device) => (
              <Picker.Item key={device.host} label={device.name} value={device.host} />
            ))
          )}
        </Picker>
      </View>

      <Button
        title={connectionStatuses[selectedDevice] === 'Connected' ? 'Disconnect' : 'Connect'}
        onPress={handleConnect}
        disabled={!selectedDevice || connectionStatuses[selectedDevice] === 'Pairing Needed'}
      />

      <View style={styles.buttonSpacer} />
      <Button
        title="Mute"
        onPress={() => handleCommandSend('KEYCODE_MUTE')}
        disabled={connectionStatuses[selectedDevice] !== 'Connected'}
      />

      <Modal visible={scanning} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.scanningText}>Scanning for devices...</Text>
          </View>
        </View>
      </Modal>

      <PairingDialog
        visible={showPairingDialog}
        onSubmit={handlePairingCodeSubmit}
        onCancel={() => handlePairingCodeSubmit(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    margin: 10,
  },
  statusText: {
    marginBottom: 10,
  },
  pickerContainer: {
    // Contain the Picker to prevent overlap on iOS
    height: Platform.OS === 'ios' ? 150 : 50, // Larger on iOS to accommodate wheel
    width: '100%',
    marginVertical: 10,
    justifyContent: 'center', // Center the Picker vertically
  },
  picker: {
    width: '100%',
    ...(Platform.OS === 'ios' && {
      height: 150, // Explicit height for iOS wheel
    }),
    ...(Platform.OS === 'android' && {
      height: 50, // Smaller height for Android dropdown
    }),
  },
  buttonSpacer: {
    height: 40, // Existing spacer between Connect and Mute
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default App;