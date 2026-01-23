import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language?.substring(0, 2) || 'fr';

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
    };

    const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 gap-1.5 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80"
                >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium uppercase">{currentLang}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`gap-2 cursor-pointer ${currentLang === lang.code ? 'bg-primary/5 text-primary font-medium' : ''}`}
                    >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
