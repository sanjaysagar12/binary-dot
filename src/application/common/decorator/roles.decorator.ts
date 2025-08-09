import { SetMetadata } from '@nestjs/common';
export enum Role {
    ADMIN = 'ADMIN',
    USER =  'USER',
}
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);