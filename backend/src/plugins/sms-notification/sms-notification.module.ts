import { Module } from '@nestjs/common';
import { SmsNotificationPlugin } from './sms-notification.plugin';

@Module({
    providers: [SmsNotificationPlugin],
    exports: [SmsNotificationPlugin],
})
export class SmsNotificationPluginModule { }
