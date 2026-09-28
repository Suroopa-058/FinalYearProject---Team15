import { createFileRoute } from "@tanstack/react-router";
import ScholarApp from "@/components/scholar-app";

const title = "ScholarMatch — Find Scholarships That Open Doors";
const description =
  "ScholarMatch matches you with scholarships based on your education, eligibility, interests, and financial needs — powered by AI that understands your journey.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ScholarMatch",
          description,
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <ScholarApp />;
}
