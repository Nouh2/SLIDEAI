import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ReactConfetti from 'react-confetti';

interface PaymentSuccessProps {
    onContinue: () => void;
}

export function PaymentSuccess({ onContinue }: PaymentSuccessProps) {
    const { t } = useTranslation();
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
            <ReactConfetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.15}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden relative"
            >
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />

                <div className="p-8 md:p-12 text-center relative z-10 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                        transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-8 shadow-lg shadow-green-500/30"
                    >
                        <Check className="w-12 h-12 text-white stroke-[3]" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
                    >
                        {t('payment.successTitle', 'Payment Successful!')}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-muted-foreground text-lg mb-8 max-w-sm mx-auto"
                    >
                        {t('payment.successMessage', 'Thank you for your purchase. Your account has been upgraded and credits have been added.')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-primary to-secondary text-white font-bold h-14 px-8 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all text-lg"
                            onClick={onContinue}
                        >
                            <span>{t('payment.continueToDashboard', 'Access Dashboard')}</span>
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
