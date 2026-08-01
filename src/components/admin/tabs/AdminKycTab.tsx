import React, { useMemo, useState } from "react";
import { useAdminUsers } from "../../../context/domains/AdminUsersContext";
import { useKyc } from "../../../context/domains/KycContext";
import { Check, ExternalLink, FileText, Search, UserCheck, X } from "lucide-react";
import type { KycSubmission, KycStatus } from "../../../types";
import type { CoreUserProfile } from "../../../hooks/data/useUsersDirectory";
import { formatDateTime } from "../../../lib/format";
import {
  Alert,
  Badge,
  Button,
  Column,
  DataTable,
  Drawer,
  Input,
  SectionCard,
  Tabs,
  Textarea,
} from "../../ui";
import { AdminTabHeader, AdminTabShell } from "../AdminTabShell";

type KycRow = CoreUserProfile & { kyc?: KycSubmission; kycStatus: KycStatus };

const statusTone: Record<KycStatus, "warning" | "positive" | "negative" | "neutral"> = {
  pending: "warning",
  approved: "positive",
  rejected: "negative",
  unverified: "neutral",
};

const whenOr = (value: string | undefined, fallback: string) =>
  value ? formatDateTime(value) : fallback;

const getDocumentCount = (kyc?: KycSubmission) =>
  [kyc?.frontImage, kyc?.backImage, kyc?.proofOfAddressImage].filter(Boolean).length;

export const AdminKycTab: React.FC = () => {
  const { usersDirectory } = useAdminUsers();
  const { allKycSubmissions, adminKycReview } = useKyc();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | KycStatus>("all");
  const [reviewingEmail, setReviewingEmail] = useState<string | null>(null);
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const rows = useMemo<KycRow[]>(
    () =>
      usersDirectory.map((user) => {
        const kyc = allKycSubmissions[user.email];
        return { ...user, kyc, kycStatus: kyc?.status || "unverified" };
      }),
    [usersDirectory, allKycSubmissions]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows
      .filter((user) => {
        const matchesStatus = filterStatus === "all" || user.kycStatus === filterStatus;
        if (!query) return matchesStatus;
        const searchable = [
          user.name,
          user.email,
          user.kyc?.documentType || user.kyc?.idType || "",
          user.kyc?.idNumber || "",
          user.kyc?.country || "",
          user.kyc?.adminNotes || user.kyc?.rejectionReason || "",
        ]
          .join(" ")
          .toLowerCase();
        return matchesStatus && searchable.includes(query);
      })
      .sort((a, b) => {
        if (a.kycStatus === "pending" && b.kycStatus !== "pending") return -1;
        if (b.kycStatus === "pending" && a.kycStatus !== "pending") return 1;
        return (
          Date.parse(b.kyc?.submissionDate || "0") - Date.parse(a.kyc?.submissionDate || "0")
        );
      });
  }, [rows, filterStatus, searchQuery]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((u) => u.kycStatus === "pending").length,
      approved: rows.filter((u) => u.kycStatus === "approved").length,
      rejected: rows.filter((u) => u.kycStatus === "rejected").length,
    }),
    [rows]
  );

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const approve = async (user: KycRow) => {
    const note = adminNotes[user.email] || "Verified by admin.";
    setReviewingEmail(user.email);
    try {
      await adminKycReview(user.email, "approved", note);
      showFeedback(`KYC approved for ${user.email}`);
      setOpenEmail(null);
    } catch {
      showFeedback(`Unable to approve KYC for ${user.email}`);
    } finally {
      setReviewingEmail(null);
    }
  };

  const reject = async (user: KycRow) => {
    const reason = adminNotes[user.email] || "Documents not sufficient.";
    setReviewingEmail(user.email);
    try {
      await adminKycReview(user.email, "rejected", reason);
      showFeedback(`KYC rejected for ${user.email}`);
      setOpenEmail(null);
    } catch {
      showFeedback(`Unable to reject KYC for ${user.email}`);
    } finally {
      setReviewingEmail(null);
    }
  };

  const open = filtered.find((u) => u.email === openEmail) || null;
  const isReviewing = reviewingEmail === open?.email;

  const columns: Column<KycRow>[] = [
    {
      key: "user",
      header: "User",
      primary: true,
      cell: (u) => (
        <div className="min-w-0">
          <span className="block truncate font-medium text-ink">{u.name || "—"}</span>
          <span className="block truncate text-2xs text-muted">{u.email}</span>
        </div>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (u) => (
        <span className="whitespace-nowrap text-muted">
          {whenOr(u.kyc?.submissionDate, "Not submitted")}
        </span>
      ),
    },
    {
      key: "document",
      header: "Document",
      cell: (u) => u.kyc?.documentType || u.kyc?.idType || <span className="text-faint">—</span>,
    },
    {
      key: "docs",
      header: "Files",
      numeric: true,
      cell: (u) => getDocumentCount(u.kyc),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => <Badge tone={statusTone[u.kycStatus]}>{u.kycStatus}</Badge>,
    },
    {
      key: "review",
      header: "",
      align: "right",
      cell: (u) => (
        <span className="whitespace-nowrap text-2xs font-semibold text-accent">
          {u.kycStatus === "pending" ? "Review →" : "View →"}
        </span>
      ),
    },
  ];

  return (
    <AdminTabShell>
      <AdminTabHeader
        icon={UserCheck}
        title="Identity verification"
        description="Review identity documents and proof of address before approving an account."
        stats={[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending, tone: "warning" },
          { label: "Approved", value: stats.approved, tone: "positive" },
          { label: "Rejected", value: stats.rejected, tone: "negative" },
        ]}
      />

      {feedback && <Alert tone="success">{feedback}</Alert>}

      <SectionCard
        flush
        icon={UserCheck}
        title="Verification queue"
        action={
          <span className="text-2xs tabular-nums text-faint">
            {filtered.length} of {rows.length}
          </span>
        }
      >
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <Input
            className="lg:w-80"
            aria-label="Search verifications"
            placeholder="Search by name, email, document…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            prefix={<Search size={14} />}
          />
          <Tabs<"all" | KycStatus>
            variant="pill"
            layoutGroup="kyc-status"
            aria-label="Filter by status"
            value={filterStatus}
            onChange={setFilterStatus}
            items={[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending", badge: stats.pending || undefined },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
              { id: "unverified", label: "Unverified" },
            ]}
          />
        </div>

        <div className="p-3 sm:p-0">
          <DataTable
            caption="Identity verification queue"
            columns={columns}
            rows={filtered}
            rowKey={(u) => u.email}
            onRowClick={(u) => setOpenEmail(u.email)}
            className="sm:[&>div]:rounded-none sm:[&>div]:border-0"
            empty={{
              icon: UserCheck,
              title: "No verifications match this view",
              description: "Submitted identity documents will appear here for review.",
            }}
          />
        </div>
      </SectionCard>

      {/*
        Documents, notes and the decision all move into the drawer.

        The queue previously carried a 250px notes <input> and two action
        buttons as columns, forcing min-w-[1180px] and a horizontal scroller,
        and expanded document details into a colSpan={7} row underneath. The
        notes input also rendered on every row including already-reviewed
        ones, where typing in it did nothing because the actions were hidden.
      */}
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenEmail(null)}
        title={open ? open.name || open.email : ""}
        footer={
          open?.kycStatus === "pending" ? (
            <div className="flex gap-2">
              <Button
                block
                variant="positive"
                icon={Check}
                loading={isReviewing}
                onClick={() => open && approve(open)}
              >
                Approve
              </Button>
              <Button
                block
                variant="danger"
                icon={X}
                loading={isReviewing}
                onClick={() => open && reject(open)}
              >
                Reject
              </Button>
            </div>
          ) : (
            <p className="text-center text-2xs uppercase tracking-[0.09em] text-faint">
              {open?.kycStatus === "unverified" ? "Nothing submitted" : "Already reviewed"}
            </p>
          )
        }
      >
        {open && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Badge tone={statusTone[open.kycStatus]}>{open.kycStatus}</Badge>
              <span className="truncate text-xs text-muted">{open.email}</span>
            </div>

            {!open.kyc ? (
              <Alert tone="info">This user has not submitted identity documents yet.</Alert>
            ) : (
              <>
                <dl className="space-y-3">
                  {[
                    {
                      label: "Document type",
                      value: open.kyc.documentType || open.kyc.idType || "—",
                    },
                    { label: "Document number", value: open.kyc.idNumber || "Not captured" },
                    { label: "Date of birth", value: open.kyc.dob || "Not captured" },
                    { label: "Country", value: open.kyc.country || "Not captured" },
                    {
                      label: "Address",
                      value:
                        [open.kyc.address, open.kyc.city].filter(Boolean).join(", ") ||
                        "Not captured",
                    },
                    {
                      label: "Submitted",
                      value: whenOr(open.kyc.submissionDate, "Not submitted"),
                    },
                    { label: "Reviewed", value: whenOr(open.kyc.reviewedAt, "Not yet reviewed") },
                  ].map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                        {row.label}
                      </dt>
                      <dd className="text-right text-sm break-words text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="space-y-2">
                  <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                    Documents
                  </p>
                  {[
                    { title: "Primary document", url: open.kyc.frontImage },
                    { title: "Back of document", url: open.kyc.backImage },
                    { title: "Proof of address", url: open.kyc.proofOfAddressImage, optional: true },
                  ].map((doc) => (
                    <div key={doc.title}>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 rounded-lg border border-line bg-panel p-3 text-xs text-accent transition-colors duration-[--duration-fast] hover:border-accent-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <span className="flex items-center gap-2">
                            <FileText size={14} /> {doc.title}
                          </span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel p-3 text-xs text-faint">
                          <FileText size={14} /> {doc.title} —{" "}
                          {doc.optional ? "not provided" : "missing"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {open.kycStatus === "pending" ? (
                  <Textarea
                    label="Approval note or rejection reason"
                    rows={3}
                    placeholder="Recorded against this decision and shown to the user"
                    value={adminNotes[open.email] ?? ""}
                    onChange={(event) =>
                      setAdminNotes((prev) => ({ ...prev, [open.email]: event.target.value }))
                    }
                  />
                ) : (
                  <div className="rounded-lg border border-line bg-panel p-3">
                    <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                      Review notes
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {open.kyc.adminNotes || open.kyc.rejectionReason || "No notes recorded"}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Drawer>
    </AdminTabShell>
  );
};
