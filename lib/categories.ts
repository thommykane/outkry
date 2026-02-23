export const CATEGORY_TREE = [
  {
    id: "us-politics",
    name: "US Politics",
    children: [
      { id: "us-politics-white-house", slug: "white-house", name: "White House" },
      { id: "us-politics-congress", slug: "congress", name: "Congress" },
      { id: "us-politics-supreme-court", slug: "supreme-court", name: "Supreme Court" },
      { id: "us-politics-elections", slug: "elections", name: "Elections" },
      { id: "us-politics-policy", slug: "policy-legislation", name: "Policy & Legislation" },
    ],
  },
  {
    id: "geopolitics",
    name: "Geopolitics",
    children: [
      { id: "geopolitics-europe", slug: "europe", name: "Europe" },
      { id: "geopolitics-asia", slug: "asia", name: "Asia" },
      { id: "geopolitics-middle-east", slug: "middle-east", name: "Middle East" },
      { id: "geopolitics-trade", slug: "global-trade", name: "Global Trade" },
      { id: "geopolitics-war", slug: "war-security", name: "War & Security" },
    ],
  },
  {
    id: "business",
    name: "Business",
    children: [
      { id: "business-news", slug: "business-news", name: "Business News" },
      { id: "business-ma", slug: "mergers-acquisitions", name: "Mergers & Acquisitions" },
      { id: "business-entrepreneurship", slug: "entrepreneurship", name: "Entrepreneurship" },
      { id: "business-strategy", slug: "corporate-strategy", name: "Corporate Strategy" },
      { id: "business-trends", slug: "industry-trends", name: "Industry Trends" },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    children: [
      { id: "finance-stocks", slug: "stocks", name: "Stocks" },
      { id: "finance-bonds", slug: "bonds-commodities", name: "Bonds & Commodities" },
      { id: "finance-crypto", slug: "crypto", name: "Crypto" },
      { id: "finance-taxes", slug: "taxes", name: "Taxes" },
      { id: "finance-fed", slug: "federal-reserve-inflation", name: "Federal Reserve & Inflation" },
    ],
  },
  {
    id: "technology",
    name: "Technology",
    children: [
      { id: "tech-ai", slug: "artificial-intelligence", name: "Artificial Intelligence" },
      { id: "tech-big-tech", slug: "big-tech", name: "Big Tech" },
      { id: "tech-startups", slug: "startups", name: "Startups" },
      { id: "tech-cyber", slug: "cybersecurity", name: "Cybersecurity" },
      { id: "tech-hardware", slug: "hardware-devices", name: "Hardware & Devices" },
    ],
  },
  {
    id: "gaming",
    name: "Gaming",
    children: [
      { id: "gaming-xbox", slug: "xbox", name: "Xbox" },
      { id: "gaming-playstation", slug: "playstation", name: "PlayStation" },
      { id: "gaming-pc", slug: "pc", name: "PC" },
      { id: "gaming-nintendo", slug: "nintendo", name: "Nintendo" },
      { id: "gaming-dev", slug: "game-development", name: "Game Development" },
    ],
  },
  {
    id: "sports",
    name: "Sports",
    children: [
      { id: "sports-football", slug: "football", name: "Football" },
      { id: "sports-basketball", slug: "basketball", name: "Basketball" },
      { id: "sports-baseball", slug: "baseball", name: "Baseball" },
      { id: "sports-soccer", slug: "soccer", name: "Soccer" },
      { id: "sports-combat", slug: "combat-sports", name: "Combat Sports" },
    ],
  },
  {
    id: "true-crime",
    name: "True Crime",
    children: [
      { id: "true-crime-ongoing", slug: "ongoing-cases", name: "Ongoing Cases" },
      { id: "true-crime-cold", slug: "cold-cases", name: "Cold Cases" },
      { id: "true-crime-trials", slug: "trials", name: "Trials" },
      { id: "true-crime-organized", slug: "organized-crime", name: "Organized Crime" },
      { id: "true-crime-psychology", slug: "criminal-psychology", name: "Criminal Psychology" },
    ],
  },
  {
    id: "cars",
    name: "Cars",
    children: [
      { id: "cars-evs", slug: "evs", name: "EVs" },
      { id: "cars-performance", slug: "performance-cars", name: "Performance Cars" },
      { id: "cars-trucks", slug: "trucks-off-road", name: "Trucks & Off-Road" },
      { id: "cars-motorsports", slug: "motorsports", name: "Motorsports" },
    ],
  },
  {
    id: "film-tv",
    name: "Film & TV",
    children: [
      { id: "film-tv-movies", slug: "movies", name: "Movies" },
      { id: "film-tv-series", slug: "tv-series", name: "TV Series" },
      { id: "film-tv-streaming", slug: "streaming", name: "Streaming" },
      { id: "film-tv-actors", slug: "actors-directors", name: "Actors & Directors" },
      { id: "film-tv-reviews", slug: "reviews-analysis", name: "Reviews & Analysis" },
    ],
  },
  {
    id: "music",
    name: "Music",
    children: [
      { id: "music-rock", slug: "rock-alternative", name: "Rock & Alternative" },
      { id: "music-hiphop", slug: "hip-hop", name: "Hip Hop" },
      { id: "music-pop", slug: "pop", name: "Pop" },
      { id: "music-electronic", slug: "electronic", name: "Electronic" },
      { id: "music-production", slug: "production-songwriting", name: "Production & Songwriting" },
    ],
  },
  {
    id: "art-literature",
    name: "Art & Literature",
    children: [
      { id: "art-fiction", slug: "fiction", name: "Fiction" },
      { id: "art-nonfiction", slug: "non-fiction", name: "Non-Fiction" },
      { id: "art-scifi", slug: "sci-fi-fantasy", name: "Sci-Fi & Fantasy" },
      { id: "art-philosophy", slug: "philosophy", name: "Philosophy" },
      { id: "art-visual", slug: "visual-art", name: "Visual Art" },
    ],
  },
] as const;

export const ALL_CATEGORY_IDS = CATEGORY_TREE.flatMap((c) =>
  c.children.map((ch) => ch.id)
);

export function getCategoryById(id: string) {
  for (const cat of CATEGORY_TREE) {
    const child = cat.children.find((ch) => ch.id === id);
    if (child) return { parent: cat, child };
  }
  return null;
}
