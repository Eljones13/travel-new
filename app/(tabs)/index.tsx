import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { withObservables, useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../src/db';
import { PackingItem, WeatherTrigger } from '../../src/models/PackingItem';

// ── Row Component ──────────────────────────────────────────────────────────────
// Each row independently observes its own record so only the toggled row re-renders.

type RowBaseProps = { item: PackingItem };

const PackingItemRowBase = ({ item }: RowBaseProps) => {
  const db = useDatabase();

  const togglePacked = useCallback(async () => {
    await db.write(async () => {
      await item.update((record) => {
        record.isPacked = !record.isPacked;
      });
    });
  }, [item, db]);

  const openAffiliate = useCallback(() => {
    if (!item.affiliateUrl) return;
    if (Platform.OS === 'web') {
      window.open(item.affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(item.affiliateUrl);
    }
  }, [item.affiliateUrl]);

  return (
    <TouchableOpacity style={styles.row} onPress={togglePacked} activeOpacity={0.7}>
      <View style={[styles.checkbox, item.isPacked && styles.checkboxChecked]}>
        {item.isPacked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.itemName, item.isPacked && styles.itemNamePacked]}>
          {item.itemName}
        </Text>
        {item.category ? (
          <Text style={styles.category}>{item.category}</Text>
        ) : null}
        {item.weatherTrigger !== 'none' ? (
          <Text style={styles.weatherBadge}>{item.weatherTrigger.replace('_', ' ')}</Text>
        ) : null}
        {item.assignedTo ? (
          <Text style={styles.assignedTo}>→ {item.assignedTo}</Text>
        ) : null}
      </View>
      {item.affiliateUrl ? (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={openAffiliate}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const PackingItemRow = withObservables(['item'], ({ item }: RowBaseProps) => ({
  item: item.observe(),
}))(PackingItemRowBase);

// ── List Component ─────────────────────────────────────────────────────────────
// Driven by withObservables: re-renders the instant a DB write commits. No loading states.

type ListBaseProps = { packingItems: PackingItem[] };

const PackingListBase = ({ packingItems }: ListBaseProps) => {
  const db = useDatabase();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');

  const addItem = useCallback(async () => {
    const trimmed = itemName.trim();
    if (!trimmed) {
      Alert.alert('Item name required', 'Enter a name before adding to your pack.');
      return;
    }

    // Write to local SQLite — zero network path, no spinner
    await db.write(async () => {
      await db.get<PackingItem>('packing_items').create((record) => {
        record.itemName = trimmed;
        record.category = category.trim() || 'General';
        record.isPacked = false;
        record.weatherTrigger = 'none' as WeatherTrigger;
      });
    });

    setItemName('');
    setCategory('');
  }, [itemName, category, db]);

  const packedCount = packingItems.filter((i) => i.isPacked).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Add Item Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Add item (e.g. Tent, Rain poncho...)"
          placeholderTextColor="#555"
          value={itemName}
          onChangeText={setItemName}
          onSubmitEditing={addItem}
          returnKeyType="done"
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.input, styles.inputSecondary]}
          placeholder="Category (e.g. Shelter, Clothing)"
          placeholderTextColor="#555"
          value={category}
          onChangeText={setCategory}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>ADD TO PACK</Text>
        </TouchableOpacity>
      </View>

      {/* Item Count */}
      <Text style={styles.countText}>
        {packedCount} / {packingItems.length} packed
      </Text>

      {/* FlashList — recycled cells, fast for large packing lists */}
      <FlashList
        data={packingItems}
        renderItem={({ item }) => <PackingItemRow item={item} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Your pack is empty.{'\n'}Add your first item above.
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
};

// Subscribe to ALL packing_items sorted by creation time.
// The observable fires instantly on each DB write — no async state needed.
const EnhancedPackingList = withObservables([], () => ({
  packingItems: database
    .get<PackingItem>('packing_items')
    .query(Q.sortBy('created_at', Q.asc))
    .observe(),
}))(PackingListBase);

export default function PackingListScreen() {
  return <EnhancedPackingList />;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  form: {
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputSecondary: {
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  countText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1E1E1E',
    minHeight: 60,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
  },
  itemName: {
    color: '#FFF',
    fontSize: 16,
  },
  itemNamePacked: {
    color: '#555',
    textDecorationLine: 'line-through',
  },
  category: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  weatherBadge: {
    color: '#FF6B35',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignedTo: {
    color: '#FF00FF',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  cartButton: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    fontSize: 18,
  },
  emptyText: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
});
