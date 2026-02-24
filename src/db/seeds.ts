import { Database } from '@nozbe/watermelondb';
import { Festival } from '../models/Festival';

/**
 * Seeds the festivals table on first install.
 * Safe to call on every app start — exits immediately if any festivals exist.
 */
export async function seedFestivals(db: Database): Promise<void> {
  const existingCount = await db.get<Festival>('festivals').query().fetchCount();
  if (existingCount > 0) return;

  await db.write(async () => {
    await db.get<Festival>('festivals').create((r) => {
      r.festivalName = 'S2O Songkran';
      r.country = 'Thailand';
      r.startDate = new Date('2026-04-11').getTime();
      r.endDate = new Date('2026-04-13').getTime();
      r.lat = 13.75;
      r.lng = 100.5;
      r.trigger = 'wet';
      r.isAttending = false;
    });

    await db.get<Festival>('festivals').create((r) => {
      r.festivalName = 'Hideout Festival';
      r.country = 'Croatia';
      r.startDate = new Date('2026-06-30').getTime();
      r.endDate = new Date('2026-07-03').getTime();
      r.lat = 44.55;
      r.lng = 14.88;
      r.trigger = 'beach';
      r.isAttending = false;
    });
  });
}
