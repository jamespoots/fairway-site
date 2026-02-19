export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        Effective Date: February 2026
      </p>

      <p className="mb-4">
        Fairway is a golf swing video capture application.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Information We Collect</h2>
      <p className="mb-4">
        Fairway does not collect personal information. Videos recorded in the app remain stored locally on your device.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Camera Access</h2>
      <p className="mb-4">
        Camera access is required to record swing videos. Recordings are not uploaded to any server.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Third-Party Services</h2>
      <p className="mb-4">
        Fairway does not use advertising SDKs, tracking tools, or third-party analytics services in version 1.0.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
        <p>
            Email:{" "}
            <a href="mailto:pootsjames@gmail.com" className="underline">
                pootsjames@gmail.com
             </a>
        </p>
    </main>
  );
}
