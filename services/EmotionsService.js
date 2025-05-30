import supabase from '../lib/supabase';

class EmotionsService {
  // Duygu analizi sonuçlarını kaydetme
  async saveEmotionAnalysis(analysisResults) {
    try {
      // Kullanıcı ID kontrolü
      if (!analysisResults.userId) {
        throw new Error('Kullanıcı ID bulunamadı');
      }

      // Duygu analizi verilerini hazırla
      const emotionData = {
        user_id: analysisResults.userId,
        dominant_emotion: analysisResults.dominantEmotion,
        emotion_scores: analysisResults.emotionScores,
        created_at: new Date().toISOString(),
        notes: analysisResults.notes || '',
        mood_score: analysisResults.moodScore || 0
      };

      console.log('Kaydedilecek duygu verisi:', emotionData);

      // Supabase'e kaydet
      const { data, error } = await supabase
        .from('emotions')
        .insert([emotionData]);

      if (error) {
        console.error('Duygu kaydetme hatası:', error);
        throw error;
      }

      console.log('Duygu analizi başarıyla kaydedildi:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Duygu kaydetme hatası:', error);
      return { data: null, error };
    }
  }

  // Duygu geçmişini getirme
  async getEmotionHistory() {
    try {
      const user = supabase.auth.user();
      if (!user) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const { data, error } = await supabase
        .from('emotions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Duygu geçmişi getirme hatası:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Duygu geçmişi getirme hatası:', error);
      return { data: null, error };
    }
  }

  // Belirli tarih aralığındaki duyguları getirme
  async getEmotionsByDateRange(startDate, endDate) {
    try {
      const user = supabase.auth.user();
      if (!user) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const { data, error } = await supabase
        .from('emotions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Tarih aralığı duygu getirme hatası:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Tarih aralığı duygu getirme hatası:', error);
      return { data: null, error };
    }
  }
}

export default new EmotionsService();
