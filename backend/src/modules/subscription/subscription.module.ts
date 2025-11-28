import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/subscription.schema';
import { MongooseSubscriptionRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-subscription.repository';
import { SUBSCRIPTION_REPOSITORY } from '../../domain/ports/out/subscription-repository.port';
import { GetSubscriptionUseCase, ChangePlanUseCase } from '../../application/services/subscription';
import { SubscriptionController } from '../../presentation/controllers/subscription.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Subscription', schema: SubscriptionSchema },
        ]),
    ],
    controllers: [SubscriptionController],
    providers: [
        { provide: SUBSCRIPTION_REPOSITORY, useClass: MongooseSubscriptionRepository },
        GetSubscriptionUseCase,
        ChangePlanUseCase,
    ],
    exports: [
        SUBSCRIPTION_REPOSITORY,
        GetSubscriptionUseCase,
        ChangePlanUseCase,
    ],
})
export class SubscriptionModule { }
