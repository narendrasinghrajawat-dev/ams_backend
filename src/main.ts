import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ArangoProvider } from './database/arango.provider';
import { seedAdminUser } from './user/user.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   const db = app.get(ArangoProvider).getDb();
  await seedAdminUser(db);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
