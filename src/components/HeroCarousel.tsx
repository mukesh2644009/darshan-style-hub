'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Files in `/public/Banners/` — order is slide sequence */
const BANNER_FILES = [
  'Beige and Brown Minimalist New Style Collection Banner.png',
  'Beige And Brown Minimalist Modern Clothing Store Facebook Ad.png',
  'Black Red Minimalist Fashion Product Introduction Landscape Banner.png',
  'Black Red Minimalist Fashion Product Introduction Landscape Banner (1).png',
] as const;

const heroImages = BANNER_FILES.map((name) => `/Banners/${encodeURIComponent(name)}`);

const slideDurationMs = 5200;
const transition = {
  duration: 0.85,
  ease: [0.4, 0, 0.2, 1] as const,
};

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrentIndex((index + heroImages.length) % heroImages.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, slideDurationMs);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[360px]">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, filter: 'blur(14px)', scale: 1.04 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)', scale: 1.02 }}
          transition={transition}
          className="absolute inset-0 will-change-[opacity,filter,transform]"
        >
          <Image
            src={heroImages[currentIndex]}
            alt={`Darshan Style Hub — collection banner ${currentIndex + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
            className="object-cover object-center bg-[#FFF8F0]"
            priority={currentIndex === 0}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Soft vignette so blur edges blend */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-2xl ring-1 ring-inset ring-black/[0.06]"
        aria-hidden
      />

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Show banner ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 bg-white shadow-sm'
                : 'w-2.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
