import { Controller, Module } from "@nestjs/common";
import { UserController } from "../../user/user.controller";
import { DatabaseModule } from "src/database/database.module";
import { LeavesService } from "../leaves/leaves.service";
import { LeavesController } from "./leaves.controller";


@Module({
    imports : [DatabaseModule],
    controllers : [LeavesController, ],
    providers : [LeavesService],
    exports : [LeavesService]
} 
)
export class LeavesModule{

}  