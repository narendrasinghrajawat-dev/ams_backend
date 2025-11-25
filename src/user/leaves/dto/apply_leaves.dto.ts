import { IsString, IsNotEmpty, IsObject, IsNumber, ValidateNested, isNotEmpty, IsBoolean } from "class-validator";


export class ApplyLeavesDto{

    @IsString()
    @IsNotEmpty()
    userKey : string;

    @IsString()
    @IsNotEmpty()
    startDate : string;

    @IsString()
    @IsNotEmpty()
    endDate : string;

    @IsString()
    @IsNotEmpty()
    reason : string;
    
    
    @IsString()
    @IsNotEmpty()
    leaveType : string;

    @IsNumber()
    @IsNotEmpty()
    numberOfLeaves : number;

    @IsBoolean()
    @IsNotEmpty()
    isFullDay : boolean;
    
    
    @IsBoolean()
    @IsNotEmpty()
    isHalfDay : boolean;
    

}