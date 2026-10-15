import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SkeletonContainer } from 'react-native-dynamic-skeleton-generation';
import type { SkeletonAnimation } from 'react-native-dynamic-skeleton-generation';
import { Toggle } from './Toggle';

type Profile = {
  name: string;
  bio: string;
  status: string;
};

type Post = {
  id: string;
  title: string;
};

const AVATAR_URI = 'https://reactnative.dev/img/tiny_logo.png';

const MAX_LAYER_OPTIONS = [Infinity, 1, 2, 3];

const LOADING_PROFILE: Profile = {
  name: 'Loading name',
  bio: 'Loading a short biography line',
  status: '',
};

const LOADED_PROFILE: Profile = {
  name: 'Ada Lovelace',
  bio: 'Mathematician and first programmer',
  status: 'Online',
};

const LOADED_POSTS: Post[] = [
  { id: '1', title: 'Notes on the Analytical Engine' },
  { id: '2', title: 'Sketch of a calculating machine' },
  { id: '3', title: 'Letters to Charles Babbage' },
];

function nextMaxLayer(maxLayer: number): number {
  const nextIndex =
    (MAX_LAYER_OPTIONS.indexOf(maxLayer) + 1) % MAX_LAYER_OPTIONS.length;

  return MAX_LAYER_OPTIONS[nextIndex] ?? Infinity;
}

function renderPost({ item }: { item: Post }) {
  return (
    <View style={styles.post}>
      <Text>{item.title}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [animation, setAnimation] = useState<SkeletonAnimation>('pulse');
  const [fadeSwap, setFadeSwap] = useState(false);
  const [maxLayer, setMaxLayer] = useState(Infinity);
  const profile = isLoading ? LOADING_PROFILE : LOADED_PROFILE;
  const posts = isLoading ? [] : LOADED_POSTS;

  return (
    <View style={styles.screen}>
      <View style={styles.toggles}>
        <Toggle
          label={`isLoading: ${isLoading}`}
          onPress={() => setIsLoading(!isLoading)}
        />
        <Toggle
          label={`animation: ${animation}`}
          onPress={() => setAnimation(animation === 'pulse' ? 'none' : 'pulse')}
        />
        <Toggle
          label={`fadeSwap: ${fadeSwap}`}
          onPress={() => setFadeSwap(!fadeSwap)}
        />
        <Toggle
          label={`maxLayer: ${maxLayer}`}
          onPress={() => setMaxLayer(nextMaxLayer(maxLayer))}
        />
      </View>
      <SkeletonContainer
        isLoading={isLoading}
        animation={animation}
        fadeSwap={fadeSwap}
        maxLayer={maxLayer}
        style={styles.content}
      >
        <View style={styles.header}>
          <Image source={{ uri: AVATAR_URI }} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text>{profile.bio}</Text>
            <Text>{profile.status}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Latest activity</Text>
          <Text>Published three new articles this week</Text>
        </View>
        <FlatList
          style={styles.posts}
          data={posts}
          keyExtractor={(post) => post.id}
          renderItem={renderPost}
        />
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  headerText: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  card: {
    alignItems: 'flex-start',
    padding: 16,
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cardTitle: {
    fontWeight: '600',
  },
  posts: {
    flex: 1,
  },
  post: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
});
