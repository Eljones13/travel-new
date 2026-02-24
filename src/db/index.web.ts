import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { schema } from './schema';
import { migrations } from './migrations';
import { PackingItem } from '../models/PackingItem';
import { Festival } from '../models/Festival';
import { SquadSession } from '../models/SquadSession';
import { Stage } from '../models/Stage';
import { Performance } from '../models/Performance';

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Web setup failed:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [PackingItem, Festival, SquadSession, Stage, Performance],
});
