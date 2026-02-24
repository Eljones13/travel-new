import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class SquadSession extends Model {
  static table = 'squad_sessions';

  @text('squad_code') squadCode!: string;
  @text('display_name') displayName!: string;
  @field('is_leader') isLeader!: boolean;

  // Rave Radar v6 (ID-based, kept for DB continuity — not used in UI)
  @field('current_stage_id') currentStageId!: string;
  @field('last_seen_at') lastSeenAt!: number;

  // Rave Radar v7 (name-based — displayable without a join)
  @text('current_location') currentLocation!: string;
  @field('last_updated') lastUpdated!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
