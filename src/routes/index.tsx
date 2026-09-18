import { createFileRoute } from "@tanstack/react-router";

import { BloomCanvas } from "@/components/BloomCanvas";
import { CreatorInfo } from "@/components/CreatorInfo";

const SITE_URL = "https://bloomtoy.vercel.app";

const jsonLd = [
  // 1. WebSite
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "BLOOM TOY",
    alternateName: ["Bloom Toy", "Bloomtoy", "bloomtoy"],
    url: SITE_URL,
    description:
      "BLOOM TOY is an interactive generative botanical experience where users can grow flowers through interaction, influence plants with cursor-driven wind, and experience an evolving day-to-night environment.",
    author: {
      "@id": `${SITE_URL}/#creator`,
    },
  },
  // 2. WebPage
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    url: SITE_URL,
    name: "BLOOM TOY — An Interactive Generative Botanical Toy",
    description:
      "BLOOM TOY is an interactive generative botanical experience where you grow flowers, create wind, and watch a living digital garden evolve.",
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#app`,
    },
    creator: {
      "@id": `${SITE_URL}/#creator`,
    },
  },
  // 3. SoftwareApplication
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#app`,
    name: "BLOOM TOY",
    alternateName: ["Bloom Toy", "Bloomtoy", "bloomtoy"],
    url: SITE_URL,
    description:
      "BLOOM TOY is an interactive generative botanical experience where users can grow flowers through interaction, influence plants with cursor-driven wind, and experience an evolving day-to-night environment.",
    applicationCategory: "WebApplication",
    genre: ["Interactive Art", "Generative Art", "Creative Coding", "Digital Garden"],
    operatingSystem: "Web Browser",
    author: {
      "@id": `${SITE_URL}/#creator`,
    },
    creator: {
      "@id": `${SITE_URL}/#creator`,
    },
  },
  // 4. Person
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#creator`,
    name: "Abhijithkumar N",
    jobTitle: "UI/UX Designer · Design Engineer",
    url: "https://abhijithkumar3.vercel.app/",
    sameAs: [
      "https://abhijithkumar3.vercel.app/",
      "https://www.linkedin.com/in/abhijithkumar-n/",
      "https://github.com/abhijithkumar3/",
    ],
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BLOOM TOY — An Interactive Generative Botanical Toy" },
      {
        name: "description",
        content:
          "BLOOM TOY is an interactive generative botanical experience where you grow flowers, create wind, and watch a living digital garden evolve.",
      },
      // Open Graph
      {
        property: "og:title",
        content: "BLOOM TOY — An Interactive Generative Botanical Toy",
      },
      {
        property: "og:description",
        content:
          "BLOOM TOY is an interactive generative botanical experience where you grow flowers, create wind, and watch a living digital garden evolve.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      // Twitter Card
      {
        name: "twitter:title",
        content: "BLOOM TOY — An Interactive Generative Botanical Toy",
      },
      {
        name: "twitter:description",
        content:
          "BLOOM TOY is an interactive generative botanical experience where you grow flowers, create wind, and watch a living digital garden evolve.",
      },
    ],
    scripts: jsonLd.map((schema) => ({
      type: "application/ld+json",
      children: JSON.stringify(schema),
    })),
  }),
  component: Index,
});

function Index() {
  return (
    <>
      {/* Visually hidden semantic heading — accessible to crawlers and screen readers */}
      <h1
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        BLOOM TOY
      </h1>

      {/* Visually hidden SEO content — describes the experience for crawlers */}
      <p
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        BLOOM TOY is an interactive generative botanical experience. Click anywhere to grow unique
        flowers. Watch plants develop from seed to bloom. Move your cursor to create wind and watch
        the plants sway naturally. Experience an automatic day-to-night cycle as the digital garden
        evolves. Create multiple plants and build your own generative garden. Also known as Bloom Toy
        and Bloomtoy, created by Abhijithkumar N.
      </p>

      {/* Primary interactive experience */}
      <main aria-label="BLOOM TOY interactive botanical canvas">
        <BloomCanvas />
      </main>

      <CreatorInfo />
    </>
  );
}
