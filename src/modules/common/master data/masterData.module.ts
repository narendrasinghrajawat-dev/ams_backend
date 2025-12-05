import { Module } from '@nestjs/common';
import { MasterDataController } from './masterData.controller';
import { MasterDataService } from './masterData.service';

@Module({
    imports:[],
  controllers: [MasterDataController],
  providers: [MasterDataService],
})
export class MasterDataModule {}
