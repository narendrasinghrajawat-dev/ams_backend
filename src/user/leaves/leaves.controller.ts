import { Controller, Get, Param } from "@nestjs/common";
import { LeavesService } from "./leaves.service";


@Controller('leaves')
export class LeavesController {

    constructor(private LeavesService : LeavesService){}

    @Get('getLeavesStatus/:key')
    getLeavesStatusByUserKey(@Param("key") userKey : string){
       return this.LeavesService.getLeavesStatusByUserKey(userKey)
    }
}  