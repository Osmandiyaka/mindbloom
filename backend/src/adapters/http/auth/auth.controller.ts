import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginUseCase, RegisterUseCase } from '../../../application/auth/use-cases';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly registerUseCase: RegisterUseCase,
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
}
