import Link from "next/link";
import { AdminClassForm } from "@/components/AdminClassForm";

export default function NewClassPage() {
  return (
    <main className="oa">
      <Link href="/admin/classes" className="oa-back">‹ Classes</Link>
      <div><div className="oa-eyebrow">Programme</div><h1 className="oa-h1">New class</h1></div>
      <AdminClassForm />
    </main>
  );
}
