import { Suspense } from "react";
import CandidateRegisterClient from "./CandidateRegisterClient";

export default function CandidateRegisterPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading invite...</div>}>
      <CandidateRegisterClient />
    </Suspense>
  );
}