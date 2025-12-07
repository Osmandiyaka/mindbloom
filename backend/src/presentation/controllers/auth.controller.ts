import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForgotPasswordUseCase, LoginUseCase, RegisterUseCase, ResetPasswordUseCase, RefreshTokenUseCase, LogoutUseCase } from '../../application/services/auth';
import { LoginDto } from '../dtos/requests/auth/login.dto';
import { RegisterDto } from '../dtos/requests/auth/register.dto';
import { ForgotPasswordDto } from '../dtos/requests/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/requests/auth/reset-password.dto';
import { LoginResponseDto } from '../dtos/responses/auth/login-response.dto';
import { UserResponseDto } from '../dtos/responses/user-response.dto';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly registerUseCase: RegisterUseCase,
        private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly configService: ConfigService,
    ) { }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
        const { refreshToken, refreshTokenExpiresAt, ...result } = await this.loginUseCase.execute({
            email: loginDto.email,
            password: loginDto.password,
        });

        this.setRefreshTokenCookie(res, refreshToken, refreshTokenExpiresAt);
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

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed', type: LoginResponseDto })
    async refresh(@Req() req: Request & { cookies?: Record<string, string> }, @Res({ passthrough: true }) res: Response): Promise<LoginResponseDto> {
        const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
        const { refreshToken: newToken, refreshTokenExpiresAt, ...result } = await this.refreshTokenUseCase.execute(refreshToken);
        this.setRefreshTokenCookie(res, newToken, refreshTokenExpiresAt);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response): Promise<{ message: string }> {
        const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
        await this.logoutUseCase.execute(req.user?.userId, refreshToken);
        this.clearRefreshCookie(res);
        return { message: 'Logged out' };
    }

    private setRefreshTokenCookie(res: Response, token: string, expiresAt: Date) {
        const secure = this.configService.get('NODE_ENV') === 'production';
        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure,
            sameSite: secure ? 'strict' : 'lax',
            expires: expiresAt,
            path: '/api/auth',
        });
    }

    private clearRefreshCookie(res: Response) {
        res.cookie('refresh_token', '', {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: this.configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax',
            expires: new Date(0),
            path: '/api/auth',
        });
    }
}
