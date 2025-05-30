import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme'; // Homescreen ile aynı tema için renkleri al
import supabase from '../../supabaseClient'; // Supabase client
import AsyncStorage from '@react-native-async-storage/async-storage'; // Oturum yönetimi için
import { format } from 'date-fns'; // Tarih formatlama için
import { tr } from 'date-fns/locale'; // Türkçe tarih formatı için

const { width, height } = Dimensions.get('window');

// Duyguya göre renk döndüren fonksiyon (AnalizScreen'den kopyalandı)
function getEmotionColor(emotion) {
  const emotionColors = {
    'Mutluluk': '#FFD700',       // parlak altın sarısı
  'Üzüntü': '#4682B4',         // soğuk çelik mavisi
  'Öfke': '#FF4500',           // canlı turuncu-kırmızı
  'Korku': '#800080',          // koyu mor
  'Şaşkınlık': '#FF69B4',      // parlak pembe
  'İğrenme': '#228B22',        // orman yeşili
  'Nötr': '#808080',           // sade gri
  'Sevgi': '#FF1493',          // sıcak pembe
  'Hayranlık': '#00CED1',      // koyu turkuaz
  'Eğlence': '#FFA500',        // canlı turuncu
  'Rahatsızlık': '#A0522D',    // yoğun kahverengi
  'Onay': '#32CD32',           // limon yeşili
  'İlgili': '#20B2AA',         // açık deniz mavisi
  'Kafa Karışıklığı': '#BA55D3', // orkide moru
  'Merak': '#FF6347',          // domates kırmızısı
  'İstek': '#FF8C00',          // koyu turuncu
  'Hayal Kırıklığı': '#8B4513', // koyu kahverengi
  'Onaylamama': '#DC143C',     // kiraz kırmızısı
  'Utangaçlık': '#DB7093',     // soluk pembe
  'Heyecan': '#FF6347',        // domates kırmızısı
  'Minnettarlık': '#DAA520',   // altın kahverengi
  'Keder': '#4B0082',          // çivit moru
  'Gerginlik': '#B22222',      // ateş kırmızısı
  'İyimserlik': '#00FF7F',     // yayla yeşili
  'Gurur': '#FF7F50',          // mercan rengi
  'Farkındalık': '#1E90FF',    // dodger blue
  'Rahatlık': '#98FB98',       // soluk yeşil
  'Pişmanlık': '#C71585'       // orta menekşe
  };
  return emotionColors[emotion] || '#808080'; // Varsayılan gri
}

export default function DuygularimScreen() {
  const [emotionsData, setEmotionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Verileri çeken fonksiyon
  const fetchUserEmotions = async () => {
    console.log('🔄 Veri çekme başladı');
    setLoading(true);
    try {
      const user = supabase.auth.user();
      const userId = user ? user.id : null;
      console.log('👤 Kullanıcı ID:', userId);

      if (!userId) {
        console.warn('⚠️ Kullanıcı oturumu bulunamadı!');
        setEmotionsData([]);
        setLoading(false);
        return;
      }

      console.log('📡 Veritabanından veri çekiliyor...');
      const { data, error } = await supabase
        .from('emotions')
        .select('id, user_id, text, emotions, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Veri çekme hatası:', error);
        setEmotionsData([]);
      } else {
        console.log('📦 Ham veriler:', data);
        const parsedData = data.map(entry => ({
          ...entry,
          emotions: typeof entry.emotions === 'string' ? JSON.parse(entry.emotions) : entry.emotions,
        }));
        console.log('✅ İşlenmiş veriler:', parsedData);
        setEmotionsData(parsedData);
      }
    } catch (err) {
      console.error('❌ Beklenmeyen hata:', err);
      setEmotionsData([]);
    }
    setLoading(false);
    console.log('✅ Veri çekme tamamlandı');
  };

  useEffect(() => {
    console.log('🚀 Component yüklendi');
    let mounted = true;

    const setupRealtimeSubscription = async () => {
      try {
        const user = supabase.auth.user();
        if (!user) {
          console.log('⚠️ Kullanıcı oturumu bulunamadı');
          return;
        }

        console.log('🔄 Real-time abonelik başlatılıyor - Kullanıcı ID:', user.id);
        
        // İlk veri yüklemesi
        await fetchUserEmotions();

        // Real-time abonelik
        const subscription = supabase
          .from(`emotions:user_id=eq.${user.id}`)
          .on('INSERT', (payload) => {
            console.log('📡 Yeni kayıt:', payload);
            if (mounted) {
              fetchUserEmotions();
            }
          })
          .on('DELETE', (payload) => {
            console.log('📡 Silinen kayıt:', payload);
            if (mounted) {
              fetchUserEmotions();
            }
          })
          .on('UPDATE', (payload) => {
            console.log('📡 Güncellenen kayıt:', payload);
            if (mounted) {
              fetchUserEmotions();
            }
          })
          .subscribe();

        // Cleanup
        return () => {
          console.log('🧹 Component temizleniyor');
          mounted = false;
          if (subscription) {
            subscription.unsubscribe();
            console.log('✅ Real-time abonelik temizlendi');
          }
        };

      } catch (error) {
        console.error('❌ Real-time kurulum hatası:', error);
      }
    };

    setupRealtimeSubscription();

  }, []);

  // Bir duygu kaydındaki duyguların toplam skorunu ve yüzdelerini hesapla
  const calculateEmotionPercentages = (emotionEntry) => {
    if (!emotionEntry || !Array.isArray(emotionEntry.emotions)) return [];

    const emotionList = emotionEntry.emotions;
    const totalScore = emotionList.reduce((sum, emo) => sum + (emo.score || 0), 0);

    if (totalScore === 0) return emotionList.map(emo => ({ ...emo, percentage: 0 }));

    return emotionList.map(emo => ({
      ...emo,
      percentage: ((emo.score || 0) / totalScore) * 100,
    })).sort((a, b) => b.percentage - a.percentage); // Yüzdeye göre sırala
  };

  // Silme fonksiyonu
  const handleDelete = async (id) => {
    try {
      console.log('🗑️ Silme işlemi başlatıldı - ID:', id);
      
      // Silme onayı iste
      Alert.alert(
        "Duygu Kaydını Sil",
        "Bu duygu kaydını silmek istediğinizden emin misiniz?",
        [
          {
            text: "İptal",
            style: "cancel"
          },
          {
            text: "Sil",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from('emotions')
                .delete()
                .eq('id', id);

              if (error) {
                console.error('❌ Silme hatası:', error);
                Alert.alert("Hata", "Duygu kaydı silinirken bir hata oluştu.");
              } else {
                console.log('✅ Duygu kaydı başarıyla silindi');
                // Verileri yenile
                fetchUserEmotions();
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('❌ Beklenmeyen silme hatası:', err);
      Alert.alert("Hata", "Beklenmeyen bir hata oluştu.");
    }
  };

  const openModal = (emotion) => {
    setSelectedEmotion(emotion);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedEmotion(null);
    setModalVisible(false);
  };

  // Tarihi görseldeki gibi formatla (21.05.2025)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // date-fns format kullanıyoruz, locale TR olarak ayarlı
    return format(date, 'dd.MM.yyyy', { locale: tr });
  };


  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Duygu Geçmişim</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : emotionsData.length > 0 ? (
          emotionsData.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => openModal(item)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteButtonText}>Sil</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardText} numberOfLines={3}>{item.text}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noDataText}>Henüz duygu kaydı yok.</Text>
        )}
      </ScrollView>

      {/* Detay Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>X</Text> {/* Sadece 'X' işareti */}
            </TouchableOpacity>
            {selectedEmotion && (
              <>
                <Text style={styles.modalTitle}>{formatDate(selectedEmotion.created_at)}</Text>
                <Text style={styles.modalText}>{selectedEmotion.text}</Text>
                <View style={styles.emotionPercentagesContainer}>
                  {calculateEmotionPercentages(selectedEmotion).map((emotion, index) => (
                     // Sadece ilk 3 veya 4 duyguyu göstermek isterseniz buradan slice yapabilirsiniz
                    <View key={index} style={styles.emotionPercentageItem}>
                      <Text style={styles.emotionPercentageText}>
                        Duygu: <Text style={[styles.emotionLabel, { color: getEmotionColor(emotion.label) }]}>{emotion.label}</Text> – Oran: <Text style={styles.emotionPercentageValue}>{emotion.percentage.toFixed(2)}%</Text> {/* Görseldeki gibi 2 ondalık hane */}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12, // Yan boşluklar
  },
  title: {
    fontSize: 24, // Başlık biraz daha büyük
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20, // Başlık alt boşluğu
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)', // Hafif şeffaf beyaz
    borderRadius: 15, // Daha yuvarlak köşeler
    padding: 15, // İç boşluk
    marginVertical: 8, // Dikey boşluk
    width: '100%', // Tam genişlik
    maxWidth: 500, // Maksimum genişlik (web'de iyi görünmesi için)
    elevation: 3, // Gölge (Android)
    shadowColor: '#000', // Gölge (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#eeeeee', // Ayrım çizgisi
  },
  cardDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary, // Tema rengi
  },
  deleteButtonText: {
      fontSize: 14,
      color: colors.danger, // Kırmızı renk (tanımlı değilse '#ff0000' kullanın)
      fontWeight: 'bold',
  },
  cardText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22, // Satır aralığı
  },
  noDataText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Karartılmış arka plan
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Hafif şeffaf beyaz
    borderRadius: 20,
    padding: 25,
    width: '90%', // Modal genişliği
    maxWidth: 500, // Maksimum genişlik
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    position: 'relative', // X butonu için
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1, // Üste çıkması için
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger, // Sil rengi
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    marginTop: 10, // X butonu için boşluk
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center', // Ortala
    lineHeight: 22,
  },
  emotionPercentagesContainer: {
      width: '100%', // Yüzdeler için tam genişlik
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#eeeeee',
      paddingTop: 10,
  },
  emotionPercentageItem: {
      backgroundColor: 'rgba(238, 0, 238, 0.1)', // Açık mor arka plan (colors.accent)
      borderRadius: 10,
      padding: 10,
      marginVertical: 5,
      width: '100%',
  },
  emotionPercentageText: {
    fontSize: 15,
    color: '#333',
  },
   emotionLabel: {
       fontWeight: 'bold',
   },
  emotionPercentageValue: {
      fontWeight: 'bold',
      color: colors.primary, // Tema rengi
  },
});
