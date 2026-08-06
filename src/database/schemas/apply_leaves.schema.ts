import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'applyLeaves', timestamps: true })
export class ApplyLeavesDoc extends Document {
  @Prop({ required: true, index: true }) userKey: string;
  @Prop({ required: true }) startDate: string;
  @Prop({ required: true }) endDate: string;
  @Prop({ required: true }) reason: string;
  @Prop({ required: true }) leaveType: string;
  @Prop({ required: true }) numberOfLeaves: number;
  @Prop() leaveDurationsType: string;
  @Prop() halfDayShiftType: string;
  @Prop({ default: true }) isActive: boolean;
  @Prop({ default: 'Pending' }) leaveStatus: string; // Pending, Approved, Rejected
  @Prop() actionDate: string;
  @Prop() approverByName: string;
  @Prop() approverByKey: string;
}
export const ApplyLeavesSchema = SchemaFactory.createForClass(ApplyLeavesDoc);
