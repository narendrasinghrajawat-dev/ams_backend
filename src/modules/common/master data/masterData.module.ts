import { Module } from '@nestjs/common';
import { MasterDataController } from './masterData.controller';
import { MasterDataService } from './masterData.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports : [DatabaseModule],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService]
})
export class MasterDataModule {}
  