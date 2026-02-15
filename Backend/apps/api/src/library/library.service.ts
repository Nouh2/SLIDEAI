import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class LibraryService {
    constructor(private readonly prisma: PrismaService) { }

    async saveSlide(userId: string, name: string, content: any, category?: string, type?: string) {
        return this.prisma.savedSlide.create({
            data: {
                userId,
                name,
                content,
                category,
                type,
            },
        });
    }

    async listSlides(userId: string) {
        return this.prisma.savedSlide.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteSlide(id: string, userId: string) {
        const slide = await this.prisma.savedSlide.findFirst({
            where: { id, userId },
        });

        if (!slide) {
            throw new NotFoundException('Diapositive non trouvée dans la bibliothèque');
        }

        return this.prisma.savedSlide.delete({
            where: { id },
        });
    }
}
