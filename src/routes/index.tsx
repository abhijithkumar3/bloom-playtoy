import { createFileRoute } from "@tanstack/react-router";

import { BloomCanvas } from "@/components/BloomCanvas";
import { CreatorInfo } from "@/components/CreatorInfo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BLOOM — Living Botanical Canvas" },
      {
        name: "description",
        content:
          "An interactive botanical art canvas where clicks grow plants, cursor movement creates wind, and time shifts the garden through day and night.",
      },
      { property: "og:title", content: "BLOOM — Living Botanical Canvas" },
      {
        property: "og:description",
        content:
          "Click to grow luminous procedural plants, move to stir them with wind, and watch the living garden change with time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <BloomCanvas />
      <CreatorInfo />
    </>
  );
}
