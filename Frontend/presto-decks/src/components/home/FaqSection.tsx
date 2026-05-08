import { useTranslation } from "react-i18next";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
    const { t, i18n } = useTranslation();
    const isFr = i18n.language.startsWith("fr");

    const questions = [
        { q: t('faq.questions.trial.q'), a: t('faq.questions.trial.a') },
        { q: t('faq.questions.deliver.q'), a: t('faq.questions.deliver.a') },
        { q: t('faq.questions.pdf.q'), a: t('faq.questions.pdf.a') },
        { q: t('faq.questions.security.q'), a: t('faq.questions.security.a') },
        { q: t('faq.questions.usage.q'), a: t('faq.questions.usage.a') },
        {
            q: isFr ? "La qualité est-elle suffisante pour un comité de direction ?" : "Is the quality good enough for executive reviews?",
            a: isFr
                ? "Oui. Vous obtenez une base claire et professionnelle, puis vous ajustez les messages clés avant livraison."
                : "Yes. You get a clear professional draft, then refine key messages before delivery.",
        },
        {
            q: isFr ? "Mes documents clients restent-ils confidentiels ?" : "Do my client documents stay confidential?",
            a: isFr
                ? "Les documents sont traités de façon sécurisée. Vous gardez le contrôle sur ce que vous importez et exportez."
                : "Documents are handled through secure workflows. You keep control over what you import and export.",
        },
        {
            q: isFr ? "Puis-je garder la charte graphique du client ?" : "Can I keep the client's visual identity?",
            a: isFr
                ? "Oui. Vous pouvez adapter styles, couleurs et structure pour coller à votre contexte client."
                : "Yes. You can adapt style, colors, and structure to match your client context.",
        },
    ];

    return (
        <section className="pt-4 pb-8 md:pt-4 md:pb-10 px-4 bg-background/20 relative z-10">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">{t('faq.title')}</h2>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {questions.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border border-white/5 rounded-xl px-4 bg-white/5">
                            <AccordionTrigger className="text-left hover:no-underline py-4 text-lg md:text-xl font-medium">
                                {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pb-4 text-base md:text-lg">
                                {item.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
