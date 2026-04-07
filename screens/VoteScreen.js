import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Overlay } from '@rneui/themed';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ref, set, runTransaction } from 'firebase/database';
import { db } from '../firebaseConfig';

const parseRoomLabel = (roomId) => {
  if (!roomId) return 'กรุณาเลือกห้องเรียนก่อน';
  const parts = roomId.split('_');
  const bldg = parts[0]?.replace('bldg', '') || '--';
  const floor = parts[1]?.replace('f', '') || '--';
  const room = parts[2]?.replace('r', '') || '--';
  return `ตึก ${bldg}  |  ชั้น ${floor}  |  ห้อง ${room}`;
};

// อัปเดตสีพื้นหลังและสีกรอบตามที่กำหนด
const VOTE_OPTIONS = [
  { id: 'cold', icon: 'weather-snowy', label: 'หนาวจัด', activeBg: '#BAE6FD', activeBorder: '#0284C7' },
  { id: 'comfort', icon: 'emoticon-happy-outline', label: 'พอดี', activeBg: '#6EE7B7', activeBorder: '#007A55' },
  { id: 'hot', icon: 'weather-sunny', label: 'ร้อนไป', activeBg: '#FB923C', activeBorder: '#CE1E4D' },
];

const VoteScreen = ({ route, navigation }) => {
  const { roomId, zone } = route.params || {};
  const [selectedVote, setSelectedVote] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!selectedVote || !zone || !roomId) return;
    setIsSending(true);

    const now = Date.now();
    const zoneKey = `Zone_${zone}`; 

    try {
      await set(ref(db, `vote_logs/${now}`), {
        zone: zoneKey,
        roomId,
        vote: selectedVote,
        timestamp: now,
      });

      const summaryRef = ref(db, `vote_summary/${roomId}/${zoneKey}`);
      await runTransaction(summaryRef, (current) => {
        if (current === null) {
          return {
            cold: selectedVote === 'cold' ? 1 : 0,
            comfort: selectedVote === 'comfort' ? 1 : 0,
            hot: selectedVote === 'hot' ? 1 : 0,
            lastMood: selectedVote,
            lastRoomId: roomId,
            cycle: 1,
            timestamp: now,
          };
        }
        return {
          ...current,
          [selectedVote]: (current[selectedVote] || 0) + 1,
          lastMood: selectedVote,
          lastRoomId: roomId,
          timestamp: now,
        };
      });

      setShowSuccess(true);
      setSelectedVote(null);
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Confirm')}>
          <Ionicons name="chevron-back" size={18} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.hBox}>
          <Text style={styles.hT}>{parseRoomLabel(roomId)}</Text>
        </View>
      </View>

      <View style={styles.zSection}>
        <View style={styles.circle}>
          <Text style={[styles.zL, !zone && { color: '#CBD5E0' }]}>{zone || '--'}</Text>
          <Text style={styles.zS}>YOUR SEAT ZONE</Text>
        </View>
      </View>

      <Card containerStyle={styles.vCard}>
        <Text style={styles.q}>คุณรู้สึกอย่างไรบ้าง ?</Text>
        <View style={styles.row}>
          {VOTE_OPTIONS.map((item) => {
            const isSelected = selectedVote === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedVote(item.id)}
                disabled={!zone}
                style={[styles.opt, !zone && { opacity: 0.4 }]}
              >
                {/* เปลี่ยนสีพื้นหลัง สีกรอบ และสีไอคอนแบบ Dynamic */}
                <View style={[
                  styles.iC, 
                  isSelected && { backgroundColor: item.activeBg, borderWidth: 2, borderColor: item.activeBorder }
                ]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={30}
                    color={isSelected ? '#FFF' : '#B0BEC5'} // ไอคอนเปลี่ยนเป็นสีขาวเมื่อถูกเลือก
                  />
                </View>
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: isSelected ? item.activeBorder : '#94A3B8', 
                  marginTop: 6 
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Button
        title={isSending ? 'กำลังส่ง...' : 'ส่งผลโหวต'}
        disabled={!selectedVote || !zone || isSending}
        buttonStyle={[styles.sBtn, selectedVote && !isSending && { backgroundColor: '#007AFF' }]}
        containerStyle={styles.sContainer}
        onPress={handleSubmit}
      />

      <Overlay isVisible={showSuccess} onBackdropPress={() => setShowSuccess(false)} overlayStyle={styles.overlay}>
        <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => setShowSuccess(false)}>
          <Ionicons name="close" size={20} color="#94A3B8" />
        </TouchableOpacity>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={30} color="#2DD4BF" />
        </View>
        <Text style={styles.successT}>ส่งข้อมูลเรียบร้อย</Text>
      </Overlay>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  back: { backgroundColor: '#007AFF', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  hBox: { flex: 1, borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginLeft: 10 },
  hT: { fontSize: 12, color: '#64748B' },
  zSection: { alignItems: 'center', marginVertical: 40 },
  circle: { width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  zL: { fontSize: 45, fontWeight: 'bold', color: '#007AFF' },
  zS: { fontSize: 9, color: '#94A3B8' },
  vCard: { borderRadius: 20, paddingVertical: 25, elevation: 4, borderWidth: 0 },
  q: { textAlign: 'center', fontWeight: 'bold', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  opt: { alignItems: 'center' },
  iC: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sContainer: { paddingHorizontal: 20, marginTop: 30 },
  sBtn: { borderRadius: 12, height: 50, backgroundColor: '#D1D5DB' },
  overlay: { width: '80%', borderRadius: 15, padding: 20, alignItems: 'center' },
  check: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#2DD4BF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  successT: { fontSize: 18, fontWeight: 'bold', color: '#2DD4BF' },
});

export default VoteScreen;