import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 10,
      steps: [
        addColumns({
          table: 'festivals',
          columns: [
            { name: 'city', type: 'string', isOptional: true },
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
          ],
        }),
      ],
    },
    {
      toVersion: 9,
      steps: [
        createTable({
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
    },
    {
      toVersion: 8,
      steps: [
        addColumns({
          table: 'performances',
          columns: [
            { name: 'genre', type: 'string', isOptional: true },
            { name: 'spotify_preview_url', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        addColumns({
          table: 'stages',
          columns: [
            { name: 'color', type: 'string' },
          ],
        }),
        addColumns({
          table: 'squad_sessions',
          columns: [
            { name: 'current_location', type: 'string', isOptional: true },
            { name: 'last_updated', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        createTable({
          name: 'stages',
          columns: [
            { name: 'stage_name', type: 'string' },
            { name: 'festival_id', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'performances',
          columns: [
            { name: 'artist', type: 'string' },
            { name: 'stage_id', type: 'string' },
            { name: 'start_time', type: 'number' },
            { name: 'end_time', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        addColumns({
          table: 'squad_sessions',
          columns: [
            { name: 'current_stage_id', type: 'string', isOptional: true },
            { name: 'last_seen_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'packing_items',
          columns: [
            { name: 'price', type: 'number', isOptional: true },
            { name: 'is_group_item', type: 'boolean', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'packing_items',
          columns: [
            { name: 'squad_id', type: 'string', isOptional: true },
            { name: 'assigned_to', type: 'string', isOptional: true },
          ],
        }),
        createTable({
          name: 'squad_sessions',
          columns: [
            { name: 'squad_code', type: 'string' },
            { name: 'display_name', type: 'string' },
            { name: 'is_leader', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'packing_items',
          columns: [
            { name: 'affiliate_url', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 2,
      steps: [
        createTable({
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
      ],
    },
  ],
});
