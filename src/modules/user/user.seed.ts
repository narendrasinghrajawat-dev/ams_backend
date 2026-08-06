import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserDoc } from '../../database/schemas/user.schema';

export async function seedAdminUser(userModel: Model<UserDoc>) {
  const count = await userModel.countDocuments({});

  if (count === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
 
    await new userModel({
      firstName: "Default Admin",
      lastName: "Manager",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "manager",
      roleId: "2",
      isActive: true,
    }).save(); 
  } else {
    console.log("✔ Users already exist. Skipping admin creation.");
  }
}
