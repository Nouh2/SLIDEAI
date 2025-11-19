/**
 * Aurora Background - Lightweight animated gradient orbs
 * Inspired by Snapdeck's premium aesthetic
 */
export const AuroraBackground = () => {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-40">
      {/* Main Aurora Gradient Layers */}
      <div className="absolute inset-0">
        {/* Violet orb - Primary */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[140px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, hsl(271, 81%, 66%) 0%, transparent 70%)',
            top: '10%',
            left: '15%',
            animation: 'aurora-float 25s ease-in-out infinite',
          }}
        />
        
        {/* Cyan orb - Secondary */}
        <div 
          className="absolute w-[550px] h-[550px] rounded-full blur-[130px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, hsl(199, 95%, 61%) 0%, transparent 70%)',
            top: '45%',
            right: '10%',
            animation: 'aurora-float 28s ease-in-out infinite reverse',
            animationDelay: '3s',
          }}
        />
        
        {/* Magenta orb - Accent */}
        <div 
          className="absolute w-[480px] h-[480px] rounded-full blur-[120px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, hsl(268, 75%, 50%) 0%, transparent 70%)',
            bottom: '10%',
            left: '45%',
            animation: 'aurora-float 30s ease-in-out infinite',
            animationDelay: '7s',
          }}
        />

        {/* Orange glow - Warm accent */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, hsl(38, 92%, 50%) 0%, transparent 70%)',
            top: '60%',
            left: '20%',
            animation: 'aurora-float 32s ease-in-out infinite',
            animationDelay: '10s',
            opacity: 0.7,
          }}
        />
      </div>
      
      {/* Floating particles - only on desktop for performance */}
      {!isMobile && (
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full blur-sm will-change-transform"
              style={{
                background: `hsl(${258 + (i * 20)}, 85%, 65%)`,
                top: `${15 + i * 10}%`,
                left: `${10 + i * 12}%`,
                opacity: 0.3,
                animation: `aurora-float ${22 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes aurora-float {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
          }
          25% { 
            transform: translate(30px, -40px) scale(1.05);
          }
          50% { 
            transform: translate(-20px, 30px) scale(0.95);
          }
          75% { 
            transform: translate(40px, 20px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};
