import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DummyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bu ekran yakında eklenecek!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#888',
  },
}); 