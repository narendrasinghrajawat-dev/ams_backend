import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'attendance', timestamps: true })
export class AttendanceDoc extends Document {
  @Prop({ required: true, index: true }) userKey: string;
  @Prop({ required: true }) punchType: string;
  @Prop({ required: true }) punchTime: string;
  @Prop({ required: true }) punchDate: string;
  @Prop() lat: string;
  @Prop() long: string;
  @Prop({ default: false }) isWFH: boolean;
  @Prop({ type: Object }) deviceInformation: any;
  @Prop({ default: true }) isActive: boolean;
}
export const AttendanceSchema = SchemaFactory.createForClass(AttendanceDoc);
