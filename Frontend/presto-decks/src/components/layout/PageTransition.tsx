import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
    children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
    const location = useLocation();
    if (location.pathname.startsWith("/qa/")) {
        return <div>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
};
