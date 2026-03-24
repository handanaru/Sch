import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { persons } from '../../data/persons';
import { categories } from '../../data/categories';
import { Colors } from '../../constants/colors';
import { FontSizes, Spacing, BorderRadius } from '../../constants/fonts';

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const filteredPersons = persons.filter((p) => {
    const matchCategory = !selectedCategory || p.category === selectedCategory;
    const matchSearch =
      !searchText ||
      p.name.includes(searchText) ||
      p.shortDescription.includes(searchText);
    return matchCategory && matchSearch;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 검색 */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="인물, 분야 검색..."
          placeholderTextColor={Colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
            ]}
          >
            전체
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
              selectedCategory === cat.id && { borderColor: cat.color },
            ]}
            onPress={() =>
              setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
            }
          >
            <Text style={styles.categoryChipEmoji}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.id && styles.categoryChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 인물 목록 */}
      <Text style={styles.resultCount}>
        {filteredPersons.length}명의 대가
      </Text>
      {filteredPersons.map((person) => {
        const category = categories.find((c) => c.id === person.category);
        return (
          <TouchableOpacity
            key={person.id}
            style={styles.personCard}
            onPress={() => router.push(`/routine/${person.id}-original`)}
          >
            <View style={styles.personHeader}>
              <View style={styles.personTitleRow}>
                <Text style={styles.personName}>{person.name}</Text>
                {category && (
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: category.color + '30' },
                    ]}
                  >
                    <Text style={styles.categoryBadgeIcon}>{category.icon}</Text>
                    <Text
                      style={[styles.categoryBadgeText, { color: category.color }]}
                    >
                      {category.name}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.personDesc}>{person.shortDescription}</Text>
              <Text style={styles.personTagline}>"{person.tagline}"</Text>
            </View>
            <View style={styles.personFooter}>
              <View style={styles.difficultyRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.difficultyDot,
                      {
                        color:
                          i < person.difficulty ? Colors.accent : Colors.border,
                      },
                    ]}
                  >
                    ●
                  </Text>
                ))}
                <Text style={styles.difficultyText}>
                  난이도 {person.difficulty}/5
                </Text>
              </View>
              <Text style={styles.arrowText}>루틴 보기 →</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.md,
  },
  categoryScroll: {
    marginBottom: Spacing.base,
  },
  categoryContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20',
  },
  categoryChipEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  categoryChipTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  resultCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.base,
  },
  personCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  personHeader: {
    marginBottom: Spacing.md,
  },
  personTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  personName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  categoryBadgeIcon: {
    fontSize: 12,
  },
  categoryBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  personDesc: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  personTagline: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
  },
  personFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  difficultyDot: {
    fontSize: 10,
  },
  difficultyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
  },
  arrowText: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
