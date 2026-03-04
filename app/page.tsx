
import Image from "next/image";
import { APP_STORE_URL } from "@/app/config/links";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 pt-40 pb-14 text-center">

        {/* Hero */}
        <div className="text-center animate-fade-in">
          <h1
            className="text-[clamp(2.8rem,6vw,4.5rem)] tracking-tight leading-[1.1] mb-32"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Know your swing.
          </h1>
          <div className="flex flex-col items-center mt-8 mb-8">
            <img
              src="/logo_transparent.svg"
              alt="Fairway logo"
              className="w-[200px] h-[200px]"
            />
            <span
              className="text-[clamp(2.35rem,5.4vw,3.8rem)] tracking-tight leading-[1.1] mt-4"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              Fairway
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-4 mt-12 mb-28 flex-wrap">
          <a
            href={APP_STORE_URL}
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

        {/* Divider before screenshots */}

        {/* Screenshots */}
        <section className="mb-32 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center">
            <Image
              src="/app-store/v1.0/01_lift-club.png"
              alt="Lift your club to start recording"
              width={380}
              height={820}
              className="rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-gray-900"
              priority
            />
            <Image
              src="/app-store/v1.0/02_no-timers.png"
              alt="No timers. No tapping."
              width={380}
              height={820}
              className="rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-gray-900"
            />
            <Image
              src="/app-store/v1.0/03_instant-replay.png"
              alt="Instant replay. On loop."
              width={380}
              height={820}
              className="rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-gray-900"
            />
          </div>
        </section>

        {/* Emotional Close Section */}
        <section className="max-w-3xl mx-auto text-center pt-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-11">
            See it back instantly.
          </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-12">
            While the feel is still fresh.
          </p>
          <div className="text-2xl font-semibold tracking-tight space-y-2">
            <p>Swing.</p>
            <p>Loop.</p>
            <p>Repeat.</p>
          </div>
        </section>

          <section className="flex justify-center mt-32 mb-12">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Image
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                width={180}
                height={60}
              />
            </a>
          </section>

      </div>
    </main>
  );
}