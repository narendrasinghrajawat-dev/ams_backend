import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'users', timestamps: true })
export class UserDoc extends Document {
  @Prop() firstName: string;
  @Prop() middleName: string;
  @Prop() lastName: string;
  @Prop({ required: true, unique: true, index: true }) email: string;
  @Prop() countryCode: string;
  @Prop() phoneNo: string;
  @Prop() username: string;
  @Prop({ unique: true, sparse: true }) employeeId: string;
  @Prop() password?: string;
  @Prop() dob?: string;
  @Prop() genderId?: string;
  @Prop() departmentId?: string;
  @Prop({ default: true }) isActive: boolean;
  @Prop() role?: string;
  @Prop() roleId?: string;
  @Prop() address?: string;
  @Prop() createdBy?: string;
  @Prop() joinedDate?: string;
  @Prop() deletedAt?: Date;
}
export const UserSchema = SchemaFactory.createForClass(UserDoc);
