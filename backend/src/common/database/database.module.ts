import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSchema } from '../../infrastructure/persistence/mongoose/schemas/user.schema';
import { StudentSchema } from '../../infrastructure/persistence/mongoose/schemas/student.schema';
import { ClassSchema } from '../../infrastructure/persistence/mongoose/schemas/class.schema';
import { TenantSchema } from '../../infrastructure/persistence/mongoose/schemas/tenant.schema';
import { TenantContext } from '../tenant/tenant.context';

@Global()
@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                uri: config.get('DATABASE_URL') || 'mongodb://localhost:27017/mindbloom',
            }),
        }),
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
            { name: 'Student', schema: StudentSchema },
            { name: 'Class', schema: ClassSchema },
            { name: 'Tenant', schema: TenantSchema },
        ]),
    ],
    providers: [TenantContext],
    exports: [MongooseModule, TenantContext],
})
export class DatabaseModule { }
