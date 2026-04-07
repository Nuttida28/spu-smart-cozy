import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card } from '@rneui/themed';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';

// แปลง zones จาก Firebase
const toZonesArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
};

// แปลง roomId (bldg05_f09_r02) → { building, floor, room }
const parseRoomId = (roomId) => {
  if (!roomId) return { building: '--', floor: '--', room: '--' };
  const parts = roomId.split('_'); 
  return {
    building: parts[0]?.replace('bldg', '') || '--',
    floor: parts[1]?.replace('f', '') || '--',
    room: parts[2]?.replace('r', '') || '--',
  };
};

const HomeScreen = ({ navigation }) => {
  const [rooms, setRooms] = useState([]);         
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [zones, setZones] = useState([]);          
  const [selectedZone, setSelectedZone] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    const devicesRef = ref(db, 'devices');
    const unsub = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({
          roomId: id,
          building: val.building,
          floor: val.floor,
          room: val.room,
          zones: toZonesArray(val.zones),
        }));
        setRooms(list);
      }
      setLoadingRooms(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) { setZones([]); return; }
    const found = rooms.find((r) => r.roomId === selectedRoomId);
    setZones(toZonesArray(found?.zones));
    setSelectedZone(null);
  }, [selectedRoomId, rooms]);

  const details = parseRoomId(selectedRoomId);

  const pickerItems = rooms.map((r) => ({
    label: `ตึก ${r.building} ชั้น ${r.floor} ห้อง ${r.room}`,
    value: r.roomId,
  }));

  const handleConfirm = () => {
    navigation.navigate('Temperature', { roomId: selectedRoomId, zone: selectedZone });
    navigation.navigate('Vote', { roomId: selectedRoomId, zone: selectedZone });
  };

  const SeatDot = () => <View style={styles.seat} />;

  const SeatBlock = () => (
    <View style={styles.seatBlock}>
      {[...Array(16)].map((_, s) => <SeatDot key={s} />)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text h3 style={styles.bold}>Hello Student</Text>
        <Text style={styles.grayText}>ระบุตำแหน่งที่นั่งของคุณ</Text>

        <View style={styles.pickerBox}>
          <Text style={styles.label}>กรุณาเลือกห้องเรียน</Text>
          {loadingRooms ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 15 }} />
          ) : (
            <RNPickerSelect
              onValueChange={(value) => setSelectedRoomId(value || null)}
              items={pickerItems}
              value={selectedRoomId}
              placeholder={{ label: 'เลือกห้องเรียน...', value: null }}
              style={pickerStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => <Ionicons name="chevron-down" size={20} color="#718096" style={{ marginTop: 12, marginRight: 10 }} />}
            />
          )}
        </View>

        <View style={styles.infoRow}>
          {[
            { label: 'ตึก', val: `ตึก ${details.building}` }, // เปลี่ยนจาก วิทยาเขต เป็น ตึก
            { label: 'ชั้น', val: `ชั้น ${details.floor}` },
            { label: 'ห้องเรียน', val: `ห้อง ${details.room}` },
          ].map((item, i) => (
            <View key={i} style={styles.infoItem}>
              <Text style={styles.label}>{item.label}</Text>
              <View style={styles.infoValBox}>
                <Text style={styles.valText}>{item.val}</Text>
              </View>
            </View>
          ))}
        </View>

        <Card containerStyle={styles.card}>
          <Text style={styles.bold}>เลือกโซนที่นั่ง</Text>
          <View style={styles.frontBar} />
          {selectedRoomId === 'bldg05_f09_r02' && (
            <View style={styles.zoneTopBars}>
              <View style={styles.zoneTopBar} />
              <View style={styles.zoneTopBar} />
              <View style={styles.zoneTopBar} />
            </View>
          )}
          <View style={styles.grid}>
            {(zones.length > 0 ? zones : ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D']).map((z, idx) => {
              const zLabel = z.replace('Zone_', '');
              const isActive = selectedZone === zLabel;
              const isDisabled = !selectedRoomId;
              const isLeftCol = idx % 2 === 0;
              const isTopBarRoom = selectedRoomId === 'bldg05_f09_r02';
              return (
                <View key={z} style={[styles.zoneWrapper, isDisabled && { opacity: 0.4 }]}>
                  {!isTopBarRoom && isLeftCol && <View style={styles.zoneLeftBar} />}
                  <TouchableOpacity
                    onPress={() => !isDisabled && setSelectedZone(zLabel)}
                    style={[styles.zone, isActive && styles.activeZone]}
                  >
                    {isActive ? (
                      <View style={styles.center}>
                        <Text style={styles.zT}>{zLabel}</Text>
                        <Text style={styles.zS}>Zone</Text>
                      </View>
                    ) : (
                      <View style={styles.zoneInner}>
                        <View style={styles.seatGroups}>
                          <SeatBlock />
                          <SeatBlock />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Card>

        <Button
          title="ยืนยัน Zone"
          disabled={!selectedZone || !selectedRoomId}
          buttonStyle={[styles.btn, selectedZone && { backgroundColor: '#007AFF' }]}
          onPress={handleConfirm}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  bold: { fontWeight: 'bold' },
  grayText: { color: '#A0AEC0', fontSize: 12, marginBottom: 15 },
  pickerBox: { marginBottom: 10 },
  label: { fontSize: 11, color: '#4A5568', marginBottom: 5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoItem: { width: '31%' },
  infoValBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, alignItems: 'center' },
  valText: { fontSize: 11, fontWeight: 'bold' },
  card: { borderRadius: 20, elevation: 3 },
  frontBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginVertical: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  zoneLeftBars: { flexDirection: 'column', justifyContent: 'center', gap: 6, marginRight: 6 },
  zoneLeftBar: { width: 5, height: 28, backgroundColor: '#CBD5E0', borderRadius: 3, marginRight: 8 },
  zoneWrapper: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 15 },
  zoneTopBars: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 8 },
  zoneTopBar: { width: 28, height: 5, backgroundColor: '#CBD5E0', borderRadius: 3 },
  zone: { flex: 1, height: 110, backgroundColor: '#F7FAFC', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EDF2F7', overflow: 'hidden' },
  activeZone: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  zT: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  zS: { color: '#FFF', fontSize: 12 },
  zoneInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, width: '100%' },
  seatGroups: { flexDirection: 'row', gap: 6 },
  seatBlock: { flexDirection: 'row', flexWrap: 'wrap', width: 52 },
  seat: { width: 8, height: 8, backgroundColor: '#CBD5E0', borderRadius: 2, margin: 1.5 },
  btn: { borderRadius: 12, height: 50, marginTop: 10, backgroundColor: '#D1D5DB' },
  center: { alignItems: 'center' },
});

const pickerStyles = {
  inputIOS: { fontSize: 14, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 15 },
  inputAndroid: { fontSize: 14, padding: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 15 },
};

export default HomeScreen;