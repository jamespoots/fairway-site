export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">

      {/* Logo */}
      <div className="flex justify-center mb-10">
        <img
          src="/icon.png"
          alt="Fairway logo"
          className="w-28 h-28 rounded-2xl shadow-2xl shadow-emerald-500/20"
        />
      </div>

      {/* Headline */}
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
        Hands-Free Swing Capture
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-gray-300 mb-12 leading-relaxed">
        Fairway Cam automatically records your golf swing the moment you step
        away. No timers. No tapping. Just swing.
      </p>

      {/* CTAs */}
      <div className="flex justify-center gap-4 mb-20">
        <a
          href="#"
          className="px-7 py-3 bg-white text-black rounded-lg font-semibold hover:opacity-90 transition"
        >
          Get Fairway Cam
        </a>

        <a
          href="#demo"
          className="px-7 py-3 border border-gray-500 rounded-lg font-medium hover:bg-white/10 transition"
        >
          See How It Works
        </a>
      </div>

      {/* Secondary Section */}
      <section id="demo" className="text-left">
        <h2 className="text-2xl font-semibold mb-4">
          Designed for Range Practice
        </h2>
        <p className="text-gray-400 leading-relaxed">
          Set your phone down. Tap AUTO. Step into your stance. Fairway Cam
          detects motion at the lens and records your swing automatically.
          Instantly scrub through playback and repeat without interruption.
        </p>
      </section>

    </main>
  );
}