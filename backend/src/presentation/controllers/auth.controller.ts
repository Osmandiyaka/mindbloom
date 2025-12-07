import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForgotPasswordUseCase, LoginUseCase, RegisterUseCase, ResetPasswordUseCase } from '../../application/services/auth';
import { LoginDto } from '../dtos/requests/auth/login.dto';
import { RegisterDto } from '../dtos/requests/auth/register.dto';
import { ForgotPasswordDto } from '../dtos/requests/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/requests/auth/reset-password.dto';
import { LoginResponseDto } from '../dtos/responses/auth/login-response.dto';
import { UserResponseDto } from '../dtos/responses/user-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly registerUseCase: RegisterUseCase,
        private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
    ) { }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
        const result = await this.loginUseCase.execute({
            email: loginDto.email,
            password: loginDto.password,
        });

        return result;
    }

    @Post('register')
    @ApiOperation({ summary: 'User registration' })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: UserResponseDto })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
        const user = await this.registerUseCase.execute({
            email: registerDto.email,
            password: registerDto.password,
            name: registerDto.name,
            role: registerDto.role,
            tenantId: registerDto.tenantId,
        });

        return UserResponseDto.fromDomain(user);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'If an account exists, a reset link will be sent.' })
    async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: any): Promise<{ message: string }> {
        const tenantId = req?.headers?.['x-tenant-id'] as string | undefined;
        await this.forgotPasswordUseCase.execute(dto.identifier, tenantId);
        return { message: 'If an account exists, a reset link has been sent.' };
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using a reset token' })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: any): Promise<{ message: string }> {
        const tenantId = req?.headers?.['x-tenant-id'] as string | undefined;
        await this.resetPasswordUseCase.execute(dto.token, dto.password, tenantId);
        return { message: 'Password reset successful' };
    }
}
