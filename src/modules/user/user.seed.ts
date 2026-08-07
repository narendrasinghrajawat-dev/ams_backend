import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserDoc } from '../../database/schemas/user.schema';

export async function seedAdminUser(userModel: Model<UserDoc>) {
  const count = await userModel.countDocuments({});
  if (count === 0) {
    console.log("🌱 Seeding Default Users...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Seed Admin
    await new userModel({
      firstName: "Admin",
      lastName: "User",
      email: "admin@gmail.com",
      password: hashedPassword,
      phoneNo: "9999999999",
      countryCode: "+91",
      username: "admin",
      dob: "1990-01-01",
      roleId: "2",
      isActive: true,
      createdAt: new Date().toISOString(),
    }).save();

    // Seed Employee
    await new userModel({
      firstName: "Employee",
      lastName: "User",
      email: "employee@gmail.com",
      password: hashedPassword,
      phoneNo: "8888888888",
      countryCode: "+91",
      username: "employee",
      dob: "1995-01-01",
      roleId: "1",
      isActive: true,
      createdAt: new Date().toISOString(),
    }).save();
    console.log("✔ Default Users seeded successfully.");
  } else {
    console.log("✔ Users already exist. Skipping seed.");
  }
}
