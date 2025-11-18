import { Module } from '@nestjs/common';
import { ArangoProvider } from './arango.provider';

@Module({
  providers: [ArangoProvider],
  exports: [ArangoProvider],
})
export class DatabaseModule {}
