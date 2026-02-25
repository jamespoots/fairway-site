import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 pt-36 pb-32 text-center">

        {/* Hero */}
        <div className="text-center space-y-8">

          <h1
            className="text-[clamp(2.8rem,6vw,4.5rem)] tracking-tight leading-[1.1]"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Know your swing.
          </h1>

          <div className="flex flex-col items-center gap-6">

            <Image
              src="/logo_black.png"
              alt="Fairway logo"
              width={180}
              height={180}
              className="rounded-xl"
            />

            <span
              className="text-[clamp(2.8rem,6vw,4.5rem)] tracking-tight leading-[1.1]"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              Fairway
            </span>

          </div>

        </div>


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