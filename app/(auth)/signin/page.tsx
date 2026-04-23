import { Suspense } from "react";
import { BrandMark } from "@/components/BrandMark";
import { SignInForm } from "@/components/SignInForm";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="auth-screen">
      <BrandMark />
      <h1 className="h1">
        Welcome
        <br />
        <em>back.</em>
      </h1>
      <p className="intro">
        Sign in to view your programme, book a session, or reserve a place at an
        upcoming gathering.
      </p>
      <Suspense fallback={<div className="auth-form" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
