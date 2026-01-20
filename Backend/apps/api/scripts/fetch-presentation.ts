
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const id = "fe154569-e415-4aa3-8d79-6d85e0500432";
    const presentation = await prisma.presentation.findUnique({
        where: { id },
    });

    if (!presentation) {
        console.error("Presentation not found");
        process.exit(1);
    }

    const outputPath = path.join(process.cwd(), 'exported_arca.json');
    fs.writeFileSync(outputPath, JSON.stringify(presentation, null, 2), 'utf-8');
    console.log(`Exported to ${outputPath}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
