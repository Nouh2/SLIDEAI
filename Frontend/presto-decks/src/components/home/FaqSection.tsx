import { useTranslation } from "react-i18next";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
    const { t } = useTranslation();

    const questions = [
        { q: t('faq.questions.subscription.q'), a: t('faq.questions.subscription.a') },
        { q: t('faq.questions.deliver.q'), a: t('faq.questions.deliver.a') },
        { q: t('faq.questions.pdf.q'), a: t('faq.questions.pdf.a') },
        { q: t('faq.questions.usage.q'), a: t('faq.questions.usage.a') },
    ];

    return (
        <section className="py-12 md:py-16 px-4 bg-background/20 relative z-10">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">{t('faq.title')}</h2>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {questions.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border border-white/5 rounded-xl px-4 bg-white/5">
                            <AccordionTrigger className="text-left hover:no-underline py-4 text-base md:text-lg font-medium">
                                {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pb-4 text-base">
                                {item.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
