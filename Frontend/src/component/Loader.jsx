import React from 'react';

// Full-screen page loader — used for auth checks, route transitions
export const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-6">
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <span className="absolute h-16 w-16 rounded-full border-4 border-primary/20" />
      {/* Spinning arc */}
      <span className="absolute h-16 w-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      {/* Middle ring */}
      <span className="absolute h-10 w-10 rounded-full border-4 border-primary/10" />
      {/* Counter-spinning arc */}
      <span
        className="absolute h-10 w-10 rounded-full border-4 border-transparent border-b-primary/60"
        style={{ animation: 'spin 0.8s linear infinite reverse' }}
      />
      {/* Center dot */}
      <span className="h-3 w-3 rounded-full bg-primary animate-pulse" />
    </div>

    {/* Animated dots */}
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          style={{
            animation: 'bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>

    <p className="text-xs text-muted-foreground tracking-widest uppercase font-medium">
      Mobile Registration
    </p>
  </div>
);

// Inline section loader — used inside tables, cards, pages
export const SectionLoader = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="relative flex items-center justify-center">
      <span className="absolute h-12 w-12 rounded-full border-4 border-primary/20" />
      <span className="absolute h-12 w-12 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      <span
        className="absolute h-7 w-7 rounded-full border-4 border-transparent border-b-primary/50"
        style={{ animation: 'spin 0.7s linear infinite reverse' }}
      />
      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
    </div>
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full bg-muted-foreground"
          style={{
            animation: 'bounce 1s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  </div>
);

export default PageLoader;
