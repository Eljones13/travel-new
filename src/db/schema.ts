import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 10,
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
        { name: 'city', type: 'string', isOptional: true },
        { name: 'country', type: 'string' },
        { name: 'start_date', type: 'number' },
        { name: 'end_date', type: 'number' },
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'trigger', type: 'string' },
        { name: 'is_attending', type: 'boolean' },
        // Discovery HUD fields (v10)
        { name: 'vibe', type: 'string', isOptional: true },
        { name: 'camping', type: 'boolean', isOptional: true },
        { name: 'expected_attendance', type: 'number', isOptional: true },
        { name: 'primary_language', type: 'string', isOptional: true },
        { name: 'medical_doctor', type: 'string', isOptional: true },
        { name: 'medical_allergy', type: 'string', isOptional: true },
        { name: 'legal_free_to_go', type: 'string', isOptional: true },
        { name: 'legal_call_embassy', type: 'string', isOptional: true },
        { name: 'script_lost_squad', type: 'string', isOptional: true },
        { name: 'script_substance', type: 'string', isOptional: true },
        { name: 'script_medical_tent', type: 'string', isOptional: true },
        { name: 'script_charging', type: 'string', isOptional: true },
        { name: 'safety_score', type: 'number', isOptional: true },
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
    tableSchema({
      name: 'squad_members',
      columns: [
        { name: 'squad_code', type: 'string' },
        { name: 'display_name', type: 'string' },
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'last_seen_at', type: 'number' },
        { name: 'is_sos', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
