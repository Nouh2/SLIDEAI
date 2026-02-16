import React from 'react';
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";
import { LayoutGrid, List, Columns, Maximize, BarChart, Hash, Table, Grid2x2, FileText, History, ArrowLeftRight, Image as ImageIcon, PieChart } from 'lucide-react';

const SlideCanvas = ({ children }: { children: React.ReactNode }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(1);

    React.useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const { width } = containerRef.current.getBoundingClientRect();
            setScale(width / 1920);
        };
        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) observer.observe(containerRef.current);
        updateScale();
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full aspect-video relative overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200 group-hover:border-blue-400 transition-all duration-500 hover:scale-[1.01]">
            <div
                style={{
                    width: '1920px',
                    height: '1080px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    background: 'white'
                }}
                className="absolute top-0 left-0"
            >
                {children}
            </div>
        </div>
    );
};

const ChartDemoPage = () => {
    const colors = {
        primary: "#0F172A", // Slate 900
        secondary: "#3B82F6", // Blue 500
        accent: "#F59E0B", // Amber 500
        bg: "#F8FAFC", // Slate 50
        text: "#1E293B" // Slate 800
    };

    const MOCK_DATA = {
        cover: {
            title: "SLIDEAI Presentation",
            subtitle: "The future of automated design and professional visualization",
            author: "Google DeepMind Team",
            company: "Advanced Agentic Coding",
            backgroundImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069"
        },
        content: {
            title: "Core Features",
            subtitle: "What makes SLIDEAI different",
            bullets: ["Automated layout switching", "McKinsey style charts", "AI-powered content generation", "Seamless export to PDF/PPTX"]
        },
        'text-columns': {
            title: "Key Modules",
            columns: [
                { title: "Design Engine", text: "Proprietary algorithms for visual balance and hierarchy." },
                { title: "Data Processor", text: "Transforms raw data into high-impact visuals instantly." },
                { title: "Theme Manager", text: "Maintains brand consistency across every single slide." }
            ]
        },
        stats: {
            title: "Performance Metrics",
            metrics: [
                { label: "Efficiency Gain", value: "85%", change: "+12%" },
                { label: "Design Time", value: "2.5m", change: "-15m" },
                { label: "User NPS", value: "72", change: "+5" }
            ]
        },
        chart: {
            title: "Market Share Analysis",
            chart: {
                type: "bar",
                categories: ["Product A", "Product B", "Product C", "Product D"],
                series: [{ name: "Market Share", data: [45, 25, 20, 10] }]
            }
        },
        table: {
            title: "Pricing Comparison",
            table: {
                headers: ["Feature", "Starter", "Pro", "Enterprise"],
                rows: [
                    ["AI Gen", "Check", "Check", "Check"],
                    ["Unlimited", "Cross", "Check", "Check"],
                    ["Support", "Email", "Priority", "24/7"]
                ]
            }
        },
        timeline: {
            title: "Project Roadmap",
            steps: [
                { title: "Phase 1", description: "MVP Development", date: "Jan 2024" },
                { title: "Phase 2", description: "Beta Launch", date: "Mar 2024" },
                { title: "Phase 3", description: "Scale Up", date: "Jun 2024" }
            ]
        },
        comparison: {
            title: "Solution Comparison",
            left: { title: "Legacy Tools", items: ["Manual effort", "Inconsistent branding", "No AI context"] },
            right: { title: "SLIDEAI", items: ["Fully automated", "Pixel perfect", "Data-aware designs"] }
        },
        bento: {
            title: "Capabilities Overview",
            items: [
                { title: "Fast", description: "Weeks to seconds." },
                { title: "Smart", description: "Context-aware UI." },
                { title: "Beautiful", description: "Consultant grade." },
                { title: "Ready", description: "Export instantly." }
            ]
        },
        swot: {
            title: "Strategic SWOT Analysis", // Renamed for clarity
            strengths: ["Fast speed", "High quality"],
            weaknesses: ["Beta status", "Complex data"],
            opportunities: ["Enterprise adoption"],
            threats: ["Crowded market"]
        },
        tows: {
            title: "Matrice T W O S",
            type: "tows", // Explicit type ensures it becomes a matrix
            content: { // Nested content for extra test case coverage
                labels: [
                    "SO (Maxi-Maxi): Exploit market growth with high quality",
                    "ST (Maxi-Mini): Use speed to mitigate competition",
                    "WO (Mini-Maxi): Hire experts to fix beta status",
                    "WT (Mini-Mini): Focus on niches to avoid crowded market"
                ],
                datasets: [{ data: [1, 1, 1, 1] }] // Dummy data to trigger extraction
            }
        },
        'tows-distribution': {
            title: "Matrice T W O S : Distribution Stratégique",
            type: "chart", // Should stay a chart despite "T W O S" keyword
            chart: {
                type: 'doughnut',
                labels: ['SO Strategies', 'ST Strategies', 'WO Strategies', 'WT Strategies'],
                datasets: [{
                    label: 'Distribution',
                    data: [25, 25, 25, 25],
                    backgroundColor: ['#27AE60', '#E74C3C', '#3498DB', '#F39C12']
                }]
            }
        },
        'executive-summary': {
            title: "Executive Summary",
            highlights: [
                { title: "Growth", text: "Significant increase in user base." },
                { title: "Churn", text: "Lowest in category at 2%." },
                { title: "Revenue", text: "On track for $10M ARR." }
            ]
        },
        image: {
            title: "World Wide Reach",
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072",
            images: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072"],
            chart: {
                "type": "line",
                "title": "Projected Monthly Revenue by Channel ($)",
                "series": [
                    {
                        "data": [
                            20000,
                            45000,
                            85000,
                            140000,
                            190000,
                            250000
                        ],
                        "name": "DTC Revenue"
                    },
                    {
                        "data": [
                            5000,
                            15000,
                            40000,
                            90000,
                            130000,
                            180000
                        ],
                        "name": "Retail Revenue"
                    }
                ],
                "categories": [
                    "Jan",
                    "Mar",
                    "May",
                    "Jul",
                    "Sep",
                    "Nov"
                ]
            }
        },
        showcase: {
            title: "Product Showcase",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426",
            description: "A revolutionary way to think about presentations.",
            items: [
                { title: "Smart Layouts", description: "Context-aware design logic." },
                { title: "Real-time Sync", description: "Seamless multi-device editing." },
                { title: "Advanced Metrics", description: "Deep visual analytics built-in." },
                { title: "Cloud Integration", description: "Access anywhere, anytime." }
            ]
        },
        infographic: {
            title: "Iterative Growth Cycle",
            steps: [
                { label: "Market Research", description: "Deep dive into user needs" },
                { label: "Prototyping", description: "Rapid iteration of ideas" },
                { label: "User Testing", description: "Validation with real users" },
                { label: "Development", description: "Building scalable features" },
                { label: "Deployment", description: "Releasing to production" },
                { label: "Analysis", description: "Measuring impact & KPIs" }
            ]
        },
        section: {
            title: "Next Section",
            subtitle: "Diving deeper into the technology",
            backgroundImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072"
        }
    };

    const LAYOUT_FAMILIES = [
        {
            id: 'cover',
            label: 'Cover & Hero',
            icon: Maximize,
            variations: ['centered-minimal', 'full-split', 'diagonal-hero', 'typographic-giant', 'gradient-mesh', 'boxed-modern', 'cinematic']
        },
        {
            id: 'content',
            label: 'Content & Bullets',
            icon: List,
            variations: ['classic', 'split-card', 'hero-block', 'magazine', 'minimal-offset']
        },
        {
            id: 'text-columns',
            label: 'Text Columns',
            icon: Columns,
            variations: ['classic', 'modern-cards', 'numbered-editorial', 'side-highlight', 'vertical-separators', 'bento-text']
        },
        {
            id: 'stats',
            label: 'Stats & Metrics',
            icon: Hash,
            variations: ['classic-grid', 'metric-cards', 'big-hero-stat', 'data-progress', 'trend-focus']
        },
        {
            id: 'chart',
            label: 'Charts',
            icon: BarChart,
            variations: ['default', 'chart-showcase', 'chart-analysis', 'split-curtain']
        },
        {
            id: 'table',
            label: 'Tables',
            icon: Table,
            variations: ['default', 'data-grid', 'feature-matrix', 'pricing-tiers']
        },
        {
            id: 'bento',
            label: 'Bento Grid',
            icon: Grid2x2,
            variations: ['default', 'magazine-grid', 'feature-focus', 'asymmetric-masonry']
        },
        {
            id: 'timeline',
            label: 'Timeline & Process',
            icon: History,
            variations: ['horizontal-line', 'vertical-alternating', 'connected-cards', 'stepped-process']
        },
        {
            id: 'comparison',
            label: 'Comparison (VS)',
            icon: ArrowLeftRight,
            variations: ['balanced-split', 'versus-cards', 'feature-grid', 'before-after', 'pros-cons']
        },
        {
            id: 'showcase',
            label: 'Showcase',
            icon: Maximize,
            variations: ['default', 'split', 'floating', 'minimal']
        },
        {
            id: 'section',
            label: 'Section Divider',
            icon: Columns,
            variations: ['default', 'big-number-outline', 'minimal-bar', 'abstract-mesh']
        },
        {
            id: 'image',
            label: 'Image & Gallery',
            icon: ImageIcon,
            variations: ['default', 'image-showcase', 'chart-showcase', 'chart-analysis', 'text-mask', 'split-curtain', 'polaroid-pile']
        },
        {
            id: 'swot',
            label: 'SWOT Analysis',
            icon: Grid2x2,
            variations: ['classic-grid', 'rounded-cards', 'minimal-list']
        },
        {
            id: 'tows',
            label: 'TOWS Matrix',
            icon: Grid2x2,
            variations: ['classic-grid', 'rounded-cards']
        },
        {
            id: 'tows-distribution',
            label: 'TOWS Distribution',
            icon: PieChart,
            variations: ['default-container', 'floating-card']
        },
        {
            id: 'executive-summary',
            label: 'Executive Summary',
            icon: FileText,
            variations: ['dashboard', 'split-columns', 'compact']
        },
        {
            id: 'infographic',
            label: 'Infographics',
            icon: PieChart,
            variations: ['funnel', 'process', 'pyramid', 'cycle-flow', 'hub-spoke']
        }
    ];

    const createSlide = (familyId: string, variation: string) => ({
        id: `demo-${familyId}-${variation}`,
        title: (MOCK_DATA as any)[familyId]?.title || "Demo Slide",
        type: familyId,
        layout: familyId,
        variation: variation,
        theme: 'modern',
        content: (MOCK_DATA as any)[familyId],
        ...((MOCK_DATA as any)[familyId]) // Spread all properties
    });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            SLIDEAI <span className="text-blue-600">Layout Registry</span>
                        </h1>
                    </div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                        v2.0 Design System
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-6 flex gap-12 py-12">
                {/* Side Navigation - Quick Jump */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-28 space-y-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Quick Jump</h3>
                        {LAYOUT_FAMILIES.map((family) => (
                            <a
                                key={family.id}
                                href={`#${family.id}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                            >
                                <family.icon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                                <span className="text-sm font-medium">{family.label}</span>
                            </a>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <div className="max-w-4xl">
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Native Layout Engine</h2>
                        <p className="text-slate-500 mb-16 text-lg leading-relaxed">
                            Comprehensive visualization of all available slide layout families and their aesthetic variations.
                            These are natively supported by the <code className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">ModernSlideRenderer</code> engine,
                            optimized for <span className="font-bold text-slate-700">1920x1080</span> professional output.
                        </p>
                    </div>

                    <div className="space-y-32">
                        {LAYOUT_FAMILIES.map((family) => (
                            <section key={family.id} id={family.id} className="scroll-mt-32">
                                <div className="flex items-end gap-3 mb-12 pb-6 border-b border-slate-200 relative">
                                    <div className="absolute -left-12 top-0 bottom-6 w-1 bg-blue-600/20 rounded-full" />
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{family.label}</h2>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-mono mb-1.5">
                                        ID: {family.id}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-32">
                                    {family.variations.map((v) => (
                                        <div key={v} className="group flex flex-col gap-6 max-w-[1000px] w-full">
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xl font-bold text-slate-800 capitalize tracking-tight">
                                                        {v.replace(/-/g, ' ')}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {family.id}:{v}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="bg-white border border-slate-200 text-slate-400 p-2 rounded-lg hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100">
                                                        <Maximize className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <SlideCanvas>
                                                <ModernSlideRenderer
                                                    slide={createSlide(family.id, v)}
                                                    theme="modern"
                                                    colorPalette={colors}
                                                    showWatermark={false}
                                                    showPageNumber={false}
                                                />
                                            </SlideCanvas>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </main>
            </div>

            {/* Back to Top */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-2xl shadow-blue-400/50 hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all z-[70]"
            >
                <History className="h-6 w-6 rotate-90" />
            </button>
        </div>
    );
};

export default ChartDemoPage;
