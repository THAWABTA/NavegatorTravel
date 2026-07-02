# 🛩️ Jesko Jets - Premium Aviation Experience

Jesko Jets is a high-end, animated landing page designed for a private aviation operator. It offers a seamless and visually stunning journey through the world of exclusive travel, leveraging advanced scroll-based animations to create a premium digital experience.

<img width="1920" height="1080" alt="Screenshot (250)" src="https://github.com/user-attachments/assets/3ceb8b9c-525f-4a2b-b1b5-8b81a4e0b5fc" />

---

## ✨ Key Features

*   **Premium Scroll Animations**: Built with GSAP and ScrollTrigger for a cinematic, depth-filled experience (parallax, scaling, and entrance effects).
*   **Smooth Scroll Logic**: Integrated with `lenis` for buttery-smooth scrolling that enhances the user journey.
*   **Interactive Components**: Elegant hover states and micro-animations using Framer Motion.
*   **Performance First**: Optimized with Next.js 15+ and modern web standards.
*   **Responsive Excellence**: Fully responsive design tailored for mobile, tablet, and desktop viewports.
*   **Visual Storytelling**: A layered "hero" section that mimics a cockpit/window view, pulling users into the experience.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Animation**: [GSAP](https://gsap.com/) & [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- **Gestures/Transitions**: [Framer Motion](https://www.framer.com/motion/)
- **Smooth Scroll**: [Lenis](https://lenis.darkroom.engineering/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📂 Project Structure

```text
src/
├── app/            # Next.js App Router (Layouts, Pages, Providers)
├── assets/         # Visual assets (Images, Logos, SVGs)
└── components/     # Reusable UI components
    ├── Hero/       # Main animation-heavy landing section
    ├── Navbar/     # Dynamic navigation system
    └── About/      # Content sections with reveal animations
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Thakuma07/JeskoJets-ScrollAnimation.git
   cd jesko-jets-animated-main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000` to see the results.

---

## 💡 Implementation Notes

- **Scroll Pinning**: The main hero section uses GSAP `pin` to hold the view while internal animations (like scaling the "window") occur.
- **GSAP Context**: Uses `@gsap/react` for safe cleaning of animations in React's development mode.
- **Z-Index Strategy**: Specific layering in `SmoothScrollHero.jsx` ensures the logo remains interactive while the "sky" moves behind it.


