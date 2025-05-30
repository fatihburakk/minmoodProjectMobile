import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.background}>
      <StatusBar barStyle="light-content" />
      <View style={styles.row}>
        <View style={styles.leftContent}>
          <Text style={styles.logo}>MindMood</Text>
          <Text style={styles.title}>Duygularınızı Anlayın</Text>
          <Text style={styles.subtitle}>Yapay zeka destekli günlük duygu analizi ile duygularınızı daha iyi anlayın ve yönetin.</Text>
          <Image source={require('../../assets/images/duygu_analizii.jpg')} style={styles.heroImage} resizeMode="contain" />
          <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.startButtonText}>Hemen Başla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flex: 1,
    flexDirection: width > 600 ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
    gap: 16,
  },
  leftContent: {
    flex: 1,
    alignItems: width > 600 ? 'flex-start' : 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: width > 600 ? 0 : 24,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: width > 600 ? 'left' : 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 10,
    textAlign: width > 600 ? 'left' : 'center',
    textShadowColor: 'rgba(0,0,0,0.10)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.white,
    marginBottom: 28,
    textAlign: width > 600 ? 'left' : 'center',
    opacity: 0.95,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
    alignSelf: width > 600 ? 'flex-start' : 'center',
  },
  startButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  heroImage: {
    flex: 1,
    width: width > 600 ? width * 0.35 : width * 0.7,
    height: width > 600 ? width * 0.35 : width * 0.7,
    maxWidth: 400,
    maxHeight: 400,
    borderRadius: 32,
    marginLeft: width > 600 ? 32 : 0,
    marginBottom: width > 600 ? 0 : 16,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
}); 