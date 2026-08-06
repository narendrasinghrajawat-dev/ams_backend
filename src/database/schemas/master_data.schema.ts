import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'masterData', timestamps: true })
export class MasterDataDoc extends Document {
  @Prop({ required: true }) officeLat: string;
  @Prop({ required: true }) officeLong: string;
  @Prop({ required: true }) officeRadius: number;
}
export const MasterDataSchema = SchemaFactory.createForClass(MasterDataDoc);
