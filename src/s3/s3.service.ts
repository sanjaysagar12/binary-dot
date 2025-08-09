import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
    private uploadPath = path.join(process.cwd(), 'uploads');

    constructor() {
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async uploadFile(file: any, folder = 'images'): Promise<string> {
        try {
            // Create folder if it doesn't exist
            const folderPath = path.join(this.uploadPath, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const fileExtension = path.extname(file.originalname);
            const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}${fileExtension}`;
            const filePath = path.join(folderPath, fileName);

            // Save file to disk
            fs.writeFileSync(filePath, file.buffer);

            // Return the public URL (served by NestJS static files)
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            return `${baseUrl}/uploads/${folder}/${fileName}`;
        } catch (error) {
            console.error('File upload error:', error);
            throw new Error('Failed to upload file');
        }
    }

    async getFile(folder: string, fileName: string): Promise<Buffer> {
        try {
            const filePath = path.join(this.uploadPath, folder, fileName);
            
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }

            return fs.readFileSync(filePath);
        } catch (error) {
            console.error('File read error:', error);
            throw new Error('Failed to read file');
        }
    }

    getFilePath(folder: string, fileName: string): string {
        return path.join(this.uploadPath, folder, fileName);
    }

    fileExists(folder: string, fileName: string): boolean {
        const filePath = path.join(this.uploadPath, folder, fileName);
        return fs.existsSync(filePath);
    }
}
