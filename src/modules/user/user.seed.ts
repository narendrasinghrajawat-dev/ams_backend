import { aql } from 'arangojs';
import * as bcrypt from 'bcrypt';

export async function seedAdminUser(db) {
  // Count existing users
  const cursor = await db.query(aql`
    RETURN LENGTH(FOR u IN users RETURN 1)
  `);
  
  const count = await cursor.next();

  if (count === 0) {

    const hashedPassword = await bcrypt.hash("admin123", 10);
 
    await db.collection("users").save({
      name: "Default Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "manager"
    }); 

  } else {
    console.log("✔ Users already exist. Skipping admin creation.");
  }
}
