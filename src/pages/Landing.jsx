import { useEffect } from 'react';
import { SiteHeader, SiteFooter } from '../components/Shell.jsx';
import Hero from '../components/landing/Hero.jsx';
import { Marquee, FeatureStack, BeforeAfter, Personas, Stats, MagneticLink, Reveal } from '../components/landing/Sections.jsx';
import { useSettings } from '../store/settings.js';

export default function Landing() {
  const onboarded = useSettings((s) => s.onboarded);
  const startHref = onboarded ? '/library' : '/start';
  useEffect(() => {
    document.title = 'Saral · Accessible learning';
  }, []);
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero startHref={startHref} />
        <Marquee />
        <FeatureStack />
        <Stats />
        <BeforeAfter />
        <Personas />
        <section aria-labelledby="cta-h" className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
          <Reveal>
            <p className="spec">SDG 4 · Quality education · SDG 10 · Reduced inequalities</p>
            <h2 id="cta-h" className="mx-auto mt-4 max-w-4xl font-display text-5xl font-semibold tracking-tight sm:text-7xl">
              Read it your way.
            </h2>
            <div className="mt-10">
              <MagneticLink to={startHref}>Open Saral</MagneticLink>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
