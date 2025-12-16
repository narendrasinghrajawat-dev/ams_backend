import { Controller, Get, UseGuards } from '@nestjs/common';
import { MasterDataService } from './masterData.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';
import { RolesGuard } from 'src/modules/auth/roles.guard';
import { Roles } from 'src/modules/auth/roles.decorator';
import { Role } from 'src/modules/auth/roles.enum';

@Controller('masterdata')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}


  @Get()
  getMasterData() {
    return this.masterDataService.getMasterData();
   }
}