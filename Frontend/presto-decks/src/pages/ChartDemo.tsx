import React from 'react';
import { ModernSlideRenderer } from '@/components/slides/ModernSlideRenderer';
import {
    ArrowLeftRight,
    BarChart,
    Columns,
    FileText,
    Grid2x2,
    Hash,
    History,
    Image as ImageIcon,
    LayoutGrid,
    List,
    Maximize,
    PieChart,
    Table,
} from 'lucide-react';
import { DEMO_LAYOUT_FAMILIES, createRegistrySlide } from '@/data/layoutRegistry';

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
        <div className="w-full aspect-video relative overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200 group-hover:border-blue-400 transition-all duration-500 hover:scale-[1.01]">
            <div
                style={{
                    width: '1920px',
                    height: '1080px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    background: 'white',
                }}
                className="absolute top-0 left-0"
            >
                {children}
            </div>
        </div>
    );
};

const iconMap = {
    maximize: Maximize,
    list: List,
    columns: Columns,
    hash: Hash,
    'bar-chart': BarChart,
    table: Table,
    grid: Grid2x2,
    history: History,
    'arrow-left-right': ArrowLeftRight,
    image: ImageIcon,
    'pie-chart': PieChart,
    'file-text': FileText,
} as const;

const colors = {
    primary: '#0F172A',
    secondary: '#3B82F6',
    accent: '#F59E0B',
    bg: '#F8FAFC',
    text: '#1E293B',
};

const ChartDemoPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
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
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-28 space-y-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Quick Jump</h3>
                        {DEMO_LAYOUT_FAMILIES.map((family) => {
                            const Icon = iconMap[family.icon as keyof typeof iconMap] || LayoutGrid;
                            return (
                                <a
                                    key={family.id}
                                    href={`#${family.id}`}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                                >
                                    <Icon className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                                    <span className="text-sm font-medium">{family.label}</span>
                                </a>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <div className="max-w-4xl">
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Native Layout Engine</h2>
                        <p className="text-slate-500 mb-16 text-lg leading-relaxed">
                            Comprehensive visualization of all available slide layout families and their aesthetic variations.
                            These are natively supported by the{' '}
                            <code className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">ModernSlideRenderer</code>{' '}
                            engine, optimized for <span className="font-bold text-slate-700">1920x1080</span> professional output.
                        </p>
                    </div>

                    <div className="space-y-32">
                        {DEMO_LAYOUT_FAMILIES.map((family) => (
                            <section key={family.id} id={family.id} className="scroll-mt-32">
                                <div className="flex items-end gap-3 mb-12 pb-6 border-b border-slate-200 relative">
                                    <div className="absolute -left-12 top-0 bottom-6 w-1 bg-blue-600/20 rounded-full" />
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{family.label}</h2>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-mono mb-1.5">
                                        ID: {family.id}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-32">
                                    {family.variations.map((variation) => (
                                        <div key={variation} className="group flex flex-col gap-6 max-w-[1000px] w-full">
                                            <div className="flex items-center justify-between px-2">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xl font-bold text-slate-800 capitalize tracking-tight">
                                                        {variation.replace(/-/g, ' ')}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            {family.id}:{variation}
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
                                                    slide={createRegistrySlide(family.id, variation)}
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

