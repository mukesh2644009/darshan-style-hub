'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/** Resized hero slides in `/public/Banners/` (~1920×650). */
const BANNER_FILES = [
  'hero-untitled-design.png',
  'hero-beige-brown-clothing-ad-1920x650.png',
  'hero-beige-brown-collection-1920x650.png',
] as const;

const heroImages = BANNER_FILES.map((name) => `/Banners/${encodeURIComponent(name)}`);

const slideDurationMs = 5200;
const transition = {
  duration: 0.38,
  ease: [0.4, 0, 0.2, 1] as const,
};

type HeroCarouselProps = {
  /** Edge-to-edge strip (full width) */
  fullBleed?: boolean;
  /** Full-width tall hero with letterboxed slides */
  cinematic?: boolean;
  /** Right column of split hero: edge-to-edge object-cover (reference-style, no letterboxing) */
  split?: boolean;
};

export default function HeroCarousel({ fullBleed = false, cinematic = false, split = false }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrentIndex((index + heroImages.length) % heroImages.length);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, slideDurationMs);
    return () => clearInterval(interval);
  }, []);

  const showChrome = fullBleed || split || cinematic;
  const isPhotoHero = cinematic || split;
  const slideBottom = isPhotoHero ? 'bottom-0' : 'bottom-11 sm:bottom-12';

  const navBtnClass = isPhotoHero
    ? 'absolute top-1/2 z-[32] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/40 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 sm:h-11 sm:w-11'
    : 'absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow-md backdrop-blur-[2px] transition hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80';

  const imageSizes = split
    ? '(max-width: 1023px) 100vw, 58vw'
    : fullBleed
      ? '100vw'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 640px';

  const renderSlide = () => {
    if (split) {
      return (
        <div className="absolute inset-0 overflow-hidden bg-[#FFF8F0]">
          <Image
            src={heroImages[currentIndex]}
            alt={`Darshan Style Hub promotional banner ${currentIndex + 1} of ${heroImages.length}`}
            fill
            sizes={imageSizes}
            quality={90}
            placeholder="empty"
            className="object-cover [object-position:center_18%]"
            priority={currentIndex === 0}
            draggable={false}
          />
        </div>
      );
    }
    if (cinematic && fullBleed) {
      // Portrait / narrow viewports: object-cover crops left-right; object-contain until lg on cream (#FFF8F0) letterboxing.
      const fitClass =
        currentIndex === 0
          ? 'object-contain object-center lg:object-cover lg:object-bottom'
          : 'object-contain object-center lg:object-cover lg:object-center';

      return (
        <div className="absolute inset-0 bg-[#FFF8F0] isolate">
          {/* Full-bleed inset: avoid extra inset on mobile — it scales the bitmap slightly and looks softer on retina */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={heroImages[currentIndex]}
              alt={`Darshan Style Hub promotional banner ${currentIndex + 1} of ${heroImages.length}`}
              fill
              sizes="100vw"
              quality={90}
              placeholder="empty"
              className={`${fitClass} [backface-visibility:hidden]`}
              priority={currentIndex === 0}
              fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      );
    }
    const fitClass =
      fullBleed ? 'object-contain object-center bg-[#FFF8F0]' : 'object-cover object-center bg-[#FFF8F0]';
    return (
      <Image
        src={heroImages[currentIndex]}
        alt={`Darshan Style Hub promotional banner ${currentIndex + 1} of ${heroImages.length}`}
        fill
        sizes={imageSizes}
        quality={90}
        placeholder="empty"
        className={fitClass}
        priority={currentIndex === 0}
        draggable={false}
      />
    );
  };

  return (
    <div className="relative h-full w-full min-h-0">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className={`absolute inset-x-0 top-0 ${slideBottom} ${isPhotoHero ? '' : 'will-change-[opacity]'}`}
        >
          {renderSlide()}
        </motion.div>
      </AnimatePresence>

      {!isPhotoHero && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-[1] ring-1 ring-inset ring-black/[0.06] ${slideBottom} ${fullBleed ? '' : 'rounded-2xl'}`}
          aria-hidden
        />
      )}

      {showChrome && (
        <>
          <button type="button" aria-label="Previous banner" onClick={goPrev} className={`${navBtnClass} left-3 sm:left-5 md:left-8`}>
            <FiChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </button>
          <button type="button" aria-label="Next banner" onClick={goNext} className={`${navBtnClass} right-3 sm:right-5 md:right-8`}>
            <FiChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </button>
        </>
      )}

      <div
        className={`absolute left-1/2 z-[32] flex -translate-x-1/2 gap-2 ${isPhotoHero ? 'bottom-6 sm:bottom-8' : 'bottom-3 sm:bottom-4'}`}
      >
        {heroImages.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Show banner ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? isPhotoHero
                  ? 'w-7 bg-primary-800 shadow-md ring-1 ring-primary-700/35'
                  : 'w-6 bg-white shadow-sm'
                : isPhotoHero
                  ? 'w-2.5 bg-primary-600/30 hover:bg-primary-600/55'
                  : 'w-2.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
