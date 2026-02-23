import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-28 text-center">

        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Image
            src="/icon.png"
            alt="Fairway logo"
            width={112}
            height={112}
            className="rounded-2xl shadow-2xl shadow-emerald-500/20"
            priority
          />
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Hands-Free Swing Capture
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-200 mb-14 leading-relaxed max-w-2xl mx-auto">
          Fairway automatically records your golf swing the moment you step away.<br />
          No timers. No tapping. Just swing.
        </p>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 mb-24">
          <a
            href="#"
            className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:opacity-90 transition"
          >
            Get Fairway
          </a>

          <a
            href="#demo"
            className="px-8 py-3 border border-gray-600 rounded-lg font-medium hover:bg-white/10 transition"
          >
            See How It Works
          </a>
        </div>

        {/* Demo Screenshot */}
        <div className="flex justify-center mb-28">
          <div className="p-4 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-3xl">
            <Image
              src="/demo-swing.jpg"
              alt="Fairway Cam swing playback"
              width={500}
              height={900}
              className="rounded-2xl shadow-2xl border border-gray-800"
            />
          </div>
        </div>

        {/* Secondary Section */}
        <section id="demo" className="text-left">
          <h2 className="text-2xl font-semibold mb-4">
            Designed for Range Practice
          </h2>

          <p className="text-gray-400 leading-relaxed max-w-2xl">
            Set up your phone. Tap AUTO. Step into your stance. Fairway
            detects motion at the lens and records your swing automatically.
            Instantly scrub through playback and repeat without interruption.
          </p>
        </section>

      </div>
    </main>
  );
}