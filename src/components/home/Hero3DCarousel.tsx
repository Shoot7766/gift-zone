"use client";

import { useEffect, useMemo, useState } from "react";

type Slide = {
  id: string;
  image: string;
  title: string;
  text: string;
};

const SLIDES: Slide[] = [
  {
    id: "s1",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1400&fit=crop",
    title: "Har hafta yangilanadigan tanlangan sovg'alar",
    text: "Logo uslubiga mos ko'k-pushti aksentlar, premium banner va zamonaviy savdo maydoni ko'rinishi.",
  },
  {
    id: "s2",
    image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=1400&fit=crop",
    title: "Romantik lahzalar uchun estetik tanlovlar",
    text: "Atirgul buketlari, gul qutilari va syurpriz to'plamlar bilan maxsus kunni unutilmas qiling.",
  },
  {
    id: "s3",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1400&fit=crop",
    title: "Yorqin LED va neon kolleksiya",
    text: "Neon yozuvlar, foto lampalar va dekor sovg'alar bilan sovg'angizga zamonaviy uslub qo'shing.",
  },
];

export default function Hero3DCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = useMemo(() => SLIDES[activeIndex], [activeIndex]);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "560px",
        borderRadius: "32px",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        background: "#11141D",
        overflow: "hidden",
        perspective: "1200px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 80% 22%, rgba(110, 230, 255, 0.16), transparent 28%), radial-gradient(circle at 20% 84%, rgba(224, 88, 255, 0.16), transparent 24%)",
        }}
      />

      <div className="hero-3d-stage">
        {SLIDES.map((slide, index) => {
          const diff = (index - activeIndex + SLIDES.length) % SLIDES.length;
          const position = diff === 0 ? 0 : diff === 1 ? 1 : -1;

          return (
            <div
              key={slide.id}
              className={`hero-3d-card ${position === 0 ? "is-active" : ""}`}
              style={
                {
                  "--x":
                    position === 0 ? "0px" : position === 1 ? "180px" : "-180px",
                  "--z":
                    position === 0 ? "40px" : "-120px",
                  "--r":
                    position === 0 ? "0deg" : position === 1 ? "-24deg" : "24deg",
                  backgroundImage: `url('${slide.image}')`,
                  opacity: position === 0 ? 1 : 0.55,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(11,14,24,0.72) 0%, rgba(15,18,30,0.22) 42%, rgba(31,22,55,0.62) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "1.1rem",
          right: "1.1rem",
          bottom: "1.1rem",
          zIndex: 4,
          padding: "1.1rem",
          borderRadius: "16px",
          background: "rgba(8,10,18,0.58)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ color: "white", fontWeight: 900, fontSize: "1.02rem", marginBottom: "0.35rem" }}>
          {activeSlide.title}
        </div>
        <div style={{ color: "rgba(255,255,255,0.74)", fontSize: "0.86rem", lineHeight: 1.55 }}>
          {activeSlide.text}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.7rem" }}>
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === activeIndex ? "24px" : "8px",
                height: "8px",
                borderRadius: "999px",
                border: "none",
                background: i === activeIndex ? "white" : "rgba(255,255,255,0.45)",
                cursor: "pointer",
                transition: "all .25s ease",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .hero-3d-stage {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          display: grid;
          place-items: center;
          z-index: 2;
        }
        .hero-3d-card {
          position: absolute;
          width: 78%;
          height: 72%;
          border-radius: 24px;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 24px 60px rgba(0,0,0,.35);
          transform: translateX(var(--x)) translateZ(var(--z)) rotateY(var(--r));
          transition: transform .7s ease, opacity .55s ease;
        }
        .hero-3d-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,.42) 100%);
        }
        .hero-3d-card.is-active {
          box-shadow: 0 32px 90px rgba(0,0,0,.42);
        }
        @media (max-width: 900px) {
          .hero-3d-card {
            width: 88%;
            height: 70%;
          }
        }
      `}</style>
    </div>
  );
}
