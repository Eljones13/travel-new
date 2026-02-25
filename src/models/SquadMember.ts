import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class SquadMember extends Model {
  static table = 'squad_members';

  @text('squad_code') squadCode!: string;
  @text('display_name') displayName!: string;
  @field('lat') lat!: number;
  @field('lng') lng!: number;
  @field('last_seen_at') lastSeenAt!: number;
  @field('is_sos') isSos!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
