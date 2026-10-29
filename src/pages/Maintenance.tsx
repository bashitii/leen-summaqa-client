// MAINTENANCE PAGE. The only thing the public sees while the server's MAINTENANCE_MODE=true: no menu, no footer, just this message.
// Leen (signed in as admin) bypasses it, see MaintenanceGate in App.tsx.
import { useSeo } from '../lib/hooks';

export default function Maintenance() {
  useSeo({ title: 'Under maintenance', noindex: true });   // keep this temporary page out of Google
  return <main className="grid min-h-screen place-items-center bg-[#f4f2ee] px-6 text-center normal-case tracking-normal">
    <div>
      <h1 className="font-serif text-5xl md:text-7xl">Under maintenance</h1>
      <p className="mt-4 text-[14px] text-mute">We will be back soon.</p>
    </div>
  </main>;
}
