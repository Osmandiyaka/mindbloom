import { PartialType } from '@nestjs/mapped-types';
import { CreateFeePlanDto } from './create-fee-plan.dto';

export class UpdateFeePlanDto extends PartialType(CreateFeePlanDto) {}
