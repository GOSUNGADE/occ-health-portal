"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { candidatePageStyles, uiStyles } from "@/components/ui/styles";

type Candidate = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  notes: string | null;
  linked_user_id: number | null;
  created_at: string;
  updated_at: string;
};

type ToastState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

export default function EmployerCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
    null
  );
  const [latestInviteLink, setLatestInviteLink] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleClickOutside() {
      setActiveMenuId(null);
    }

    if (activeMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeMenuId]);

  async function parseJsonResponse(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!contentType.includes("application/json")) {
      throw new Error("Unexpected server response");
    }

    return text ? JSON.parse(text) : {};
  }

  async function loadCandidates() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/candidate", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch candidates");
      }

      setCandidates(data.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFullName("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setNotes("");
    setEditingCandidate(null);
    setLatestInviteLink("");
  }

  function openModal() {
    resetForm();
    setActiveMenuId(null);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError("");
    setEditingCandidate(null);
    setLatestInviteLink("");
  }

  function openEditModal(candidate: Candidate) {
    setActiveMenuId(null);
    setEditingCandidate(candidate);
    setLatestInviteLink("");
    setFullName(candidate.full_name);
    setEmail(candidate.email || "");
    setPhone(candidate.phone || "");
    setDateOfBirth(candidate.date_of_birth || "");
    setNotes(candidate.notes || "");
    setError("");
    setShowModal(true);
  }

  function getCandidateStatus(linkedUserId: number | null) {
    return linkedUserId ? "Registered" : "Invited";
  }

  async function handleDeleteCandidate(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this candidate?"
    );

    if (!confirmed) return;

    try {
      setActiveMenuId(null);

      const res = await fetch(`/api/candidate/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete candidate");
      }

      await loadCandidates();

      setToast({
        type: "success",
        message: "Candidate removed",
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  async function handleRegenerateInvite(id: number) {
    try {
      setActiveMenuId(null);
      setError("");

      const res = await fetch(`/api/candidate/${id}/invite`, {
        method: "POST",
        credentials: "include",
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to regenerate invite");
      }

      setEditingCandidate(null);
      setFullName("");
      setEmail("");
      setPhone("");
      setDateOfBirth("");
      setNotes("");

      setLatestInviteLink(data.inviteLink || "");
      setShowModal(true);

      setToast({
        type: "success",
        message: "Invite regenerated",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

      setToast({
        type: "error",
        message,
      });

      console.error("Regenerate invite error:", err);
    }
  }

  async function handleCopyInviteLink() {
    if (!latestInviteLink) return;

    try {
      await navigator.clipboard.writeText(latestInviteLink);
      setToast({
        type: "success",
        message: "Invite link copied",
      });
    } catch {
      setToast({
        type: "error",
        message: "Failed to copy invite link",
      });
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const isEditing = !!editingCandidate;
      const url = isEditing
        ? `/api/candidate/${editingCandidate.id}`
        : "/api/candidate";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          date_of_birth: dateOfBirth || null,
          notes,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(
          data.error ||
            (isEditing
              ? "Failed to update candidate"
              : "Failed to create candidate")
        );
      }

      await loadCandidates();

      if (isEditing) {
        closeModal();
        setToast({
          type: "success",
          message: "Candidate updated successfully",
        });
      } else {
        setLatestInviteLink(data.inviteLink || "");
        setFullName("");
        setEmail("");
        setPhone("");
        setDateOfBirth("");
        setNotes("");
        setEditingCandidate(null);

        setToast({
          type: "success",
          message: "Candidate added successfully",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setToast({
        type: "error",
        message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const candidateCountText = useMemo(() => {
    if (loading) return "Loading...";
    if (candidates.length === 0) return "No candidates";
    if (candidates.length === 1) return "1 candidate";
    return `${candidates.length} candidates`;
  }, [loading, candidates.length]);

  const inviteGenerated = !!latestInviteLink;

  function formatDate(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  }

  return (
    <div style={uiStyles.page}>
      {toast ? (
        <div
          style={{
            ...uiStyles.toast,
            ...(toast.type === "success"
              ? uiStyles.toastSuccess
              : uiStyles.toastError),
          }}
        >
          {toast.message}
        </div>
      ) : null}

      <div style={uiStyles.headerRow}>
        <div>
          <h1 style={uiStyles.title}>Candidates</h1>
          <p style={uiStyles.subtitle}>
            Manage candidates and create bookings when needed.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          style={uiStyles.primaryActionButton}
        >
          + Add Candidate
        </button>
      </div>

      <div style={uiStyles.summaryRow}>
        <div style={uiStyles.summaryCard}>
          <p style={uiStyles.summaryLabel}>Candidates</p>
          <p style={uiStyles.summaryValue}>{candidateCountText}</p>
        </div>
      </div>

      {error && !showModal ? <div style={uiStyles.alertError}>{error}</div> : null}

      <section
        style={{
          ...uiStyles.panel,
          overflow: "visible",
        }}
      >
        {loading ? (
          <div style={uiStyles.skeletonWrap}>
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{
                  ...uiStyles.tableRow,
                  gridTemplateColumns: "2fr 2.2fr 1.4fr 1.4fr 1.2fr 0.9fr",
                }}
              >
                <div style={{ ...uiStyles.skeletonBlock, width: "20%" }} />
                <div style={{ ...uiStyles.skeletonBlock, width: "22%" }} />
                <div style={{ ...uiStyles.skeletonBlock, width: "14%" }} />
                <div style={{ ...uiStyles.skeletonBlock, width: "14%" }} />
                <div style={{ ...uiStyles.skeletonBlock, width: "12%" }} />
                <div style={{ ...uiStyles.skeletonBlock, width: "8%" }} />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div style={uiStyles.emptyState}>
            <div style={uiStyles.emptyIcon}>👤</div>
            <h2 style={uiStyles.emptyTitle}>No candidates yet</h2>
            <p style={uiStyles.emptyText}>
              Add a candidate now, then create a booking later.
            </p>
            <button
              type="button"
              onClick={openModal}
              style={uiStyles.emptyButton}
            >
              Add Candidate
            </button>
          </div>
        ) : (
          <div
            style={{
              ...uiStyles.tableWrap,
              overflow: "visible",
            }}
          >
            <div
              style={{
                ...uiStyles.tableHeader,
                gridTemplateColumns: "2fr 2.2fr 1.4fr 1.4fr 1.2fr 0.9fr",
              }}
            >
              <div>Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Date of Birth</div>
              <div>Status</div>
              <div style={{ textAlign: "right", paddingRight: 8 }}>Actions</div>
            </div>

            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                style={{
                  ...uiStyles.tableRow,
                  gridTemplateColumns: "2fr 2.2fr 1.4fr 1.4fr 1.2fr 0.9fr",
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={uiStyles.rowTitle}>{candidate.full_name}</div>
                  <div style={uiStyles.rowSub}>
                    Added {formatDate(candidate.created_at)}
                  </div>
                  {candidate.notes ? (
                    <div style={candidatePageStyles.notesText}>
                      {candidate.notes}
                    </div>
                  ) : null}
                </div>

                <div style={uiStyles.cellMuted}>{candidate.email || "-"}</div>
                <div style={uiStyles.cellMuted}>{candidate.phone || "-"}</div>
                <div style={uiStyles.cellMuted}>
                  {formatDate(candidate.date_of_birth)}
                </div>

                <div>
                  <span
                    style={{
                      ...uiStyles.statusBadge,
                      ...(candidate.linked_user_id
                        ? uiStyles.statusGreen
                        : uiStyles.statusBlue),
                    }}
                  >
                    {getCandidateStatus(candidate.linked_user_id)}
                  </span>
                </div>

                <div
                  style={{
                    ...uiStyles.actionCell,
                    position: "relative",
                    overflow: "visible",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "flex-start",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(
                        activeMenuId === candidate.id ? null : candidate.id
                      );
                    }}
                    style={uiStyles.menuButton}
                  >
                    ⋯
                  </button>

                  {activeMenuId === candidate.id ? (
                    <div
                      style={{
                        ...uiStyles.menuPopover,
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        left: "auto",
                        minWidth: 170,
                        zIndex: 1000,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openEditModal(candidate)}
                        style={uiStyles.menuItem}
                      >
                        Edit
                      </button>

                      {!candidate.linked_user_id && (
                        <button
                          type="button"
                          onClick={() => handleRegenerateInvite(candidate.id)}
                          style={uiStyles.menuItem}
                        >
                          Regenerate Invite
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteCandidate(candidate.id)}
                        style={{
                          ...uiStyles.menuItem,
                          ...uiStyles.menuItemDanger,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal ? (
        <div style={uiStyles.modalBackdrop}>
          <div style={uiStyles.modalCard}>
            <div style={uiStyles.modalHeader}>
              <div>
                <h2 style={uiStyles.modalTitle}>
                  {editingCandidate ? "Edit Candidate" : "Add Candidate"}
                </h2>
                <p style={uiStyles.modalSubtitle}>
                  {editingCandidate
                    ? "Update candidate information."
                    : "Create a new candidate and generate an invite link."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={uiStyles.closeBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={uiStyles.form}>
              <div style={uiStyles.formGroup}>
                <label htmlFor="full_name" style={uiStyles.label}>
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  disabled={submitting || inviteGenerated}
                  style={uiStyles.input}
                />
              </div>

              <div style={uiStyles.formGroup}>
                <label htmlFor="email" style={uiStyles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required={!editingCandidate}
                  disabled={submitting || inviteGenerated}
                  style={uiStyles.input}
                />
              </div>

              <div style={uiStyles.formGrid}>
                <div style={uiStyles.formGroup}>
                  <label htmlFor="phone" style={uiStyles.label}>
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone"
                    disabled={submitting || inviteGenerated}
                    style={uiStyles.input}
                  />
                </div>

                <div style={uiStyles.formGroup}>
                  <label htmlFor="date_of_birth" style={uiStyles.label}>
                    Date of Birth
                  </label>
                  <input
                    id="date_of_birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={submitting || inviteGenerated}
                    style={uiStyles.input}
                  />
                </div>
              </div>

              <div style={uiStyles.formGroup}>
                <label htmlFor="notes" style={uiStyles.label}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  rows={4}
                  disabled={submitting || inviteGenerated}
                  style={uiStyles.textarea}
                />
              </div>

              {error ? <div style={uiStyles.alertError}>{error}</div> : null}

              {latestInviteLink && !editingCandidate ? (
                <div style={candidatePageStyles.inviteBox}>
                  <p style={candidatePageStyles.inviteTitle}>
                    Invite link generated
                  </p>
                  <p style={candidatePageStyles.inviteText}>
                    Copy this link and send it to the candidate for now.
                  </p>

                  <div style={candidatePageStyles.inviteLinkRow}>
                    <input
                      type="text"
                      readOnly
                      value={latestInviteLink}
                      style={candidatePageStyles.inviteInput}
                    />

                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      style={candidatePageStyles.copyButton}
                    >
                      Copy
                    </button>
                  </div>

                  <a
                    href={latestInviteLink}
                    target="_blank"
                    rel="noreferrer"
                    style={candidatePageStyles.openInviteLink}
                  >
                    Open invite link
                  </a>
                </div>
              ) : null}

              <div style={uiStyles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={uiStyles.secondaryActionButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || inviteGenerated}
                  style={{
                    ...uiStyles.primaryActionButton,
                    ...(submitting || inviteGenerated
                      ? uiStyles.primaryActionButtonDisabled
                      : {}),
                  }}
                >
                  {submitting
                    ? editingCandidate
                      ? "Saving changes..."
                      : "Saving..."
                    : inviteGenerated
                      ? "Invite Generated"
                      : editingCandidate
                        ? "Save Changes"
                        : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}