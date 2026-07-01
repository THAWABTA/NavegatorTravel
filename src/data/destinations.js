export const DESTINATIONS = [
  // ─── FEATURED / HOMEPAGE DESTINATIONS ────────────────────────────────────
  { 
    id: "istanbul", name: "Istanbul", region: "Türkiye", 
    lat: 41.0082, lon: 28.9784, tag: "Culture", 
    img: "/pic/istanbul 2.jpg.jpeg", 
    desc: "Where two continents meet — domes, minarets, and the Bosphorus shimmering between East and West.",
    featured: true
  },
  { 
    id: "dubai", name: "Dubai", region: "UAE", 
    lat: 25.2048, lon: 55.2708, tag: "Luxury", 
    img: "/pic/dubai2.jpg.jpeg", 
    desc: "A futuristic skyline rising from golden dunes — the height of modern indulgence and design.",
    featured: true
  },
  { 
    id: "trabzon", name: "Trabzon", region: "Türkiye", 
    lat: 41.0015, lon: 39.7178, tag: "Nature", 
    img: "/pic/trabzon.jpg.jpeg", 
    desc: "Misty highlands, emerald tea terraces, and a Black Sea coastline of quiet, untouched beauty.",
    featured: true
  },
  { 
    id: "sharm", name: "Sharm El Sheikh", region: "Egypt", 
    lat: 27.9158, lon: 34.3300, tag: "Coastline", 
    img: "/pic/sharm al shiekh.jpg", 
    desc: "Coral reefs and desert mountains framing the Red Sea's calmest, most radiant waters.",
    featured: true
  },

  // ─── SECONDARY DESTINATIONS ────────────────────────────────────────────────
  { 
    id: "tbilisi", name: "Tbilisi", region: "Georgia", 
    lat: 41.6938, lon: 44.8015, tag: "Discovery", 
    img: "/pic/Tbilisi Georgia.jpg.jpeg", 
    desc: "Cobbled old-town streets, sulfur baths, and mountains on every horizon.",
    secondary: true
  },
  { 
    id: "batumi", name: "Batumi", region: "Georgia", 
    lat: 41.6168, lon: 41.6367, tag: "Seaside", 
    img: "/pic/batumi.jpg", 
    desc: "A subtropical seaside city where modern towers meet Black Sea boardwalks.",
    secondary: true
  },
  { 
    id: "antalya", name: "Antalya", region: "Türkiye", 
    lat: 36.8969, lon: 30.7133, tag: "Coastline", 
    img: "/pic/antalya.jpg.jpeg", 
    desc: "Turquoise Mediterranean waters beneath pine-covered cliffs and ancient ruins.",
    secondary: true
  },
  { 
    id: "srilanka", name: "Sri Lanka", region: "Indian Ocean", 
    lat: 7.8731, lon: 80.7718, tag: "Adventure", 
    img: "/pic/sri lanka.jpg.jpeg", 
    desc: "Emerald hills, ancient temples, and wild coastlines layered with history.",
    secondary: true
  },
  { 
    id: "phuket", name: "Phuket", region: "Thailand", 
    lat: 7.8804, lon: 98.3923, tag: "Islands", 
    img: "/pic/phuket.jpg.jpeg", 
    desc: "Limestone cliffs, warm seas, and the easy rhythm of tropical island life.",
    secondary: true
  },
  { 
    id: "kualalumpur", name: "Kuala Lumpur", region: "Malaysia", 
    lat: 3.1390, lon: 101.6869, tag: "City", 
    img: "/pic/kuala lumpur.jpg.jpeg", 
    desc: "Glass towers and night markets — a vibrant skyline alive after dark.",
    secondary: true
  },
  { 
    id: "cairo", name: "Cairo", region: "Egypt", 
    lat: 30.0444, lon: 31.2357, tag: "Heritage", 
    img: "/pic/cairo.jpg", 
    desc: "Ancient wonders rise beside a living city on the banks of the Nile.",
    secondary: true
  },
  { 
    id: "baku", name: "Azerbaijan", region: "Azerbaijan", 
    lat: 40.4093, lon: 49.8671, tag: "Discovery", 
    img: "/pic/azerbaijan.jpg", 
    desc: "Flame towers and old-world alleys meet along the Caspian shoreline.",
    secondary: true
  },

  // ─── ADDITIONAL GLOBE & SEARCH DESTINATIONS ────────────────────────────────
  { 
    id: "bali", name: "Bali", region: "Indonesia", 
    lat: -8.3405, lon: 115.0920, tag: "Spiritual", 
    img: "/pic/bali.jpg.jpeg", 
    desc: "Where the spirit of a place becomes the entire reason for the journey." 
  },
  { 
    id: "bangkok", name: "Bangkok", region: "Thailand", 
    lat: 13.7563, lon: 100.5018, tag: "Vibrant", 
    img: "/pic/bangkok.jpg.jpeg", 
    desc: "Temples and tuk-tuks, rooftop bars and river life — a city of infinite motion." 
  },
  { 
    id: "langkawi", name: "Langkawi", region: "Malaysia", 
    lat: 6.3500, lon: 99.8000, tag: "Islands", 
    img: "/pic/Langkawi.jpg.jpeg", 
    desc: "Rainforest-covered islands rising from an emerald Andaman Sea." 
  },
  { 
    id: "maldives", name: "Maldives", region: "Maldives", 
    lat: 4.1755, lon: 73.5093, tag: "Paradise", 
    img: "/pic/maldives2.jpg.jpeg", 
    desc: "A thousand islands of pure light — the ocean distilled to its most perfect form." 
  },
  { 
    id: "hurghada", name: "Hurghada", region: "Egypt", 
    lat: 27.2574, lon: 33.8116, tag: "Diving", 
    img: "/pic/hurghada.jpg", 
    desc: "A Red Sea jewel where the desert meets the most vivid coral gardens on the planet." 
  },
  { 
    id: "indonesia", name: "Indonesia", region: "Indonesia", 
    lat: -2.5489, lon: 118.0149, tag: "Discovery", 
    img: "/pic/indonesia.jpg", 
    desc: "An archipelago of volcanoes, temples, and tides — seventeen thousand islands of story." 
  },
  { 
    id: "rome", name: "Italy", region: "Italy", 
    lat: 41.9028, lon: 12.4964, tag: "Culture", 
    img: "/pic/italy.jpg", 
    desc: "Every cobblestone a chapter, every ruin a reminder that beauty endures." 
  },
  { 
    id: "vietnam", name: "Vietnam", region: "Vietnam", 
    lat: 16.0544, lon: 108.2022, tag: "Culture", 
    img: "/pic/vietnam.jpg", 
    desc: "Lantern-lit ancient towns, emerald bays, and a cuisine that changes the way you think about food." 
  },
  { 
    id: "london", name: "London", region: "United Kingdom", 
    lat: 51.5074, lon: -0.1278, tag: "Editorial", 
    img: "/pic/london.jpg", 
    desc: "The city that invented editorial elegance — fog, art, architecture and relentless reinvention." 
  },
  { 
    id: "malaysia", name: "Malaysia", region: "Malaysia", 
    lat: 4.2105, lon: 101.9758, tag: "Discovery", 
    img: "/pic/malaysia.jpg", 
    desc: "Rainforest, reef, and skyline in one country — a crossroads of cultures and coastlines." 
  },
  { 
    id: "doha", name: "Doha", region: "Qatar", 
    lat: 25.2854, lon: 51.5310, tag: "Modern", 
    img: "/pic/qatar doha.jpg", 
    desc: "A peninsula of pearl divers turned skyline dreamers, where the desert meets the Arabian Gulf." 
  },
  { 
    id: "pristina", name: "Kosovo", region: "Kosovo", 
    lat: 42.6629, lon: 21.1655, tag: "Discovery", 
    img: "/pic/kosovo.jpg", 
    desc: "Europe's youngest nation — raw, vital, and rising with unexpected energy." 
  },
  { 
    id: "sochi", name: "Sochi", region: "Russia", 
    lat: 43.6028, lon: 39.7342, tag: "Coastline", 
    img: "/pic/sochi.jpg", 
    desc: "Where the Caucasus Mountains descend to a warm Black Sea riviera." 
  },
  { 
    id: "thailand", name: "Thailand", region: "Thailand", 
    lat: 15.8700, lon: 100.9925, tag: "Discovery", 
    img: "/pic/thailand.jpg", 
    desc: "Golden temples, jungle highlands, and island seas — a kingdom built for wonder." 
  },

  // ─── DESTINATIONS MISSING IMAGES IN /pic/ ──────────────────────────────────
  { 
    id: "marmaris", name: "Marmaris", region: "Türkiye", 
    lat: 36.8551, lon: 28.2771, tag: "Seaside", 
    img: "", // TODO: Missing image. Provide an image in /pic/
    desc: "Pine forests descend to a sapphire bay where yachts rest and old castles watch the horizon." 
  },
  { 
    id: "fethiye", name: "Fethiye", region: "Türkiye", 
    lat: 36.6218, lon: 29.1160, tag: "Sailing", 
    img: "", // TODO: Missing image. Provide an image in /pic/
    desc: "Turquoise lagoons, ancient Lycian tombs, and the most celebrated sailing waters on Earth." 
  },
  { 
    id: "yerevan", name: "Armenia", region: "Armenia", 
    lat: 40.1792, lon: 44.4991, tag: "Heritage", 
    img: "", // TODO: Missing image. Provide an image in /pic/
    desc: "Rose-hued city beneath the shadow of ancient Ararat — a nation that survived everything." 
  },
  { 
    id: "beirut", name: "Beirut", region: "Lebanon", 
    lat: 33.8938, lon: 35.5018, tag: "Culture", 
    img: "", // TODO: Missing image. Provide an image in /pic/
    desc: "The Paris of the Middle East — resilient, electric, layered with history and nightlife." 
  }
];
