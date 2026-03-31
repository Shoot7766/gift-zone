import TrustBand from "@/components/home/TrustBadges";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FeaturedShops from "@/components/home/FeaturedShops";
import HowItWorks from "@/components/home/HowItWorks";
import CTASection from "@/components/home/CTASection";
import SmartRecommender from "@/components/home/SmartRecommender";
import Hero3DCarousel from "@/components/home/Hero3DCarousel";
import { Link } from "@/navigation";
import { ArrowRight, Store } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "1.25rem var(--page-pad) 4rem",
          background: "linear-gradient(180deg, #0E1017 0%, #161B28 52%, #1B2131 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 18%, rgba(223, 91, 255, 0.22), transparent 24%), radial-gradient(circle at 82% 16%, rgba(92, 222, 255, 0.18), transparent 20%), radial-gradient(circle at 60% 100%, rgba(125, 99, 255, 0.18), transparent 28%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div
            className="home-hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: "2rem",
              alignItems: "stretch",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "1rem 0" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.55rem 0.95rem",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#EFF8FF",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  width: "fit-content",
                  marginBottom: "1rem",
                }}
              >
                Gift Zone premium sovg&apos;alar maydoni
              </div>
              <h1
                style={{
                  color: "white",
                  fontWeight: 900,
                  fontSize: "clamp(2.5rem, 5.6vw, 5rem)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.05em",
                  marginBottom: "1rem",
                }}
              >
                Sovg&apos;a tanlashni{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #DB6DFF, #64DAFF)",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  yanada chiroyli
                </span>
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.76)",
                  fontSize: "1.06rem",
                  lineHeight: 1.75,
                  maxWidth: "620px",
                  marginBottom: "1.4rem",
                }}
              >
                Gul qutilari, premium sovg&apos;a to&apos;plamlari, shirinliklar, tortlar va romantik sovg&apos;alarni
                zamonaviy uslubda bir joydan toping.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                {["Premium sovg'a qutilari", "Gullar va syurprizlar", "Logo ranglariga mos tanlov"].map((chip) => (
                  <span
                    key={chip}
                    style={{
                      padding: "0.5rem 0.8rem",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#F4F7FF",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link href="/katalog" className="btn btn-primary btn-lg">
                  Katalogga o&apos;tish <ArrowRight size={18} />
                </Link>
                <Link
                  href="/dokonlar"
                  className="btn btn-glass btn-lg"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.14)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <Store size={18} color="#7FE7FF" /> Do&apos;konlarni ko&apos;rish
                </Link>
              </div>
              <div
                className="home-hero-stats"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "0.85rem",
                  marginTop: "1.6rem",
                }}
              >
                {[
                  { value: "4+", label: "Test do'konlar" },
                  { value: "8+", label: "Demo mahsulotlar" },
                  { value: "4.8", label: "O'rtacha reyting" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: "1rem 1rem 0.9rem",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div style={{ color: "white", fontSize: "1.35rem", fontWeight: 900 }}>
                      {stat.value}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.66)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        marginTop: "0.2rem",
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Hero3DCarousel />
          </div>
        </div>
      </section>
      <style>{`
        @media (max-width: 900px) {
          .home-hero-grid { grid-template-columns: 1fr !important; }
          .home-hero-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <TrustBand />
      <CategoriesSection />
      <FeaturedProducts />
      <HowItWorks />
      <FeaturedShops />
      <CTASection />
      <SmartRecommender />
    </main>
  );
}
