import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MasterDataDoc } from 'src/database/schemas/master_data.schema';
import { formatMongoDoc } from 'src/utills/db-helper';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectModel(MasterDataDoc.name) private readonly masterDataModel: Model<MasterDataDoc>,
  ) {}

  async getMasterData() {
    const masterData = await this.masterDataModel.findOne({}).lean();

    return {
      message: 'Master data fetched successfully',
      statusCode: 200,
      data: formatMongoDoc(masterData),
    };
  }
}
