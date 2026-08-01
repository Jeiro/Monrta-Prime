import React, { useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "../context/domains/SessionContext";
import { useKyc } from "../context/domains/KycContext";
import { AlertTriangle, CheckCircle2, Clock, Shield, XCircle } from "lucide-react";
import { KYC_DOCUMENT_TYPES } from "../services";
import type { KycSubmission } from "../types";
import { Alert, Badge, Button, Input, SectionCard, Select } from "../components/ui";
import { formatDateTime } from "../lib/format";

const emptyKyc: KycSubmission = {
  status: "unverified",
  idType: "Government ID",
  documentType: "Government ID",
  idNumber: "",
  dob: "",
  address: "",
  city: "",
  country: "",
  frontImage: "",
  backImage: "",
};

/** "Not submitted" rather than an em dash — this is a state, not a gap. */
const whenOr = (value: string | undefined, fallback: string) =>
  value ? formatDateTime(value) : fallback;

const StatusIcon: React.FC<{ status: KycSubmission["status"] }> = ({ status }) => {
  if (status === "approved") return <CheckCircle2 size={11} />;
  if (status === "pending") return <Clock size={11} />;
  if (status === "rejected") return <XCircle size={11} />;
  return <AlertTriangle size={11} />;
};

const statusTone = (status: KycSubmission["status"]) =>
  status === "approved"
    ? "positive"
    : status === "pending"
      ? "warning"
      : status === "rejected"
        ? "negative"
        : "neutral";

export const DashboardKYC: React.FC = () => {
  const { user } = useSession();
  const { submitKyc } = useKyc();
  const currentKyc = user.kyc || emptyKyc;
  const [documentType, setDocumentType] = useState(
    currentKyc.documentType || currentKyc.idType || "Government ID"
  );
  const [idNumber, setIdNumber] = useState(
    currentKyc.status === "rejected" ? currentKyc.idNumber || "" : ""
  );
  const [dob, setDob] = useState(currentKyc.status === "rejected" ? currentKyc.dob || "" : "");
  const [address, setAddress] = useState(
    currentKyc.status === "rejected" ? currentKyc.address || "" : ""
  );
  const [city, setCity] = useState(currentKyc.status === "rejected" ? currentKyc.city || "" : "");
  const [country, setCountry] = useState(
    currentKyc.status === "rejected" ? currentKyc.country || "" : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = currentKyc.status === "unverified" || currentKyc.status === "rejected";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    setIsSubmitting(true);
    try {
      await submitKyc({
        idType: documentType,
        documentType,
        idNumber,
        dob,
        address,
        city,
        country,
        frontImage: "",
        backImage: "",
        proofOfAddressImage: "",
        status: "pending",
      });
      toast.success("Verification submitted successfully");
    } catch (err) {
      console.error("Error submitting KYC:", err);
      setSubmitError("Failed to submit verification. Please check your connection and try again.");
      toast.error("Failed to submit verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-4 sm:pb-6">
      <header className="border-b border-line pb-5">
        <div className="flex items-center gap-2.5">
          <Shield size={20} className="shrink-0 text-faint" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Identity verification</h1>
        </div>
        <p className="mt-1 text-xs text-muted">
          Verification unlocks withdrawals and higher account limits.
        </p>
      </header>

      <SectionCard
        title="Status"
        action={
          <Badge tone={statusTone(currentKyc.status)}>
            <StatusIcon status={currentKyc.status} />
            {currentKyc.status}
          </Badge>
        }
      >
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Document type",
              value: currentKyc.documentType || currentKyc.idType || "Not submitted",
            },
            { label: "Submitted", value: whenOr(currentKyc.submissionDate, "Not submitted") },
            { label: "Reviewed", value: whenOr(currentKyc.reviewedAt, "Not yet reviewed") },
          ].map((cell) => (
            <div key={cell.label} className="rounded-lg border border-line bg-panel p-3">
              <dt className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                {cell.label}
              </dt>
              <dd className="mt-1 break-words text-sm text-ink">{cell.value}</dd>
            </div>
          ))}
        </dl>

        {(currentKyc.adminNotes || currentKyc.rejectionReason) && (
          <div className="mt-3 rounded-lg border border-line bg-panel p-3">
            <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              Review notes
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {currentKyc.adminNotes || currentKyc.rejectionReason}
            </p>
          </div>
        )}

        {currentKyc.status === "approved" && (
          <Alert tone="success" className="mt-4">
            Your identity is verified. Withdrawals and verified-account features are enabled.
          </Alert>
        )}

        {currentKyc.status === "pending" && (
          <Alert tone="warning" className="mt-4">
            Your documents are under review. We'll email you when there's an update.
          </Alert>
        )}
      </SectionCard>

      {canSubmit && (
        <SectionCard title={currentKyc.status === "rejected" ? "Resubmit" : "Submit your details"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentKyc.status === "rejected" && (
              <Alert tone="error" title="Previous submission was rejected">
                {currentKyc.rejectionReason ||
                  currentKyc.adminNotes ||
                  "Please resubmit clearer documents."}
              </Alert>
            )}

            {/* Every field now carries a real <label>. These were
                placeholder-only, and a placeholder disappears the moment you
                type — so anyone reviewing what they entered, using a screen
                reader, or returning to a half-filled form had no field names
                at all. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Document type"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              >
                {KYC_DOCUMENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </Select>
              <Input
                label="Document number"
                required
                value={idNumber}
                onChange={(event) => setIdNumber(event.target.value)}
                placeholder="As printed on the document"
              />
              <Input
                label="Date of birth"
                type="date"
                required
                value={dob}
                onChange={(event) => setDob(event.target.value)}
              />
              <Input
                label="Residential address"
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street and number"
              />
              <Input
                label="City"
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
              <Input
                label="Country"
                required
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
            </div>

            <Alert tone="info" title="What happens next">
              Our verification team reviews your details after submission. If anything further is
              needed we'll contact you at your registered email address.
            </Alert>

            {submitError && <Alert tone="error">{submitError}</Alert>}

            <Button type="submit" block size="lg" loading={isSubmitting}>
              {currentKyc.status === "rejected" ? "Resubmit verification" : "Submit verification"}
            </Button>
          </form>
        </SectionCard>
      )}
    </div>
  );
};
