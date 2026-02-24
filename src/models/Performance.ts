import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class Performance extends Model {
  static table = 'performances';

  @text('artist') artist!: string;
  @field('stage_id') stageId!: string;
  @field('start_time') startTime!: number;
  @field('end_time') endTime!: number;
  @text('genre') genre!: string;
  @text('spotify_preview_url') spotifyPreviewUrl!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
