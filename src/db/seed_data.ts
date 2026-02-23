import { Database } from '@nozbe/watermelondb';
import { PackingItem, WeatherTrigger } from '../models/PackingItem';

type SeedItem = {
  itemName: string;
  category: string;
  weatherTrigger: WeatherTrigger;
};

const SEED_ITEMS: SeedItem[] = [
  // Universal Essentials
  { itemName: 'High-fidelity Earplugs',  category: 'Safety',       weatherTrigger: 'universal' },
  { itemName: 'Hydration Pack',           category: 'Gear',         weatherTrigger: 'universal' },
  { itemName: 'Portable Power Bank',      category: 'Electronics',  weatherTrigger: 'universal' },
  { itemName: 'Tent',                     category: 'Camping',      weatherTrigger: 'universal' },
  { itemName: 'Sleeping Bag',             category: 'Camping',      weatherTrigger: 'universal' },
  { itemName: 'Sunscreen SPF 50',         category: 'Health',       weatherTrigger: 'universal' },
  { itemName: 'First Aid Kit',            category: 'Safety',       weatherTrigger: 'universal' },
  { itemName: 'Hand Sanitiser',           category: 'Health',       weatherTrigger: 'universal' },
  // UK Rain Gear
  { itemName: 'Wellington Boots',         category: 'Footwear',     weatherTrigger: 'uk_rain' },
  { itemName: 'Heavy Rain Poncho',        category: 'Clothing',     weatherTrigger: 'uk_rain' },
  { itemName: 'Mud-proof Tent Pegs',      category: 'Camping',      weatherTrigger: 'uk_rain' },
  { itemName: 'Waterproof Jacket',        category: 'Clothing',     weatherTrigger: 'uk_rain' },
  { itemName: 'Thermal Base Layer',       category: 'Clothing',     weatherTrigger: 'uk_rain' },
  { itemName: 'Waterproof Dry Bag',       category: 'Gear',         weatherTrigger: 'uk_rain' },
  // Thailand Heat Gear
  { itemName: 'Electrolyte Powders',      category: 'Health',       weatherTrigger: 'thailand_heat' },
  { itemName: 'UV-Protection Sunglasses', category: 'Safety',       weatherTrigger: 'thailand_heat' },
  { itemName: 'Handheld Misting Fan',     category: 'Gear',         weatherTrigger: 'thailand_heat' },
  { itemName: 'Cooling Towel',            category: 'Health',       weatherTrigger: 'thailand_heat' },
  { itemName: 'Breathable Linen Shirt',   category: 'Clothing',     weatherTrigger: 'thailand_heat' },
  { itemName: 'Insect Repellent',         category: 'Health',       weatherTrigger: 'thailand_heat' },
];

/**
 * Populates packing_items with festival essentials on first install.
 * Safe to call on every app start — exits immediately if any items exist.
 * All writes are local SQLite (offline, instant, no spinner).
 */
export async function seedDatabase(db: Database): Promise<void> {
  const existingCount = await db.get<PackingItem>('packing_items').query().fetchCount();
  if (existingCount > 0) return;

  // Single atomic transaction — all 20 items commit together or not at all
  await db.write(async () => {
    await Promise.all(
      SEED_ITEMS.map((seed) =>
        db.get<PackingItem>('packing_items').create((record) => {
          record.itemName = seed.itemName;
          record.category = seed.category;
          record.isPacked = false;
          record.weatherTrigger = seed.weatherTrigger;
        })
      )
    );
  });
}
