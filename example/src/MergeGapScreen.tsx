import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SkeletonContainer } from 'react-native-dynamic-skeleton-generation';
import { Toggle } from './Toggle';

type MergeGapStep = {
  value: number | undefined;
  merges: string;
};

const MERGE_GAP_STEPS: MergeGapStep[] = [
  { value: undefined, merges: 'nothing, one bone per leaf' },
  { value: 4, merges: 'the meta row (gaps of 4)' },
  { value: 6, merges: 'the meta row and the tags (gaps of 6)' },
  { value: 12, merges: 'also icon + title in every list row (gap of 12)' },
  { value: 400, merges: 'also the chevrons; titles and subtitles stay apart' },
];

const TAGS = ['Design', 'Mobile', 'Open source'];

const ROWS = [
  { title: 'Account', subtitle: 'Name, email and password' },
  { title: 'Billing', subtitle: 'Plan and payment method' },
];

function nextStep(index: number): number {
  return (index + 1) % MERGE_GAP_STEPS.length;
}

export function MergeGapScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const step = MERGE_GAP_STEPS[stepIndex]!;

  return (
    <View style={styles.screen}>
      <View style={styles.toggles}>
        <Toggle
          label={`isLoading: ${isLoading}`}
          onPress={() => setIsLoading(!isLoading)}
        />
        <Toggle
          label={`mergeGap: ${step.value ?? 'off'}`}
          onPress={() => setStepIndex(nextStep(stepIndex))}
        />
      </View>
      <Text style={styles.caption}>{`Merges ${step.merges}`}</Text>
      <SkeletonContainer
        isLoading={isLoading}
        mergeGap={step.value}
        style={styles.content}
      >
        <View style={styles.metaRow}>
          <View style={styles.smallIcon} />
          <Text style={styles.meta}>5 min read</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>Updated today</Text>
        </View>
        <View style={styles.tags}>
          {TAGS.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
        {ROWS.map((row) => (
          <View key={row.title} style={styles.listRow}>
            <View style={styles.rowStart}>
              <View style={styles.icon} />
              <Text style={styles.rowTitle}>{row.title}</Text>
            </View>
            <Text>›</Text>
          </View>
        ))}
        {ROWS.map((row) => (
          <View key={row.subtitle} style={styles.twoLines}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.meta}>{row.subtitle}</Text>
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
  caption: {
    color: '#6B7280',
  },
  content: {
    flex: 1,
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  meta: {
    color: '#6B7280',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#9CA3AF',
  },
  rowTitle: {
    fontWeight: '600',
  },
  twoLines: {
    gap: 2,
  },
});
