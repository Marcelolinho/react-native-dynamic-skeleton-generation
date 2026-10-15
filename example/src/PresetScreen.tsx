import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SkeletonContainer } from 'react-native-dynamic-skeleton-generation';
import type { SkeletonPresetName } from 'react-native-dynamic-skeleton-generation';
import { Toggle } from './Toggle';

type Field = {
  label: string;
  value: string;
};

const FIELDS: Field[] = [
  { label: 'Plan', value: 'Premium' },
  { label: 'Renews', value: '12 Nov' },
];

const SETTINGS = ['Notifications', 'Privacy', 'Language'];

function nextPreset(
  preset: SkeletonPresetName | undefined
): SkeletonPresetName | undefined {
  return preset === undefined ? 'sections' : undefined;
}

export function PresetScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [preset, setPreset] = useState<SkeletonPresetName>();

  return (
    <View style={styles.screen}>
      <View style={styles.toggles}>
        <Toggle
          label={`isLoading: ${isLoading}`}
          onPress={() => setIsLoading(!isLoading)}
        />
        <Toggle
          label={`preset: ${preset ?? 'none'}`}
          onPress={() => setPreset(nextPreset(preset))}
        />
      </View>
      <SkeletonContainer
        isLoading={isLoading}
        preset={preset}
        style={styles.content}
      >
        <View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.icon} />
              <Text style={styles.cardTitle}>Subscription</Text>
              <Text>›</Text>
            </View>
            <View style={styles.fields}>
              {FIELDS.map((field) => (
                <View key={field.label} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldValue}>{field.value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.actions}>
              <View style={styles.button}>
                <Text>Cancel</Text>
              </View>
              <View style={styles.button}>
                <Text>Upgrade</Text>
              </View>
            </View>
          </View>
        </View>
        {SETTINGS.map((setting) => (
          <View key={setting} style={styles.settingRow}>
            <View style={styles.icon} />
            <Text>{setting}</Text>
          </View>
        ))}
      </SkeletonContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 16,
  },
  toggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  card: {
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#D1D5DB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
  },
  cardTitle: {
    flex: 1,
    fontWeight: '600',
  },
  fields: {
    flexDirection: 'row',
    gap: 24,
  },
  field: {
    alignItems: 'flex-start',
    gap: 4,
  },
  fieldLabel: {
    color: '#6B7280',
  },
  fieldValue: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
});
