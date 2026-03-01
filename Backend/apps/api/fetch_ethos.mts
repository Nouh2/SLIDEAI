
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const presentation = await prisma.presentations.findFirst({
        where: {
            title: {
                contains: 'Ethos',
                mode: 'insensitive',
            },
        },
    });

    if (presentation) {
        console.log('Found presentation:', presentation.title);
        console.log(JSON.stringify(presentation.slides, null, 2));
    } else {
        console.log('Presentation not found');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
