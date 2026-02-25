import { Model } from '@nozbe/watermelondb';
import { date, field, readonly, text } from '@nozbe/watermelondb/decorators';

export type FestivalTrigger = 'wet' | 'beach' | 'none';

export class Festival extends Model {
  static table = 'festivals';

  @text('festival_name') festivalName!: string;
  @text('city') city!: string;
  @text('country') country!: string;
  @field('start_date') startDate!: number;
  @field('end_date') endDate!: number;
  @field('lat') lat!: number;
  @field('lng') lng!: number;
  @field('trigger') trigger!: FestivalTrigger;
  @field('is_attending') isAttending!: boolean;

  // Discovery HUD fields (v10)
  @text('vibe') vibe!: string;
  @field('camping') camping!: boolean;
  @field('expected_attendance') expectedAttendance!: number;
  @text('primary_language') primaryLanguage!: string;
  @text('medical_doctor') medicalDoctor!: string;
  @text('medical_allergy') medicalAllergy!: string;
  @text('legal_free_to_go') legalFreeToGo!: string;
  @text('legal_call_embassy') legalCallEmbassy!: string;
  @text('script_lost_squad') scriptLostSquad!: string;
  @text('script_substance') scriptSubstance!: string;
  @text('script_medical_tent') scriptMedicalTent!: string;
  @text('script_charging') scriptCharging!: string;
  @field('safety_score') safetyScore!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
