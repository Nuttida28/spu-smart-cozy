import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';

const parseRoomLabel = (roomId) => {
  if (!roomId) return 'กรุณาเลือกห้องเรียน';
  const parts = roomId.split('_');
  const bldg = parts[0]?.replace('bldg', '') || '--';
  const floor = parts[1]?.replace('f', '') || '--';
  const room = parts[2]?.replace('r', '') || '--';
  return `ตึก ${bldg}  |  ชั้น ${floor}  |  ห้อง ${room}`;
};

const zoneToTempField = (zone) => zone ? `temp_${zone}` : null;

const conditionToEmoji = (condition) => {
  if (!condition) return '⛅';
  if (condition.includes('แดดจัด'))                          return '☀️';
  if (condition.includes('แดด'))                             return '🌤️';
  if (condition.includes('ฟ้าคะนอง') || condition.includes('ฟ้าร้อง')) return '⛈️';
  if (condition.includes('ฝนหนัก'))                          return '🌧️';
  if (condition.includes('ฝน'))                              return '🌦️';
  if (condition.includes('เมฆมาก'))                         return '☁️';
  if (condition.includes('เมฆ'))                            return '🌥️';
  if (condition.includes('หนาวจัด'))                        return '🥶';
  if (condition.includes('หนาว'))                           return '❄️';
  if (condition.includes('เย็น'))                           return '🌤️';
  if (condition.includes('ร้อนจัด'))                        return '🔥';
  return '⛅';
};

const conditionToLabel = (condition) => condition || '';

const getCurrentDateThai = () => {
  const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const now = new Date();
  return `วัน ${days[now.getDay()]}  /  ${months[now.getMonth()]}  /  ${now.getDate()}`;
};

const DashboardScreen = ({ route }) => {
  const { roomId, zone } = route.params || {};

  const [weather, setWeather] = useState(null);
  const [climate, setClimate] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'current_weather'), (snap) => setWeather(snap.val()));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!roomId) { setClimate(null); return; }
    const unsub = onValue(ref(db, `smart_room_system/${roomId}/climate`), (snap) => setClimate(snap.val()));
    return () => unsub();
  }, [roomId]);

  const tempField = zoneToTempField(zone);
  const indoorTemp  = climate && tempField ? parseFloat(climate[tempField]).toFixed(1) : null;
  const outdoorTemp = weather?.temp != null ? parseFloat(weather.temp).toFixed(1) : null;
  const humidity    = weather?.rh   != null ? parseFloat(weather.rh).toFixed(0)   : null;
  const rain        = weather?.rain != null ? parseFloat(weather.rain).toFixed(1)  : null;
  const condition    = weather?.condition ?? null;
  const weatherEmoji = conditionToEmoji(condition);
  const weatherLabel = conditionToLabel(condition);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 90 }}>

        {/* ── Weather Card ── */}
        <LinearGradient colors={['#7BB8E8', '#C5DCF5']} style={styles.wCard}>
          <View style={styles.wContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.wDate}>{getCurrentDateThai()}</Text>
              <Text style={styles.wPlace}>{parseRoomLabel(roomId)}</Text>
              <View style={styles.wTempRow}>
                <Text style={styles.wTempNum}>{outdoorTemp ?? '--'}</Text>
                <Text style={styles.wDeg}>°C</Text>
              </View>
              <Text style={styles.wLabel}>อุณหภูมิภายนอก</Text>
            </View>
            <View style={styles.wIconWrap}>
              <Text style={styles.wEmoji}>{weatherEmoji}</Text>
              {weatherLabel ? <Text style={styles.wCondLabel}>{weatherLabel}</Text> : null}
            </View>
          </View>
        </LinearGradient>

        {/* ── Humidity & Rain ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Ionicons name="water" size={20} color="#64B5F6" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.infoLabel}>ความชื้นภายนอก</Text>
              <Text style={styles.infoVal}>{humidity != null ? `${humidity}%` : '--'}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="rainy" size={20} color="#64B5F6" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.infoLabel}>ปริมาณฝนรายชม.</Text>
              <Text style={styles.infoVal}>{rain != null ? `${rain} mm` : '--'}</Text>
            </View>
          </View>
        </View>

        {/* ── Zone + Room badge ── */}
        <View style={styles.zoneRow}>
          <View style={[styles.zoneBadge, !zone && { backgroundColor: '#CBD5E0' }]}>
            <Text style={styles.zoneBadgeT}>{zone ? `Zone ${zone}` : 'No Zone'}</Text>
          </View>
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeT}>{parseRoomLabel(roomId)}</Text>
          </View>
        </View>

        {/* ── Indoor Temperature Card ── */}
        <Card containerStyle={styles.tempCard}>
          <View style={{ width: '100%', alignItems: 'center' }}>
          <Text style={styles.tempTitle}>อุณหภูมิภายในห้อง</Text>

          <View style={styles.circleWrap}>
            <View style={styles.circle}>
              <Text style={[styles.tempNum, !zone && { color: '#CBD5E0' }]}>
                {indoorTemp ?? '--'}
              </Text>
            </View>
            {/* °C ลอยอยู่มุมบนขวาของวงกลม */}
            <Text style={[styles.degFloat, !zone && { color: '#CBD5E0' }]}>°C</Text>
          </View>

          {/* อุณหภูมิทุกโซน */}
          {climate && (
            <View style={styles.allZones}>
              {['A', 'B', 'C', 'D'].map((z) => (
                <View key={z} style={[styles.zoneBox, zone === z && styles.zoneBoxActive]}>
                  <Text style={[styles.zoneLbl, zone === z && { color: '#007AFF' }]}>Zone {z}</Text>
                  <Text style={[styles.zoneTemp, zone === z && { color: '#007AFF' }]}>
                    {climate[`temp_${z}`] != null ? `${parseFloat(climate[`temp_${z}`]).toFixed(1)}°C` : '--'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Weather card
  wCard: { borderRadius: 24, padding: 20, marginTop: 10, marginBottom: 14, height: 210 },
  wContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  wDate: { fontSize: 11, color: '#FFF', fontWeight: '500', marginBottom: 2 },
  wPlace: { fontSize: 11, color: '#FFF', opacity: 0.85, marginBottom: 6 },
  wTempRow: { flexDirection: 'row', alignItems: 'flex-start' },
  wTempNum: { fontSize: 52, fontWeight: 'bold', color: '#FFF', lineHeight: 60 },
  wDeg: { fontSize: 20, color: '#FFF', marginTop: 8, marginLeft: 2 },
  wLabel: { fontSize: 12, color: '#FFF', opacity: 0.9, marginTop: 4 },
  wIconWrap: { justifyContent: 'center', alignItems: 'center', width: 100 },
  wEmoji: { fontSize: 72 },
  wCondLabel: { fontSize: 11, color: '#FFF', textAlign: 'center', marginTop: 4, opacity: 0.9 },

  // Humidity & Rain
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  infoBox: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E8F0FE', borderRadius: 14, padding: 12 },
  infoLabel: { fontSize: 10, color: '#94A3B8' },
  infoVal: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginTop: 2 },

  // Zone row
  zoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: -16, zIndex: 1, paddingHorizontal: 8 },
  zoneBadge: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, elevation: 4 },
  zoneBadgeT: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  roomBadge: { flex: 1, backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 14, borderTopRightRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderColor: '#E8F0FE', marginLeft: -4 },
  roomBadgeT: { fontSize: 11, color: '#64748B' },

  // Temperature card
  tempCard: { borderRadius: 28, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', elevation: 3, borderWidth: 0, backgroundColor: '#FFF', marginHorizontal: 0 },
  tempTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 24, textAlign: 'center', width: '100%' },

  circleWrap: { position: 'relative', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 180, height: 180, borderRadius: 90, borderWidth: 6, borderColor: '#BFDBFE', justifyContent: 'center', alignItems: 'center' },
  tempNum: { fontSize: 80, fontWeight: 'bold', color: '#60A5FA' },
  degFloat: { fontSize: 26, fontWeight: 'bold', color: '#60A5FA', position: 'absolute', top: 20, right: 0 },

  // All zones row
  allZones: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24, width: '100%' },
  zoneBox: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', width: '22%' },
  zoneBoxActive: { borderColor: '#007AFF', backgroundColor: '#EFF6FF' },
  zoneLbl: { fontSize: 10, color: '#94A3B8', marginBottom: 4 },
  zoneTemp: { fontSize: 13, fontWeight: 'bold', color: '#64748B' },
});

export default DashboardScreen;
