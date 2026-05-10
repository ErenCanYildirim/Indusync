"use client";

import { useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { AboutUs } from "@/components/landing/AboutUs";
import { SpecializedAreas } from "@/components/landing/SpecializedAreas";
import { Services } from "@/components/landing/Services";
import { CTA } from "@/components/landing/CTA";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";

interface HomeProps {
  locale: string;
}

export default function Home({ locale }: HomeProps) {
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.hash && link.origin === window.location.origin) {
        e.preventDefault();
        const targetElement = document.querySelector(link.hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16">
        <Hero />
        <AboutUs />
        <SpecializedAreas />
        <Services />
        <CTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
