import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'added_leaves_by_admin', timestamps: true })
export class AddedLeavesByAdminDoc extends Document {
  @Prop({ required: true }) adminKey: string;
  @Prop({ required: true, index: true }) monthKey: string; // YYYY-MM
  @Prop({ required: true }) leaveTypeId: string;
  @Prop({ required: true }) addedLeaves: number;
  @Prop() actionDate: string;
  @Prop({ default: true }) isActive: boolean;
}
export const AddedLeavesByAdminSchema = SchemaFactory.createForClass(AddedLeavesByAdminDoc);
