import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// Version 1: initial schema — no migration steps needed.
// Every future schema change (addColumns, createTable) gets a toVersion: N entry here.
export const migrations = schemaMigrations({
  migrations: [],
});
