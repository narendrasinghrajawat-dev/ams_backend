import { Module } from '@nestjs/common';
import { ArangoProvider } from './arango.provider';

@Module({
  providers: [
    {
      provide: 'ARANGO_CONNECTION',
      useClass: ArangoProvider,
    },
  ],
  exports: ['ARANGO_CONNECTION'],
})
export class DatabaseModule {}
