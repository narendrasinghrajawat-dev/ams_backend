import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'holidays', timestamps: true })
export class HolidaysDoc extends Document {
  @Prop({ required: true, unique: true, index: true }) date: string;
  @Prop({ required: true }) name: string;
  @Prop() type: string;
  @Prop() createdById: string;
}
export const HolidaysSchema = SchemaFactory.createForClass(HolidaysDoc);
