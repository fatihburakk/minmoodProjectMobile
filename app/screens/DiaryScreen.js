import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Platform, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import { diaryService } from '../../services/diaryService';
import supabase from '../../supabaseClient';

const DiaryScreen = () => {
  const [diaryContent, setDiaryContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diaries, setDiaries] = useState([]);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Günlükleri yükle
  const loadDiaries = async () => {
    try {
      const { data, error } = await diaryService.getDiaries();
      if (error) throw error;
      setDiaries(data || []);
    } catch (error) {
      console.error('Günlükler yüklenirken hata:', error.message);
      Alert.alert('Hata', 'Günlükler yüklenirken bir hata oluştu.');
    }
  };

  // Sayfa yüklendiğinde günlükleri getir
  useEffect(() => {
    loadDiaries();
  }, []);

  // Realtime aboneliği
  useEffect(() => {
    const user = supabase.auth.user();
    const userId = user ? user.id : null;

    if (!userId) {
      console.warn('Kullanıcı yok, realtime başlatılmadı!');
      return;
    }

    const subscription = supabase
      .from(`diaries:user_id=eq.${userId}`)
      .on('*', payload => {
        console.log('--- Realtime ---', payload);
        setDiaries(prev => {
          let updated;
          if (payload.eventType === 'INSERT') {
            updated = [payload.new, ...prev];
          } else if (payload.eventType === 'UPDATE') {
            updated = prev.map(d => (d.id === payload.new.id ? payload.new : d));
          } else if (payload.eventType === 'DELETE') {
            updated = prev.filter(d => d.id !== payload.old.id);
          } else {
            updated = prev;
          }
          return [...updated];
        });
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []);

  const handleSaveDiary = async () => {
    if (!diaryContent.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir şeyler yazın.');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await diaryService.addDiary(diaryContent.trim());
      if (error) throw error;
      Alert.alert('Başarılı', 'Günlük kaydedildi.');
      setDiaryContent('');
      await loadDiaries();
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDiary = async (id) => {
    Alert.alert('Onay', 'Silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await diaryService.deleteDiary(id);
            if (error) throw error;
            await loadDiaries();
            setIsModalVisible(false);
            Alert.alert('Başarılı', 'Silindi.');
          } catch (error) {
            Alert.alert('Hata', error.message);
          }
        }
      }
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDiaryModal = (diary, edit = false) => {
    setSelectedDiary(diary);
    setIsModalVisible(true);
    setIsEditMode(edit);
    setEditContent(diary.content);
  };

  const closeDiaryModal = () => {
    setSelectedDiary(null);
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditContent('');
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir şeyler yazın.');
      return;
    }
    try {
      setIsLoading(true);
      const { error } = await diaryService.updateDiary(selectedDiary.id, editContent.trim());
      if (error) throw error;
      Alert.alert('Başarılı', 'Günlük başarıyla güncellendi.');
      await loadDiaries();
      closeDiaryModal();
    } catch (error) {
      Alert.alert('Hata', 'Günlük güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.background}>
      <SafeAreaView style={styles.container}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Mind</Text>
          <Image source={require('../../assets/images/minmood.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logoText}>Mood</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Duygu Günlüğüm</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Bugün neler hissettiniz?"
                multiline
                value={diaryContent}
                onChangeText={setDiaryContent}
                placeholderTextColor={'#A0A0A0'}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSaveDiary}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {diaries.map((diary) => (
            <TouchableOpacity key={diary.id} onPress={() => openDiaryModal(diary)}>
              <View style={styles.diaryCard}>
                <Text style={styles.diaryDate}>{formatDate(diary.created_at)}</Text>
                <Text style={styles.diaryContent} numberOfLines={3}>{diary.content}</Text>
                <View style={styles.cardButtonRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openDiaryModal(diary, true)}
                  >
                    <Text style={styles.editButtonText}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDiary(diary.id)}
                  >
                    <Text style={styles.deleteButtonText}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeDiaryModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalPopup}>
              <TouchableOpacity style={styles.closeButton} onPress={closeDiaryModal}>
                <Ionicons name="close" size={24} color="#7c1fff" />
              </TouchableOpacity>
              {selectedDiary && (
                <>
                  <Text style={styles.modalPopupDate}>{formatDate(selectedDiary.created_at)}</Text>
                  {isEditMode ? (
                    <>
                      <TextInput
                        style={styles.modalPopupContent}
                        value={editContent}
                        onChangeText={setEditContent}
                        multiline
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.modalSaveButton}
                        onPress={handleEditSave}
                        disabled={isLoading}
                      >
                        <LinearGradient
                          colors={['#ffffff', '#ffffff']}
                          style={styles.modalSaveButtonGradient}
                        >
                          <Text style={styles.modalSaveButtonText}>{isLoading ? 'Kaydediliyor...' : 'Düzenle'}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <ScrollView style={styles.modalPopupContentWrapper}>
                      <Text style={styles.modalPopupContent}>{selectedDiary.content}</Text>
                    </ScrollView>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Tüm stiller aynı, ek olarak:
  modalPopup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    maxHeight: '80%',
    width: '85%',
  },
  modalPopupDate: {
    fontSize: 16,
    color: '#7c1fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalPopupContentWrapper: {
    maxHeight: 250,
  },
  modalPopupContent: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  // ... diğer stiller
  background: { flex: 1, backgroundColor: colors.gradientStart },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 30 },
  scrollView: { flex: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: colors.white, marginHorizontal: 8 },
  logoImage: { width: 48, height: 48, borderRadius: 12, marginHorizontal: 8 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginTop: 15, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.primary },
  inputContainer: { height: 120, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 15 },
  input: { flex: 1, textAlignVertical: 'top', fontSize: 15, color: colors.textPrimary },
  saveButton: { borderRadius: 8, overflow: 'hidden' },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonGradient: { paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  diaryCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 15 },
  diaryDate: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  diaryContent: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  cardButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#e6e6ff',
    padding: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#7c1fff',
    fontWeight: 'bold',
  },
  modalSaveButton: {
    backgroundColor: '#e6e6ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  modalSaveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#7c1fff',
    fontWeight: 'bold',
  },
});

export default DiaryScreen;
