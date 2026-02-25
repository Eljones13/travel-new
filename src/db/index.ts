import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { migrations } from './migrations';
import { PackingItem } from '../models/PackingItem';
import { Festival } from '../models/Festival';
import { SquadSession } from '../models/SquadSession';
import { Stage } from '../models/Stage';
import { Performance } from '../models/Performance';
import { SquadMember } from '../models/SquadMember';
import { EmergencyCard } from '../models/EmergencyCard';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // jsi: true uses the synchronous JSI bridge (fastest path on device).
  // Falls back to async bridge if JSI is unavailable (e.g. some emulators).
  jsi: true,
  onSetUpError: (error) => {
    // Never surface DB setup errors to the UI — log for crash reporting
    console.error('[WatermelonDB] Setup failed:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [PackingItem, Festival, SquadSession, Stage, Performance, SquadMember, EmergencyCard],
});
