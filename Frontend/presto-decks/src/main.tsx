import { createRoot } from "react-dom/client";
import "@/lib/i18n"; // Initialize i18n before App
import App from "./App.tsx";
import "./index.css";

import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);
