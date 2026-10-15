import { Pressable, StyleSheet, Text } from 'react-native';

type ToggleProps = {
  label: string;
  onPress: () => void;
};

export function Toggle({ label, onPress }: ToggleProps) {
  return (
    <Pressable style={styles.toggle} onPress={onPress}>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  toggleLabel: {
    color: '#FFFFFF',
  },
});
