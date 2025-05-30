import supabase from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Giriş yapma
  async signIn(email, password) {
    try {
      console.log('Giriş denemesi (v1):', { email });

      // Supabase client kontrolü
      if (!supabase?.auth) {
        console.error('Supabase client hatası:', supabase);
        throw new Error('Supabase auth başlatılamadı');
      }

      // Auth metodlarını kontrol et
      console.log('Mevcut auth metodları:', Object.keys(supabase.auth));

      // Auth ile giriş yap (v1 API)
      const { user, error } = await supabase.auth.signIn({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('Auth hatası:', error);
        throw error;
      }

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      console.log('Auth girişi başarılı:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });

      // Kullanıcı bilgilerini hazırla
      const userData = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email.split('@')[0]
      };

      // AsyncStorage'a kaydet
      await this.saveUserData(userData);

      return { data: userData, error: null };
    } catch (error) {
      console.error('Giriş hatası:', error);
      return { data: null, error };
    }
  },

  // Kayıt olma
  async signUp(email, password, username) {
    try {
      console.log('Kayıt denemesi (v1):', { email, username });

      // Supabase client kontrolü
      if (!supabase?.auth) {
        console.error('Supabase client hatası:', supabase);
        throw new Error('Supabase auth başlatılamadı');
      }

      // Auth metodlarını kontrol et
      console.log('Mevcut auth metodları:', Object.keys(supabase.auth));

      // Auth ile kayıt ol (v1 API)
      const { user, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim()
          }
        }
      });

      if (error) {
        console.error('Auth hatası:', error);
        throw error;
      }

      if (!user) {
        throw new Error('Kullanıcı oluşturulamadı');
      }

      console.log('Auth kaydı başarılı:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });

      // Kullanıcı bilgilerini hazırla
      const userData = {
        id: user.id,
        email: user.email,
        username: username.trim()
      };

      // AsyncStorage'a kaydet
      await this.saveUserData(userData);

      return { data: userData, error: null };
    } catch (error) {
      console.error('Kayıt hatası:', error);
      return { data: null, error };
    }
  },

  // Çıkış yapma
  async signOut() {
    try {
      console.log('Çıkış yapılıyor...');
      
      // Supabase client kontrolü
      if (!supabase?.auth) {
        console.error('Supabase client hatası:', supabase);
        throw new Error('Supabase auth başlatılamadı');
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Çıkış hatası:', error);
        throw error;
      }
      
      await AsyncStorage.removeItem('user');
      console.log('Çıkış başarılı!');
      return { error: null };
    } catch (error) {
      console.error('Çıkış hatası:', error);
      return { error };
    }
  },

  // Mevcut kullanıcıyı alma
  async getCurrentUser() {
    try {
      // Supabase client kontrolü
      if (!supabase?.auth) {
        console.error('Supabase client hatası:', supabase);
        throw new Error('Supabase auth başlatılamadı');
      }

      // Önce AsyncStorage'dan kontrol et
      const storedUser = await this.getUserData();
      if (storedUser) {
        console.log('AsyncStorage\'dan kullanıcı bulundu:', storedUser);
        return { user: storedUser, error: null };
      }

      // Supabase'den kontrol et
      const user = supabase.auth.user();
      console.log('Supabase auth user:', user);

      if (user) {
        const userData = {
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email.split('@')[0]
        };
        // AsyncStorage'a kaydet
        await this.saveUserData(userData);
        return { user: userData, error: null };
      }

      return { user: null, error: null };
    } catch (error) {
      console.error('Kullanıcı bilgisi alma hatası:', error);
      return { user: null, error };
    }
  },

  // AsyncStorage'a kullanıcı bilgilerini kaydetme
  async saveUserData(userData) {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('Kullanıcı bilgileri kaydedildi:', userData);
    } catch (error) {
      console.error('Kullanıcı bilgileri kaydedilemedi:', error);
    }
  },

  // AsyncStorage'dan kullanıcı bilgilerini okuma
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Kullanıcı bilgileri okunamadı:', error);
      return null;
    }
  }
};
