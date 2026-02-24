import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class Stage extends Model {
  static table = 'stages';

  @text('stage_name') stageName!: string;
  @field('festival_id') festivalId!: string;
  @text('color') color!: string; // hex accent, e.g. '#FF00FF'

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
