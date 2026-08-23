import PlatformAdmin from "@/components/platform/PlatformAdmin";

export const metadata = {
  title: "Administrador Geral · Servo360",
  description: "Governança white-label e multi-tenant da plataforma Servo360.",
};

export default function PlatformRoute() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8">
        <PlatformAdmin />
      </div>
    </main>
  );
}
