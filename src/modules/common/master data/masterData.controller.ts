import { Controller, Get } from '@nestjs/common';
import { MasterDataService } from './masterData.service';

@Controller('masterdata')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get()
  getMasterData() {
    return this.masterDataService.getMasterData();
   }
}
   