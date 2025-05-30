import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Animated, Image, TouchableWithoutFeedback, Keyboard, Modal, Alert, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import { Ionicons } from 'react-native-vector-icons';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { EmotionsService } from '../../services/EmotionsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  autoRefreshToken: true,
  persistSession: true
});

const EMOTION_TRANSLATIONS = {
  'admiration': 'Hayranlık',
  'amusement': 'Eğlence',
  'anger': 'Öfke',
  'annoyance': 'Rahatsızlık',
  'approval': 'Onay',
  'caring': 'İlgili',
  'confusion': 'Kafa Karışıklığı',
  'curiosity': 'Merak',
  'desire': 'İstek',
  'disappointment': 'Hayal Kırıklığı',
  'disapproval': 'Onaylamama',
  'disgust': 'İğrenme',
  'embarrassment': 'Utangaçlık',
  'excitement': 'Heyecan',
  'fear': 'Korku',
  'gratitude': 'Minnettarlık',
  'grief': 'Keder',
  'joy': 'Mutluluk',
  'love': 'Sevgi',
  'nervousness': 'Gerginlik',
  'optimism': 'İyimserlik',
  'pride': 'Gurur',
  'realization': 'Farkındalık',
  'relief': 'Rahatlık',
  'remorse': 'Pişmanlık',
  'sadness': 'Üzüntü',
  'surprise': 'Şaşkınlık',
  'neutral': 'Nötr'
};

const MOTIVATION_QUOTES = [
 "Duygularınızı kabul edin, onlar sizin rehberinizdir.",
  "Her nefes, yeni bir başlangıç için fırsattır.",
  "Kendinize karşı nazik olun, mükemmel olmak zorunda değilsiniz.",
  "Bugünkü duygularınız, yarının gücünü oluşturur.",
  "Her zorluk, içsel gücünüzü keşfetme fırsatıdır.",
  "Kendinizi dinleyin, içinizdeki ses en doğru rehberdir.",
  "Duygusal farkındalık, içsel huzurun anahtarıdır.",
  "Her gün, kendinizi daha iyi tanıma şansıdır.",
  "Kendinize zaman ayırın, ruhunuz buna değer.",
  "Duygularınızı bastırmayın, onları anlamaya çalışın.",
  "Her deneyim, büyümenize katkı sağlar.",
  "Kendinizi sevmek, en büyük iyilikseverliktir.",
  "Bugünkü duygularınız, yarının bilgeliğidir.",
  "Her an, kendinizi yeniden keşfetme fırsatıdır.",
  "İçsel huzur, dış dünyadaki başarının temelidir.",
  "Duygusal zeka, hayatın en değerli hazinesidir.",
  "Kendinize inanın, potansiyeliniz sınırsızdır.",
  "Her duygu, bir öğrenme ve büyüme fırsatıdır.",
  "Kendinizi kabul etmek, gerçek özgürlüktür.",
  "Bugün, dünün deneyimlerinden öğrenme günüdür."
];

function getToday() {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${days[d.getDay()]}`;
}

export default function HomeScreen(props) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = props.email || params?.email;
  const scrollViewRef = useRef(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisModalVisible, setIsAnalysisModalVisible] = useState(false);

  // Animasyonlar için referanslar
  const cardAnim1 = useRef(new Animated.Value(0)).current;
  const cardAnim2 = useRef(new Animated.Value(0)).current;
  const cardAnim3 = useRef(new Animated.Value(0)).current;
  const analyzeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(cardAnim1, { toValue: 1, useNativeDriver: true }),
      Animated.spring(cardAnim2, { toValue: 1, useNativeDriver: true }),
      Animated.spring(cardAnim3, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    // Oturum kontrolü
    const checkSession = async () => {
      try {
        const user = supabase.auth.user();
        console.log('Mevcut kullanıcı:', user);
        
        if (user) {
          const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single();
            
          if (userDataError) throw userDataError;
          if (userData) setUsername(userData.username);
        }
      } catch (error) {
        console.error('Oturum kontrolü hatası:', error);
      }
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Geri tuşu davranışını özelleştir
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Geri tuşuna basıldığında hiçbir şey yapma, sayfada kal
      return true;
    });

    // Cleanup
    return () => backHandler.remove();
  }, []);

  const handleAnalyzePress = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    console.log('Analyzing text:', input);
    Animated.sequence([
      Animated.spring(analyzeAnim, { toValue: 1.12, useNativeDriver: true }),
      Animated.spring(analyzeAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    try {
      // Türkçe metni MyMemory API ile İngilizce'ye çevir
      console.log('MyMemory Translation API isteği gönderiliyor...');
      const translateResponse = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(input) + '&langpair=tr|en');
      const translateData = await Promise.race([
        translateResponse.json(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('MyMemory API Timeout')), 10000))
      ]);
      const translatedText = translateData.responseData.translatedText;
      
      if (!translatedText) {
        console.log('MyMemory çeviri başarısız, orijinal metin kullanılıyor:', input);
        translatedText = input;
      }

      console.log('Translated Text:', translatedText);

      // Hugging Face duygu analizi
      const hfResponse = await fetch('https://api-inference.huggingface.co/models/SamLowe/roberta-base-go_emotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
        },
        body: JSON.stringify({ inputs: translatedText }),
      });
      const hfData = await Promise.race([
        hfResponse.json(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Hugging Face API Timeout')), 20000))
      ]);
      console.log('Hugging Face Raw Data:', hfData);

      // Duyguları filtrele ve sırala
      const filteredResults = hfData[0]
        .filter(emotion => emotion.score > 0.1)
        .sort((a, b) => b.score - a.score);

      // Duygu etiketlerini Türkçe'ye çevir
      const translatedResults = filteredResults.map(result => ({
        label: EMOTION_TRANSLATIONS[result.label] || result.label,
        score: result.score,
      }));

      setAnalysisResults(translatedResults);
      setIsAnalysisModalVisible(true);
    } catch (error) {
      console.error('Analiz hatası:', error);
      Alert.alert('Hata', 'Duygu analizi yapılırken bir hata oluştu: ' + error.message);
      setAnalysisResults(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleYeniAnaliz = () => {
    setAnalysisResults(null);
    setInput('');
    setIsAnalysisModalVisible(false);
  };

  const handleCloseModal = async () => {
    try {
      if (analysisResults) {
        const user = supabase.auth.user();
        console.log('Kaydetme için kullanıcı:', user);

        if (!user) {
          Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
          return;
        }

        // Duygu analizi verilerini hazırla
        const emotionData = {
          user_id: user.id,
          text: input,
          emotions: analysisResults,
          created_at: new Date().toISOString()
        };

        console.log('Kaydedilecek veri:', emotionData);

        // Supabase'e kaydet
        const { data, error } = await supabase
          .from('emotions')
          .insert([emotionData]);

        if (error) {
          console.error('Kaydetme hatası:', error);
          Alert.alert('Hata', 'Duygu analizi kaydedilemedi');
          return;
        }

        console.log('Kayıt başarılı:', data);
        Alert.alert('Başarılı', 'Duygu analiziniz kaydedildi!');
        setInput('');
      }
    } catch (error) {
      console.error('Hata:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setIsAnalysisModalVisible(false);
      setAnalysisResults(null);
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.background}>
      <View style={{ flex: 1 }}>
        {/* Modern logo satırı */}
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Mind</Text>
          <Image source={require('../../assets/images/minmood.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logoText}>Mood</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Hoş Geldiniz!</Text>
            <Text style={styles.username}>{username || '...'}</Text>
            <Text style={styles.welcomeSub}>Bugün nasıl hissediyorsunuz?</Text>
            <Text style={styles.motivation}>
              "{MOTIVATION_QUOTES[quoteIndex]}"
            </Text>
          </View>
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>Duygu Analizi</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Duygularınızı buraya yazın..."
                placeholderTextColor={colors.primary}
                value={input}
                onChangeText={setInput}
                multiline
                textAlignVertical="top"
                numberOfLines={6}
                maxHeight={200}
                maxLength={600}
              />
            </View>
            <Animated.View style={{ transform: [{ scale: analyzeAnim }] }}>
              <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzePress} disabled={isAnalyzing}>
                <Text style={styles.analyzeButtonText}>{isAnalyzing ? 'Analiz Ediliyor...' : 'Analiz Et'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Alt tab bar ve kartlar sabit */}
        <View style={styles.shortcutsRow}>
          <Animated.View style={{ flex: 1, alignItems: 'center', transform: [{ scale: cardAnim1 }] }}>
            <View style={styles.shortcutCard}>
              <Ionicons name="book" size={32} color={colors.primary} />
              <Text style={styles.shortcutText}>Günlük</Text>
            </View>
          </Animated.View>
          <Animated.View style={{ flex: 1, alignItems: 'center', transform: [{ scale: cardAnim2 }] }}>
            <View style={styles.shortcutCard}>
              <Ionicons name="bar-chart" size={32} color={colors.primary} />
              <Text style={styles.shortcutText}>Gelişim{"\n"}Analizi</Text>
            </View>
          </Animated.View>
          <Animated.View style={{ flex: 1, alignItems: 'center', transform: [{ scale: cardAnim3 }] }}>
            <View style={styles.shortcutCard}>
              <Ionicons name="medkit" size={32} color={colors.primary} />
              <Text style={styles.shortcutText}>Meditasyon</Text>
            </View>
          </Animated.View>
        </View>

        {/* Analiz Sonuç Modalı */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isAnalysisModalVisible}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Duygu Analizi Sonucu</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>
              {analysisResults && analysisResults.length > 0 && (
                <Text style={styles.resultCountText}>{analysisResults.length} Duygu Tespit Edildi:</Text>
              )}
              {analysisResults && analysisResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Duygu: {EMOTION_TRANSLATIONS[result.label] || result.label}</Text>
                  <Text style={styles.resultScore}>Oran: %{(result.score * 100).toFixed(1)}</Text>
                </View>
              ))}
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={handleYeniAnaliz} style={[styles.modalButton, styles.buttonYeniAnaliz, { flex: 1 }]}>
                  <Text style={styles.buttonText}>Yeni Analiz</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCloseModal} style={[styles.modalButton, styles.buttonKaydet, { flex: 1 }]}>
                  <Text style={styles.buttonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Alt kartlar için boşluk
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 8,
  },
  headerImage: {
    width: width * 0.45,
    height: width * 0.25,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 24,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    marginHorizontal: 0,
    marginBottom: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '92%',
    alignSelf: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  welcomeSub: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  motivation: {
    fontSize: 15,
    color: colors.secondary,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  analysisCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    marginHorizontal: 0,
    marginBottom: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '92%',
    alignSelf: 'center',
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 12,
    minHeight: 120,
  },
  input: {
    flex: 1,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 8,
    marginTop: 0,
    gap: 12,
    zIndex: 10,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 18,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 80,
    width: '92%',
    alignSelf: 'center',
  },
  shortcutText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1.5,
    marginHorizontal: 8,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  resultsCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(162, 89, 255, 0.1)',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  resultScore: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-around',
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonYeniAnaliz: {
    backgroundColor: colors.secondary,
  },
  buttonKaydet: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultCountText: {
    fontSize: 15,
    color: colors.secondary,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
}); 