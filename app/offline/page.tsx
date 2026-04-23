import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function OfflinePage() {
  return (
    <div className="auth-screen">
      <BrandMark />
      <h1 className="h1">
        The connection is,
        <br />
        <em>for a moment, elsewhere.</em>
      </h1>
      <p className="intro">
        Please try again shortly. Your bookings and reservations have been kept
        in place.
      </p>
      <Link href="/today" className="btn btn-terracotta">
        Try again
      </Link>
    </div>
  );
}
