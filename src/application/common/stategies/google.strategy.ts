import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth2";
import { PrismaService } from "src/prisma/prisma.service";

interface Profile {
    id: string;
    displayName: string;
    name: { familyName?: string; givenName: string; middleName?: string };
    emails: { value: string; verified: boolean; }[];
    picture: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private prisma: PrismaService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || 'googleClientId',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'googleClientSecret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) {
        const { name, emails, picture } = profile;
        
        try {
            const user = await this.prisma.user.upsert({
                where: { email: emails[0].value },
                update: {
                    name: name.givenName + " " + (name.familyName || ''),
                    email: emails[0].value,
                    avatar: picture,
                },
                create: {
                    name: name.givenName + " " + (name.familyName || ''),
                    email: emails[0].value,
                    role: 'USER',
                    avatar: picture,
                    googleId: profile.id, 
                },
                select: {
                    id: true,
                    role: true,
                }
            });
            
            // Return the user object for passport
            done(null, user);
        } catch (error) {
            console.error('Error in Google Strategy:', error);
            done(error, null);
        }
    }
}