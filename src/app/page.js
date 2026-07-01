import SmoothScrollHero from "@/components/SmoothScrollHero";

export const metadata = {
  title: "Home",
  alternates: {
    canonical: "https://yourdomain.com", // TODO: set real production domain
  },
  openGraph: {
    title: "Home | Navigator — Travel Beyond",
    url: "https://yourdomain.com", // TODO: set real production domain
    type: "website",
  },
};

export default function Home() {
  return <SmoothScrollHero />;
}
