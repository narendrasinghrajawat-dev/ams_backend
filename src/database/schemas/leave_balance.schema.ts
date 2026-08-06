import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'leaveBalance', timestamps: true })
export class LeaveBalanceDoc extends Document {
  @Prop({ required: true, index: true }) userKey: string;
  @Prop({ type: [{ id: String, name: String, balance: Number, total: Number }] }) leavesBalance: Array<{
    id: string;
    name: string;
    balance: number;
    total: number;
  }>;
  @Prop({ default: true }) isActive: boolean;
}
export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalanceDoc);
