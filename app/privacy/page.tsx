import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        <strong>Effective Date:</strong> February 2026
      </p>

      <p className="mb-4">
        Fairway is a golf swing video capture application designed to help
        golfers record and review their swings.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        Information We Collect
      </h2>
      <p className="mb-4">
        Fairway does not collect personal information. The app does not require
        account creation, login, or user registration.
      </p>
      <p className="mb-4">
        All recorded videos and session data remain stored locally on your
        device. No data is transmitted to external servers.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Camera Access</h2>
      <p className="mb-4">
        Camera access is required to record swing videos. Recordings are not
        uploaded, shared, or transmitted outside of your device.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        Third-Party Services
      </h2>
      <p className="mb-4">
        Fairway does not use advertising SDKs, tracking tools, analytics
        services, or third-party data collection services in version 1.0.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        Changes to This Policy
      </h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. Any changes will
        be reflected on this page with an updated effective date.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>
        Email:{" "}
        <a href="mailto:support@fairway.cam" className="underline">
          support@fairway.cam
        </a>
      </p>
    </main>
  );
}