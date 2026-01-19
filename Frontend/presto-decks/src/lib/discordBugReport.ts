/**
 * Discord Bug Report Utility
 * Sends formatted bug reports to Discord webhook for beta testing
 */

const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1462897571730292829/jidCSbUuPQOo42O6lagM5kLGPFChGmoOgoRrbO0LSu2uXxIOW0rsSQEFFoA5Ph2Da4NN";

export type BugType = 'empty-slide' | 'generation-failed' | 'other';

export interface BugReport {
    type: BugType;
    presentationId: string;
    presentationTitle?: string;
    slideIndex?: number;
    slideData?: any;
    allSlides?: any[];
    theme?: string;
    colorPalette?: any;
    userDescription?: string;
    userAgent: string;
    timestamp: string;
    url: string;
}

const BUG_TYPE_CONFIG = {
    'empty-slide': {
        title: '🖼️ Slide Vide',
        color: 0xFF6B6B, // Red
        description: 'Une slide s\'affiche vide - format de données invalide',
    },
    'generation-failed': {
        title: '📝 Présentation Non Générée',
        color: 0xFFA500, // Orange
        description: 'La présentation contient seulement 1 slide avec le prompt',
    },
    'other': {
        title: '❓ Autre Bug',
        color: 0x7289DA, // Discord blue
        description: 'Bug signalé par l\'utilisateur',
    },
};

/**
 * Sends a bug report to Discord webhook with formatted embed
 */
export async function sendBugReport(report: BugReport): Promise<boolean> {
    const config = BUG_TYPE_CONFIG[report.type];

    // Build embed fields based on bug type
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
        {
            name: '📋 ID Présentation',
            value: `\`${report.presentationId}\``,
            inline: true,
        },
        {
            name: '🎨 Thème',
            value: report.theme || 'Non défini',
            inline: true,
        },
        {
            name: '🌐 Navigateur',
            value: report.userAgent.substring(0, 100),
            inline: false,
        },
    ];

    // Add slide-specific info for empty-slide bug
    if (report.type === 'empty-slide' && report.slideIndex !== undefined) {
        fields.unshift({
            name: '📍 Slide Index',
            value: `Slide ${report.slideIndex + 1}`,
            inline: true,
        });
    }

    // Add user description for 'other' bugs
    if (report.type === 'other' && report.userDescription) {
        fields.push({
            name: '💬 Description',
            value: report.userDescription.substring(0, 1024),
            inline: false,
        });
    }

    // Add slide count for generation-failed
    if (report.type === 'generation-failed' && report.allSlides) {
        fields.push({
            name: '📊 Nombre de slides',
            value: `${report.allSlides.length} slide(s)`,
            inline: true,
        });
    }

    // Prepare the payload for Discord
    const payload: any = {
        embeds: [
            {
                title: config.title,
                description: config.description,
                color: config.color,
                fields,
                footer: {
                    text: `SlideAI Beta • ${report.timestamp}`,
                },
                url: report.url,
            },
        ],
    };

    // Add JSON data as a code block in a second embed (for detailed logs)
    let logsData: any;

    if (report.type === 'empty-slide') {
        logsData = {
            slideIndex: report.slideIndex,
            slideData: report.slideData,
            colorPalette: report.colorPalette,
            theme: report.theme,
        };
    } else if (report.type === 'generation-failed') {
        logsData = {
            presentationTitle: report.presentationTitle,
            allSlides: report.allSlides,
            colorPalette: report.colorPalette,
            theme: report.theme,
        };
    } else {
        logsData = {
            slideIndex: report.slideIndex,
            slideData: report.slideData,
            presentationTitle: report.presentationTitle,
            theme: report.theme,
        };
    }

    // Format JSON logs (truncate if too long for Discord)
    const jsonLogs = JSON.stringify(logsData, null, 2);
    const truncatedLogs = jsonLogs.length > 1900
        ? jsonLogs.substring(0, 1900) + '\n... (tronqué)'
        : jsonLogs;

    payload.embeds.push({
        title: '📄 Logs Détaillés',
        description: `\`\`\`json\n${truncatedLogs}\n\`\`\``,
        color: 0x2F3136,
    });

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to send bug report to Discord:', error);
        return false;
    }
}
