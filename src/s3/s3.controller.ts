import { Controller, Post, Get, UseInterceptors, UploadedFile, BadRequestException, Param, UseGuards, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { S3Service } from './s3.service';
import { JwtGuard } from '../application/common/guards/jwt.guard';

@Controller('')
export class S3Controller {
    constructor(private readonly s3Service: S3Service) {}

    @Post('api/image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Basic file validation
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only image files are allowed');
        }

        // File size limit (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size must be less than 5MB');
        }

        try {
            const imageUrl = await this.s3Service.uploadFile(file, 'images');
            console.log('Image uploaded successfully:', imageUrl);
            return {
                status: 'success',
                message: 'Image uploaded successfully',
                data: {
                    imageUrl: imageUrl,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype
                }
            };
        } catch (error) {
            throw new BadRequestException('Failed to upload image');
        }
    }

    @Get('uploads/images/:fileName')
    async getImage(@Param('fileName') fileName: string, @Res() res: Response) {
        try {
            if (!this.s3Service.fileExists('images', fileName)) {
                return res.status(404).json({ message: 'Image not found' });
            }

            const filePath = this.s3Service.getFilePath('images', fileName);
            const fileBuffer = await this.s3Service.getFile('images', fileName);
            
            // Set proper content type based on file extension
            const ext = fileName.split('.').pop()?.toLowerCase();
            const contentTypes: { [key: string]: string } = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp'
            };
            
            const contentType = (ext && contentTypes[ext]) || 'application/octet-stream';
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
            res.send(fileBuffer);
        } catch (error) {
            return res.status(404).json({ message: 'Image not found' });
        }
    }
}
