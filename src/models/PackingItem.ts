import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export type WeatherTrigger = 'uk_rain' | 'thailand_heat' | 'universal' | 'none';

export class PackingItem extends Model {
  static table = 'packing_items';

  @text('item_name') itemName!: string;
  @text('category') category!: string;
  @field('is_packed') isPacked!: boolean;
  @field('weather_trigger') weatherTrigger!: WeatherTrigger;
  @field('affiliate_url') affiliateUrl!: string;
  @field('squad_id') squadId!: string;
  @field('assigned_to') assignedTo!: string;
  @field('price') price!: number;
  @field('is_group_item') isGroupItem!: boolean;

  // System-managed: set automatically on create/update, never by user code
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
