import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 pt-36 pb-32 text-center">

        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Image
            src="/icon.png"
            alt="Fairway logo"
            width={112}
            height={112}
            className="rounded-2xl shadow-2xl shadow-emerald-400/15"
            priority
          />
        </div>

        {/* Hero */}
        <h1 className="font-bold tracking-tight leading-[1.1] mb-14 max-w-3xl mx-auto">
          <span className="block text-[clamp(2.2rem,5vw,4rem)]">
            Know Your Swing.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-200 mb-20 leading-relaxed max-w-2xl mx-auto">
        {/* Old tag line:  Each swing is captured and instantly looped — while the feel is still fresh.*/}          
        Lift your club. Record automatically. Instant replay.
        </p>

        {/* CTA */}
        <div className="flex justify-center gap-4 mb-36 flex-wrap">
          <a
            href="https://apps.apple.com/app/id0000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Image
              src="/app-store-badge.svg"
              alt="Download on the App Store"
              width={180}
              height={60}
              priority
            />
          </a>

          <a
            href="#demo"
            className="px-8 py-3 border border-gray-600 rounded-lg font-medium hover:bg-white/10 transition min-w-[180px]"
          >
            See It In Action
          </a>
        </div>

        {/* Screenshots */}
        <section className="mb-48 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center">

            <Image
              src="/app-store/v1.0/01_lift-club.png"
              alt="Lift your club to start recording"
              width={380}
              height={820}
              className="rounded-3xl shadow-2xl border border-gray-800"
              priority
            />

            <Image
              src="/app-store/v1.0/02_no-timers.png"
              alt="No timers. No tapping."
              width={380}
              height={820}
              className="rounded-3xl shadow-2xl border border-gray-800"
            />

            <Image
              src="/app-store/v1.0/03_instant-replay.png"
              alt="Instant replay. On loop."
              width={380}
              height={820}
              className="rounded-3xl shadow-2xl border border-gray-800"
            />

          </div>
        </section>

        {/* Features */}
        <section id="demo" className="max-w-2xl mx-auto text-center pt-12">

          <h2 className="text-2xl font-semibold text-white mb-10">
            Instant Golf Swing Replay
          </h2>

          <p className="text-gray-300 leading-relaxed mb-8">
            Lift your club toward the camera to start recording.
            <br />
            Step back and swing.
          </p>

          <div className="text-gray-400 space-y-2 mb-8">
            <p>No timers.</p>
            <p>No tapping record.</p>
          </div>

          <ul className="text-gray-300 space-y-3 mb-12 list-disc list-inside inline-block text-left">
            <li>Club-triggered recording</li>
            <li>10-second swing capture</li>
            <li>Instant looping playback</li>
          </ul>

          <div className="text-xl font-semibold text-white space-y-1">
            <p>Swing.</p>
            <p>Loop.</p>
            <p>Repeat.</p>
          </div>

        </section>

      </div>
    </main>
  );
}