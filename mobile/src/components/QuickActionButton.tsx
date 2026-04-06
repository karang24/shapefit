import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface QuickActionButtonProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  color?: string;
  variant?: 'default' | 'compact';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  icon,
  onPress,
  color = '#4CAF50',
  variant = 'default',
}) => {
  const { mode, colors } = useTheme();
  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity style={[styles.container, isCompact && styles.compactContainer]} onPress={onPress}>
      <View
        style={[
          styles.iconContainer,
          isCompact && styles.iconCompact,
          {
            borderColor: color,
            shadowColor: color,
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#121A2A',
            shadowOpacity: mode === 'light' ? 0.28 : 0.55,
          },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.title, isCompact && styles.compactTitle, { color: colors.textPrimary }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  compactContainer: {
    flex: 0,
    width: 150,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 9,
  },
  iconCompact: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  title: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  compactTitle: {
    marginTop: 4,
  },
});

export default QuickActionButton;
