import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'packing_items',
      columns: [
        { name: 'item_name', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'is_packed', type: 'boolean' },
        // Distinguishes UK rain gear vs Thailand heat essentials vs universal items
        { name: 'weather_trigger', type: 'string' },
        // Auto-managed timestamps stored as Unix ms
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
