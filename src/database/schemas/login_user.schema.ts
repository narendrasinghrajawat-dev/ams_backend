import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'loginUsers', timestamps: true })
export class LoginUserDoc extends Document {
  @Prop({ required: true, index: true }) userKey: string;
  @Prop() email: string;
  @Prop({ required: true }) loginAt: string;
  @Prop() lat: string;
  @Prop() long: string;
  @Prop({ type: Object }) deviceInformation: any;
  @Prop() status: string;
  @Prop({ default: true }) isActive: boolean;
}
export const LoginUserSchema = SchemaFactory.createForClass(LoginUserDoc);
