import { Check } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function VoucherTicket({
  title,
  category,
  expiryText,
  brandLogo,
  stepsPrice,
  canAfford,
  isClaimed,
  isClaiming,
  onClaim,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={[styles.brandCol, { backgroundColor: c.screenBg, borderRightColor: c.cardBorder }]}>
        {brandLogo ? (
          <Image source={{ uri: brandLogo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: c.primarySoft }]} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.category, { color: c.primary }]}>{category?.toUpperCase()}</Text>
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        {expiryText ? <Text style={[styles.expiry, { color: c.textMuted }]}>{expiryText}</Text> : null}
        <View style={styles.footer}>
          <Pressable
            onPress={onClaim}
            disabled={isClaimed || isClaiming || !canAfford}
            style={[
              styles.btn,
              isClaimed && { backgroundColor: c.success },
              isClaiming && { backgroundColor: c.textMuted },
              !isClaimed && !isClaiming && canAfford && { backgroundColor: c.primary },
              !isClaimed && !isClaiming && !canAfford && { backgroundColor: c.cardBorder },
            ]}
          >
            {isClaiming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isClaimed ? (
              <View style={styles.claimedRow}>
                <Check size={14} color="#fff" strokeWidth={3} />
                <Text style={styles.btnText}>Claimed</Text>
              </View>
            ) : (
              <Text style={[styles.btnText, !canAfford && { color: c.textMuted }]}>
                {stepsPrice?.toLocaleString()} Steps
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 120,
  },
  brandCol: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRightWidth: 1,
    borderStyle: 'dashed',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  expiry: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  claimedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
