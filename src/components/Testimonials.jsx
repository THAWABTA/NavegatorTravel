import React from 'react';
import Image from 'next/image';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { DESTINATIONS } from '../data/destinations';

const featuredDestinations = DESTINATIONS.filter(d => d.featured && d.img);

const testimonials = [
  { quote: "The most extraordinary journey of our lives. Every detail felt considered, from the first email to the final sunset.", name: "Mohammad thawabteh", location: "London", img: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80" },
  { quote: "Navigator turned our anniversary into something we'll talk about for the rest of our lives. Effortless, warm, unforgettable.", name: "Lina Haddad", location: "Amman", img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" },
  { quote: "From Istanbul to Dubai in a single seamless trip — every transfer, every stay, perfectly timed. True concierge travel.", name: "Omar Al-Farsi", location: "Dubai", img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80" },
];

export default function Testimonials() {
  return (
    <section className="testimonial-section px-6 sm:px-16 lg:px-24 py-24 lg:py-36" style={{ background: 'var(--bg-soft)' }}>
      <div className="testimonial-block grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-8">
          <p data-text-eyebrow className="eyebrow text-[var(--accent)] mb-6">Travelers love Navigator</p>
          <Quote size={36} strokeWidth={1} className="text-[var(--accent-soft)] mb-6" />
          <p data-text-heading className="display-font text-[clamp(1.8rem,4vw,3.2rem)] font-light leading-[1.3] text-[var(--ink)] italic">
            &ldquo;{testimonials[0].quote}&rdquo;
          </p>
          <div className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image src={testimonials[0].img} alt={testimonials[0].name} width={100} height={100} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div>
              <p data-text-eyebrow className="eyebrow text-[var(--ink)]">{testimonials[0].name}</p>
              <p data-text-body className="text-xs text-[var(--ink-faint)] mt-1">{testimonials[0].location}</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            {featuredDestinations.slice(0, 4).map((d) => (
              <div key={d.name} className="aspect-square overflow-hidden rounded-sm">
                <Image src={d.img} alt={d.name} fill loading="lazy" sizes="20vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button aria-label="Previous Slide" className="btn-ui-icon border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
              <ChevronLeft size={18} />
            </button>
            <button aria-label="Next Slide" className="btn-ui-icon border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
