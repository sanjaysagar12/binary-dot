import { Controller, Get, Logger, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from 'src/application/common/guards/google-auth-guard';
import { AuthService } from './auth.service';

@Controller("api/auth")
export class AuthController {

    private readonly logger = new Logger(AuthController.name);
    constructor(private authService: AuthService) { }
    @UseGuards(GoogleAuthGuard)
    @Get('google/signin')
    async googleSignIn() {
        // This route initiates Google OAuth flow
        // The guard redirects to Google - we don't need to return anything
    }

    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    async callback(@Req() req, @Res() res) {
        this.logger.log('Google authentication callback received');
        // After successful Google authentication, generate JWT
        const token = await this.authService.googleSignin(req.user.id, req.user.role);
        console.log('Generated JWT:', token);
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // since you're on HTTP localhost
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24,
        });

        // Redirect to frontend or send success response
        return res.redirect('http://localhost:3001/profile'); // or wherever you want to redirect
    }
}
