import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export type FestivalTrigger = 'wet' | 'beach' | 'none';

export class Festival extends Model {
  static table = 'festivals';

  @text('festival_name') festivalName!: string;
  @text('country') country!: string;
  @field('start_date') startDate!: number;
  @field('end_date') endDate!: number;
  @field('lat') lat!: number;
  @field('lng') lng!: number;
  @field('trigger') trigger!: FestivalTrigger;
  @field('is_attending') isAttending!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
