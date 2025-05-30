import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, ActivityIndicator, ScrollView, Share, Clipboard, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import supabase from '../../supabaseClient';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [downloadingData, setDownloadingData] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ new: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [logoutModal, setLogoutModal] = useState(false);
  const [dataModal, setDataModal] = useState(false);
  const [userData, setUserData] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Use supabase.auth.user() for Supabase JS v1
        const user = supabase.auth.user();

        if (user) {
          setUser(user);

          // Kullanıcının profil verilerini veritabanından çek
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', user.id)
            .single();

          if (fetchError) {
            console.error('Profil verisi alınamadı:', fetchError.message);
            Alert.alert('Hata', 'Profil verisi alınamadı.');
          } else {
            setProfile({ username: data.username || '', email: data.email || '' });
          }
        }
      } catch (error) {
        console.error('Hata:', error);
        Alert.alert('Hata', 'Beklenmeyen bir hata oluştu.');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleProfileSave = async () => {
    if (!user) {
      Alert.alert('Hata', 'Kullanıcı bilgileri yok.');
      return;
    }

    setProfileLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: profile.username,
          email: profile.email,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profil güncellenemedi:', error.message);
        Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
      } else {
        Alert.alert('Başarılı', 'Profil güncellendi.');
        setProfileEdit(false);
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error.message);
      Alert.alert('Hata', 'Beklenmedik bir hata oluştu.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      setDownloadingData(true);
      
      // Kullanıcının duygu analizi verilerini çek
      const { data: emotionsData, error: emotionsError } = await supabase
        .from('emotions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (emotionsError) throw emotionsError;

      // Verileri düzenli bir metin formatında hazırla
      let dataText = '=== MINDMOOD VERİLERİM ===\n\n';
      
      // Kullanıcı bilgileri
      dataText += 'KULLANICI BİLGİLERİ\n';
      dataText += `Kullanıcı Adı: ${profile.username}\n`;
      dataText += `E-posta: ${profile.email}\n`;
      dataText += `İndirme Tarihi: ${new Date().toLocaleString('tr-TR')}\n\n`;
      
      // Duygu analizi verileri
      dataText += 'DUYGU ANALİZİ KAYITLARI\n';
      dataText += '------------------------\n\n';
      
      emotionsData.forEach((record, index) => {
        const date = new Date(record.created_at).toLocaleString('tr-TR');
        dataText += `Kayıt #${index + 1}\n`;
        dataText += `Tarih: ${date}\n`;
        dataText += `Metin: ${record.text}\n`;
        dataText += 'Duygular:\n';
        
        record.emotions.forEach(emotion => {
          const percentage = (emotion.score * 100).toFixed(1);
          dataText += `- ${emotion.label}: %${percentage}\n`;
        });
        
        dataText += '\n------------------------\n\n';
      });

      setUserData(dataText);
      setDataModal(true);
      setDownloadingData(false);

    } catch (error) {
      console.error('Veri indirme hatası:', error);
      Alert.alert('Hata', 'Veriler indirilirken bir hata oluştu.');
      setDownloadingData(false);
    }
  };

  const handleCopyData = async () => {
    try {
      await Clipboard.setString(userData);
      Alert.alert('Başarılı', 'Veriler panoya kopyalandı.');
    } catch (error) {
      Alert.alert('Hata', 'Veriler kopyalanırken bir hata oluştu.');
    }
  };

  const handleSaveData = async () => {
    try {
      setDownloadingData(true);

      // HTML içeriğini oluştur
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>MindMood Verilerim</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              color: #333;
            }
            h1 { 
              color: #7c1fa0; 
              text-align: center;
              font-size: 24px;
              margin-bottom: 20px;
            }
            h2 { 
              color: #7c1fa0; 
              margin-top: 20px;
              font-size: 20px;
            }
            .section { 
              margin: 20px 0;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 8px;
            }
            .record { 
              border: 1px solid #ddd; 
              padding: 15px; 
              margin: 10px 0; 
              border-radius: 8px;
              background-color: white;
            }
            .emotion { 
              margin: 5px 0;
              padding: 5px;
              background-color: #f0f0f0;
              border-radius: 4px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              padding: 20px;
              background-color: #f0f0f0;
              border-radius: 8px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
            .text {
              margin: 10px 0;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MindMood Verilerim</h1>
            <p><strong>Kullanıcı Adı:</strong> ${profile.username}</p>
            <p><strong>E-posta:</strong> ${profile.email}</p>
            <p><strong>İndirme Tarihi:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          </div>

          <div class="section">
            <h2>Duygu Analizi Kayıtları</h2>
            ${userData.split('\n\n').map(record => {
              if (record.includes('Kayıt #')) {
                const lines = record.split('\n');
                return `
                  <div class="record">
                    <div class="date">${lines[0]}</div>
                    <div class="date">${lines[1]}</div>
                    <div class="text">${lines[2]}</div>
                    <div class="emotions">
                      ${lines.slice(3).map(line => 
                        line.startsWith('-') ? `<div class="emotion">${line}</div>` : ''
                      ).join('')}
                    </div>
                  </div>
                `;
              }
              return '';
            }).join('')}
          </div>
        </body>
        </html>
      `;

      // PDF oluştur
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612, // US Letter width in points
        height: 792, // US Letter height in points
      });

      // PDF'i paylaş
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'MindMood Verilerim',
          UTI: 'com.adobe.pdf'
        });
        
        Alert.alert('Başarılı', 'PDF dosyanız oluşturuldu ve paylaşıldı.');
      } else {
        Alert.alert('Hata', 'Paylaşım özelliği kullanılamıyor.');
      }

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      Alert.alert('Hata', 'PDF oluşturulurken bir hata oluştu.');
    } finally {
      setDownloadingData(false);
    }
  };

  const handlePasswordChange = () => {
    if (!passwords.new.trim()) {
      setPasswordError('Şifre boş olamaz!');
      return;
    }
    setPasswordError(null);
    setPasswordModal(false);
    setPasswords({ new: '' });
    Alert.alert('Başarılı', 'Şifre değiştirildi (simüle).');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error.message);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Ayarlar</Text>

          {/* Profil Bilgileri */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
            {profileLoading ? (
              <ActivityIndicator size="large" color="#7c1fa0" />
            ) : (
              <>
                <Text style={styles.label}>Kullanıcı Adı</Text>
                <TextInput
                  style={styles.input}
                  value={profile.username}
                  editable={profileEdit}
                  onChangeText={(text) => setProfile({ ...profile, username: text })}
                />
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  value={profile.email}
                  editable={profileEdit}
                  onChangeText={(text) => setProfile({ ...profile, email: text })}
                  keyboardType="email-address"
                />
                <View style={styles.buttonContainer}>
                  {!profileEdit ? (
                    <TouchableOpacity onPress={() => setProfileEdit(true)} style={styles.editButton}>
                      <Text style={styles.buttonText}>Düzenle</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity onPress={handleProfileSave} disabled={profileLoading} style={styles.saveButton}>
                        {profileLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kaydet</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setProfileEdit(false); }} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>İptal</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Veri Yönetimi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
            <TouchableOpacity onPress={handleDownloadData} disabled={downloadingData} style={[styles.dataButton, downloadingData && styles.dataButtonDisabled]}>
              {downloadingData ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verilerimi İndir</Text>}
            </TouchableOpacity>
          </View>

          {/* Güvenlik */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Güvenlik</Text>
            <TouchableOpacity onPress={() => setPasswordModal(true)} style={styles.securityButton}>
              <Text style={styles.buttonText}>Şifre Değiştir</Text>
            </TouchableOpacity>
          </View>

          {/* Çıkış Yap */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hesap</Text>
            <TouchableOpacity onPress={() => setLogoutModal(true)} style={styles.logoutButton}>
              <Text style={styles.buttonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Şifre Değiştir Modal */}
      <Modal animationType="slide" transparent visible={passwordModal} onRequestClose={() => setPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setPasswordModal(false)} style={styles.closeModalButton}>
              <Text style={styles.closeModalButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <TextInput
              style={styles.input}
              placeholder="Yeni Şifre"
              value={passwords.new}
              onChangeText={(text) => setPasswords({ ...passwords, new: text })}
              secureTextEntry
            />
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            <TouchableOpacity onPress={handlePasswordChange} style={styles.modalSaveButton}>
              <Text style={styles.buttonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Çıkış Yap Modal */}
      <Modal animationType="slide" transparent visible={logoutModal} onRequestClose={() => setLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setLogoutModal(false)} style={styles.closeModalButton}>
              <Text style={styles.closeModalButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Çıkış Yap</Text>
            <Text style={styles.modalText}>Çıkış yapmak istediğinizden emin misiniz?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={() => setLogoutModal(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.modalButton, styles.logoutConfirmButton]}>
                <Text style={styles.buttonText}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Veri Görüntüleme Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dataModal}
        onRequestClose={() => setDataModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.dataModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verileriniz</Text>
              <TouchableOpacity onPress={() => setDataModal(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dataScrollView}>
              <Text style={styles.dataText}>{userData}</Text>
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={handleCopyData} style={[styles.modalButton, styles.copyButton]}>
                <Text style={styles.buttonText}>Kopyala</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveData} 
                disabled={downloadingData}
                style={[styles.modalButton, styles.saveButton]}
              >
                {downloadingData ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDataModal(false)} style={[styles.modalButton, styles.closeButton]}>
                <Text style={styles.buttonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flexGrow: 1, padding: 16, alignItems: 'center' },
  card: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, padding: 24, borderWidth: 2, borderColor: '#ee00ee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#7c1fa0', marginBottom: 16, textAlign: 'center' },
  section: { marginBottom: 24, width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#7c1fa0', marginBottom: 12 },
  label: { fontSize: 14, color: '#7c1fa0', fontWeight: '600', marginBottom: 4 },
  input: { width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 2, borderColor: '#ee00ee', marginBottom: 8, fontSize: 16, color: '#000' },
  buttonContainer: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editButton: { flex: 1, backgroundColor: '#ee00ee', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButton: { flex: 1, backgroundColor: '#7c1fa0', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { flex: 1, backgroundColor: '#d1d5db', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButtonText: { color: '#7c1fa0', fontWeight: 'bold', fontSize: 16 },
  dataButton: { width: '100%', padding: 12, backgroundColor: '#ee00ee', borderRadius: 8, alignItems: 'center' },
  dataButtonDisabled: { opacity: 0.6 },
  securityButton: { width: '100%', padding: 12, backgroundColor: '#7c1fa0', borderRadius: 8, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 2, borderColor: '#ee00ee', width: '90%', maxWidth: 360, position: 'relative' },
  closeModalButton: { position: 'absolute', top: 16, right: 16 },
  closeModalButtonText: { fontSize: 24, fontWeight: 'bold', color: '#ee00ee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#7c1fa0', marginBottom: 16 },
  modalSaveButton: { width: '100%', padding: 12, backgroundColor: '#7c1fa0', borderRadius: 8, alignItems: 'center', marginTop: 8 },
  errorText: { color: 'red', marginBottom: 8, fontSize: 14 },
  logoutButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutConfirmButton: {
    backgroundColor: '#ff4444',
  },
  dataModalContent: {
    height: '80%',
    width: '90%',
    maxWidth: 500,
  },
  dataScrollView: {
    flex: 1,
    marginVertical: 10,
  },
  dataText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButton: {
    backgroundColor: '#7c1fa0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  closeButton: {
    backgroundColor: '#666',
  },
});
