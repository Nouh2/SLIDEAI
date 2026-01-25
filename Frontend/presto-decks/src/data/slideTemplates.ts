// src/data/slideTemplates.ts
// Slide template configurations with distinctive colors for each theme

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'educational' | 'marketing' | 'corporate';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  preview: string;
  preferredLayouts: string[];
  useCases: string[];
}

export const slideTemplates: SlideTemplate[] = [
  {
    id: 'corporate-report',
    name: 'Corporate Report',
    description: 'Professional and clean for business reports',
    category: 'corporate',
    colors: {
      primary: '#0369A1',  // Corporate Blue
      secondary: '#059669', // Green
      accent: '#0369A1',
      bg: '#ffffff',
      text: '#1E293B',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    preferredLayouts: ['section-divider', 'metrics-grid', 'comparison-split'],
    useCases: ['business report', 'quarterly review', 'executive summary'],
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Vibrant and energetic for new product announcements',
    category: 'marketing',
    colors: {
      primary: '#EA580C',  // Orange
      secondary: '#DC2626', // Red
      accent: '#EA580C',
      bg: '#FFF7ED',
      text: '#1C1917',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    preferredLayouts: ['cover-hero', 'feature-showcase', 'metrics-grid'],
    useCases: ['product launch', 'feature announcement', 'marketing'],
  },
  {
    id: 'startup-pitch',
    name: 'Startup Pitch',
    description: 'Bold and impactful design for investor presentations',
    category: 'business',
    colors: {
      primary: '#2563EB',  // Blue
      secondary: '#7C3AED', // Purple
      accent: '#2563EB',
      bg: '#ffffff',
      text: '#0F172A',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
    preferredLayouts: ['cover-hero', 'metrics-grid', 'comparison-split'],
    useCases: ['pitch deck', 'fundraising', 'investor presentation', 'startup'],
  },
  {
    id: 'consulting',
    name: 'Consulting Premium',
    description: 'Sophisticated design for consulting firms',
    category: 'business',
    colors: {
      primary: '#F59E0B',  // Gold
      secondary: '#3B82F6', // Blue
      accent: '#F59E0B',
      bg: '#0F172A',
      text: '#F8FAFC',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
    preferredLayouts: ['cover-hero', 'metrics-grid', 'comparison-split'],
    useCases: ['consulting', 'strategy', 'advisory', 'management'],
  },
  {
    id: 'minimal-elegant',
    name: 'Minimal Elegant',
    description: 'Sophisticated minimalist with strong typography',
    category: 'business',
    colors: {
      primary: '#18181B',  // Near black
      secondary: '#52525B', // Gray
      accent: '#18181B',
      bg: '#FAFAFA',
      text: '#18181B',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop',
    preferredLayouts: ['section-divider', 'quote-large', 'comparison-split'],
    useCases: ['minimalist', 'elegant', 'luxury', 'premium'],
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Artistic and bold with focus on visuals',
    category: 'creative',
    colors: {
      primary: '#FF006E',  // Magenta
      secondary: '#FB5607', // Orange
      accent: '#FF006E',
      bg: '#1E1E2E',
      text: '#F5F5F5',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    preferredLayouts: ['cover-hero', 'feature-showcase', 'quote-large'],
    useCases: ['portfolio', 'showcase', 'creative work'],
  },
  {
    id: 'educational',
    name: 'Educational Course',
    description: 'Clear and structured for teaching',
    category: 'educational',
    colors: {
      primary: '#16A34A',  // Green
      secondary: '#0D9488', // Teal
      accent: '#16A34A',
      bg: '#F0FDF4',
      text: '#166534',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    preferredLayouts: ['section-divider', 'title-top-columns', 'comparison-split'],
    useCases: ['course', 'training', 'education', 'tutorial'],
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Dynamic and colorful for marketing',
    category: 'marketing',
    colors: {
      primary: '#EA580C',  // Orange
      secondary: '#F59E0B', // Amber
      accent: '#EA580C',
      bg: '#FFF7ED',
      text: '#1C1917',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    preferredLayouts: ['cover-hero', 'metrics-grid', 'feature-showcase'],
    useCases: ['marketing', 'campaign', 'advertising'],
  },
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    description: 'Cutting-edge design for tech and SaaS',
    category: 'business',
    colors: {
      primary: '#00F0FF',  // Cyan
      secondary: '#6366F1', // Indigo
      accent: '#00F0FF',
      bg: '#0B0F19',
      text: '#FFFFFF',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    preferredLayouts: ['cover-hero', 'feature-showcase', 'metrics-grid'],
    useCases: ['technology', 'saas', 'software', 'digital', 'cyber', 'ai'],
  },
  {
    id: 'health-medical',
    name: 'Health & Medical',
    description: 'Clean and trustworthy for healthcare',
    category: 'corporate',
    colors: {
      primary: '#0D9488',  // Teal
      secondary: '#2563EB', // Blue
      accent: '#0D9488',
      bg: '#F0FDFA',
      text: '#134E4A',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
    preferredLayouts: ['section-divider', 'metrics-grid', 'timeline'],
    useCases: ['healthcare', 'medical', 'health', 'clinic', 'hospital'],
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    description: 'Earth-toned design for eco-friendly messaging',
    category: 'corporate',
    colors: {
      primary: '#65A30D',  // Lime green
      secondary: '#0D9488', // Teal
      accent: '#65A30D',
      bg: '#FEFCE8',
      text: '#365314',
    },
    fonts: {
      heading: 'Outfit',
      body: 'Inter',
    },
    preview: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&h=300&fit=crop',
    preferredLayouts: ['cover-hero', 'infographic', 'timeline'],
    useCases: ['sustainability', 'green', 'eco', 'environment', 'climate'],
  },
];

export const getTemplateById = (id: string): SlideTemplate | undefined => {
  return slideTemplates.find((t) => t.id === id);
};

export const getTemplatesByCategory = (category: SlideTemplate['category']): SlideTemplate[] => {
  return slideTemplates.filter((t) => t.category === category);
};

export const getTemplatesByUseCase = (useCase: string): SlideTemplate[] => {
  const lowerUseCase = useCase.toLowerCase();
  return slideTemplates.filter((t) =>
    t.useCases.some((uc) => uc.toLowerCase().includes(lowerUseCase))
  );
};
