import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export class EmergencyCard extends Model {
  static table = 'emergency_cards';

  @text('owner_name') ownerName!: string;
  @text('blood_type') bloodType!: string;
  @text('ice_name') iceName!: string;
  @text('ice_phone') icePhone!: string;
  @text('medical_notes') medicalNotes!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
