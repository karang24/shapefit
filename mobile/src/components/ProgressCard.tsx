import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ title, current, target }) => {
  const { mode, colors } = useTheme();
  const percentage = Math.min((current / target) * 100, 100);
  const ringColor = mode === 'light' ? '#2A86FF' : '#2BE572';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.glow,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.backgroundOrb, { backgroundColor: mode === 'light' ? '#DDF1FF' : '#15304A' }]} />
      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <View style={[styles.progressBarContainer, { backgroundColor: mode === 'light' ? '#E6ECF4' : '#242B3A' }]}>
            <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: ringColor }]} />
          </View>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>LATIHAN SELESAI</Text>
        </View>
        <View style={[styles.ringOuter, { borderColor: ringColor, shadowColor: ringColor }]}>
          <View style={[styles.ringInner, { borderColor: ringColor }]}>
            <Text style={[styles.ringValue, { color: mode === 'light' ? '#1B2952' : '#E8F1FF' }]}>
              {current}/{target}
            </Text>
            <Text style={[styles.ringPercentage, { color: ringColor }]}>{Math.round(percentage)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  backgroundOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -45,
    top: -50,
    opacity: 0.28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
  caption: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  ringOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  ringInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 32,
  },
  ringPercentage: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProgressCard;
