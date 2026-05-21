"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CandidateInviteResponse = {
  valid: boolean;
  candidate: {
    id: string;
    full_name: string;
    email: string;
  };
};

export default function CandidateRegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [inviteError, setInviteError] = useState("");
  const [formError, setFormError] = useState("");

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function validateInvite() {
      if (!token) {
        setInviteError("Invite token is missing.");
        setLoadingInvite(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/candidate-invites/validate?token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setInviteError(data.error || "Invalid invite link.");
          setLoadingInvite(false);
          return;
        }

        const inviteData = data as CandidateInviteResponse;

        setCandidateName(inviteData.candidate.full_name || "");
        setCandidateEmail(inviteData.candidate.email || "");
        setFullName(inviteData.candidate.full_name || "");
      } catch (error) {
        console.error(error);
        setInviteError("Failed to validate invite link.");
      } finally {
        setLoadingInvite(false);
      }
    }

    validateInvite();
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Full name is required.");
      return;
    }

    if (!password) {
      setFormError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/candidate-invites/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          full_name: fullName.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Registration failed.");
        return;
      }

      router.push(data.redirectTo || "/candidate/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setFormError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvite) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Validating invite...</p>
        </div>
      </main>
    );
  }

  if (inviteError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            Invite not available
          </h1>
          <p className="mt-3 text-sm text-red-600">{inviteError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Complete Your Registration
        </h1>

        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Set your password to access your candidate portal.
        </p>

        <div className="mt-5 rounded-lg bg-gray-50 border px-4 py-3 text-sm">
          <p className="text-gray-700">
            <span className="font-medium">Candidate:</span> {candidateName}
          </p>
          <p className="mt-1 text-gray-700">
            <span className="font-medium">Email:</span> {candidateEmail}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              disabled={submitting}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-black"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={submitting}
              autoComplete="new-password"
            />
          </div>

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-black py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </main>
  );
}