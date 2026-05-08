import { useEffect } from 'react';
import { Toaster } from 'sonner';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Index from './pages/Index';
import { setLenis } from '@/lib/lenis';
import areaCardio3 from '@/assets/gallery/cardio-3.jpg';

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    setLenis(lenis);

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <>
      {/* Background image fissa: "carta da parati" sempre visibile dietro a tutto il sito */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none"
        style={{
          backgroundImage: `url(${areaCardio3})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden="true"
      />
      {/* Velo cream semi-trasparente al 35%: lascia trasparire l'immagine ma mantiene il sito leggibile */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-background/35"
        aria-hidden="true"
      />
      <Index />
      <Toaster position="top-right" theme="light" richColors closeButton />
    </>
  );
}
