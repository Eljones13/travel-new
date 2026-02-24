import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 8,
  tables: [
    tableSchema({
      name: 'packing_items',
      columns: [
        { name: 'item_name', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'is_packed', type: 'boolean' },
        { name: 'weather_trigger', type: 'string' },
        { name: 'affiliate_url', type: 'string', isOptional: true },
        // Squad Sync
        { name: 'squad_id', type: 'string', isOptional: true },
        { name: 'assigned_to', type: 'string', isOptional: true },
        // Budget tracker
        { name: 'price', type: 'number', isOptional: true },
        { name: 'is_group_item', type: 'boolean', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'squad_sessions',
      columns: [
        { name: 'squad_code', type: 'string' },
        { name: 'display_name', type: 'string' },
        { name: 'is_leader', type: 'boolean' },
        // Rave Radar v6 (ID-based, kept for migration continuity)
        { name: 'current_stage_id', type: 'string', isOptional: true },
        { name: 'last_seen_at', type: 'number', isOptional: true },
        // Rave Radar v7 (name-based, used in UI — no join required)
        { name: 'current_location', type: 'string', isOptional: true },
        { name: 'last_updated', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'festivals',
      columns: [
        { name: 'festival_name', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'start_date', type: 'number' },
        { name: 'end_date', type: 'number' },
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'trigger', type: 'string' },
        { name: 'is_attending', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'stages',
      columns: [
        { name: 'stage_name', type: 'string' },
        { name: 'festival_id', type: 'string' }, // matches festival_name from festivals table
        { name: 'color', type: 'string' },        // hex accent color for this stage
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'performances',
      columns: [
        { name: 'artist', type: 'string' },
        { name: 'stage_id', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number' },
        { name: 'genre', type: 'string', isOptional: true },
        { name: 'spotify_preview_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
