import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function HeroBanner({ imageUri, brandName, brandLogo, badge = 'EXCLUSIVE REWARD' }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.wrap}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: c.primarySoft }]} />
      )}
      <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradient}>
        <View style={styles.content}>
          {brandLogo ? (
            <View style={styles.logoWrap}>
              <Image source={{ uri: brandLogo }} style={styles.logo} contentFit="contain" />
            </View>
          ) : null}
          <View style={styles.textCol}>
            <Text style={[styles.badge, { backgroundColor: c.primarySoft, color: c.primary }]}>{badge}</Text>
            <Text style={styles.heading}>{brandName} vouchers</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  textCol: {
    flex: 1,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'capitalize',
  },
});
