import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { StudentsModule } from './modules/students/students.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { FeesModule } from './modules/fees/fees.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { LibraryModule } from './modules/library/library.module';
import { HostelModule } from './modules/hostel/hostel.module';
import { TransportModule } from './modules/transport/transport.module';
import { SetupModule } from './modules/setup/setup.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { DatabaseModule } from './common/database/database.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        DatabaseModule,
        AuthModule,
        TenantModule,
        RolesModule,
        UsersModule,
        PluginsModule,
        SubscriptionModule,
        InvitationsModule,
        StudentsModule,
        AcademicsModule,
        AttendanceModule,
        FeesModule,
        FinanceModule,
        HrModule,
        PayrollModule,
        LibraryModule,
        HostelModule,
        TransportModule,
        SetupModule,
        AdmissionsModule,
        TasksModule,
    ],
})
export class AppModule { }
