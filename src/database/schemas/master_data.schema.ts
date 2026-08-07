import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'masterData', timestamps: true })
export class MasterDataDoc extends Document {
  @Prop({ required: true }) officeLat: string;
  @Prop({ required: true }) officeLong: string;
  @Prop({ required: true }) officeRadius: number;
  @Prop({ required: false }) maxWFHInSingleMonth?: number;

  @Prop({ type: [{ id: String, name: String }] }) leaveStatus: { id: string; name: string }[];
  @Prop({ type: [{ id: String, name: String }] }) leaveDurationsType: { id: string; name: string }[];
  @Prop({ type: [{ id: String, name: String }] }) leaveType: { id: string; name: string }[];
  @Prop({ type: [{ id: String, name: String }] }) halfDayShiftType: { id: string; name: string }[];
  @Prop({ type: [{ id: String, name: String }] }) role: { id: string; name: string }[];
  @Prop({ type: [{ id: String, name: String }] }) gender: { id: string; name: string }[];
}
export const MasterDataSchema = SchemaFactory.createForClass(MasterDataDoc);
