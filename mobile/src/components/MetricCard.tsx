import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  decorationIcon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, decorationIcon }) => {
  const { mode, colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: mode === 'light' ? '#F6FBFF' : colors.surfaceSoft,
          borderColor: mode === 'light' ? '#BDE3FF' : '#4EE5FF',
          shadowColor: mode === 'light' ? '#9FD8FF' : '#4EE5FF',
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>
        {value}
        {unit && <Text style={[styles.unit, { color: mode === 'light' ? '#2A86FF' : '#66D9FF' }]}> {unit}</Text>}
      </Text>
      {decorationIcon ? <View style={styles.decoration}>{decorationIcon}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 9,
    elevation: 7,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 38,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  unit: {
    fontSize: 24,
    fontWeight: 'normal',
  },
  decoration: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    opacity: 0.25,
  },
});

export default MetricCard;
