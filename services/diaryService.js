import supabase from '../supabaseClient';

export const diaryService = {
  // Tüm günlükleri getir
  async getDiaries() {
    try {
      const user = supabase.auth.user(); // v1 API: oturumdaki kullanıcıyı al

      if (!user) {
        throw new Error('Kullanıcı bulunamadı veya oturum açık değil.');
      }

      const { data, error } = await supabase
        .from('diaries')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Günlükler yüklenirken hata:', error.message);
      return { data: null, error };
    }
  },

  // Yeni günlük ekle
  async addDiary(content) {
    try {
      const user = supabase.auth.user();

      if (!user) {
        throw new Error('Kullanıcı bulunamadı veya oturum açık değil.');
      }

      const { data, error } = await supabase
        .from('diaries')
        .insert([
          {
            content: content,
            user_id: user.id,
            created_at: new Date().toISOString() // opsiyonel
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Günlük eklenirken hata:', error.message);
      return { data: null, error };
    }
  },

  // Günlük sil
  async deleteDiary(id) {
    try {
      const user = supabase.auth.user();

      if (!user) {
        throw new Error('Kullanıcı bulunamadı veya oturum açık değil.');
      }

      const { error } = await supabase
        .from('diaries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Günlük silinirken hata:', error.message);
      return { error };
    }
  },

  // Günlük güncelle
  async updateDiary(id, content) {
    try {
      const user = supabase.auth.user();

      if (!user) {
        throw new Error('Kullanıcı bulunamadı veya oturum açık değil.');
      }

      const { data, error } = await supabase
        .from('diaries')
        .update({ content })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Günlük güncellenirken hata:', error.message);
      return { data: null, error };
    }
  }
};
