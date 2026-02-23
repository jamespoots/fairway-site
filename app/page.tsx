export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-6">
        Hands-Free Swing Capture
      </h1>

      <p className="text-lg text-gray-600 mb-10">
        Fairway Cam automatically records your golf swing the moment you step
        away. No timers. No tapping. Just swing.
      </p>

      <div className="flex justify-center gap-4 mb-16">
        <a
          href="#"
          className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:opacity-90 transition"
        >
          Download on the App Store
        </a>

        <a
          href="#demo"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          See How It Works
        </a>
      </div>

      <section id="demo" className="text-left">
        <h2 className="text-2xl font-semibold mb-4">
          Designed for Range Practice
        </h2>
        <p className="text-gray-600">
          Set your phone down. Tap AUTO. Step into your stance. Fairway Cam
          detects motion at the lens and records your swing automatically.
          Instantly scrub through playback and repeat without interruption.
        </p>
      </section>
    </main>
  );
}