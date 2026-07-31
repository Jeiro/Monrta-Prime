import React, { useState } from "react";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import { Shield, CheckCircle2, AlertTriangle, Clock, XCircle, Loader2, Info as InfoIcon } from "lucide-react";
import { KYC_DOCUMENT_TYPES } from "../services";
import type { KycSubmission } from "../types";

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
  backImage: ""
};

const formatDate = (value?: string) => {
  if (!value) return "Not submitted";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(parsed));
};



const StatusIcon: React.FC<{ status: KycSubmission["status"] }> = ({ status }) => {
  if (status === "approved") return <CheckCircle2 size={14} />;
  if (status === "pending") return <Clock size={14} />;
  if (status === "rejected") return <XCircle size={14} />;
  return <AlertTriangle size={14} />;
};

export const DashboardKYC: React.FC = () => {
  const { user, submitKyc } = useApp();
  const currentKyc = user.kyc || emptyKyc;
  const [documentType, setDocumentType] = useState(currentKyc.documentType || currentKyc.idType || "Government ID");
  const [idNumber, setIdNumber] = useState(currentKyc.status === "rejected" ? currentKyc.idNumber || "" : "");
  const [dob, setDob] = useState(currentKyc.status === "rejected" ? currentKyc.dob || "" : "");
  const [address, setAddress] = useState(currentKyc.status === "rejected" ? currentKyc.address || "" : "");
  const [city, setCity] = useState(currentKyc.status === "rejected" ? currentKyc.city || "" : "");
  const [country, setCountry] = useState(currentKyc.status === "rejected" ? currentKyc.country || "" : "");
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
        status: "pending"
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
    <div className="space-y-4 pb-4 sm:pb-6">
      <div className="flex items-center gap-3 border-b border-line/50 pb-6">
        <Shield size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-ink">Identity Verification</h1>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Current KYC Status</h2>
            <p className="text-xs text-muted mt-1">Submission date: {formatDate(currentKyc.submissionDate)}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border w-fit ${
            currentKyc.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
            currentKyc.status === "pending" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" :
            currentKyc.status === "rejected" ? "bg-negative/10 text-negative border-negative/30" :
            "bg-line/40 text-muted border-line"
          }`}>
            <StatusIcon status={currentKyc.status} /> {currentKyc.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <Info label="Document Type" value={currentKyc.documentType || currentKyc.idType || "Not submitted"} />
          <Info label="Reviewed" value={formatDate(currentKyc.reviewedAt)} />
          <Info label="Review Notes" value={currentKyc.adminNotes || currentKyc.rejectionReason || "No notes yet"} />
        </div>

        {currentKyc.status === "approved" && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
            Your identity profile is verified. Withdrawal access and verified-account features are enabled.
          </div>
        )}

        {currentKyc.status === "pending" && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-300">
            Your documents are under platform review. You can monitor the status here.
          </div>
        )}

        {canSubmit && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-line pt-5">
            {currentKyc.status === "rejected" && (
              <div className="p-4 bg-negative/10 border border-negative/20 text-negative text-xs rounded-lg">
                <strong>Rejection Reason:</strong> {currentKyc.rejectionReason || currentKyc.adminNotes || "Please resubmit clearer documents."}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="bg-ground border border-line rounded-lg p-2.5 text-xs text-ink">
                {KYC_DOCUMENT_TYPES.map(type => <option key={type}>{type}</option>)}
              </select>
              <input required type="text" placeholder="Document Number" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} className="bg-ground border border-line rounded-lg p-2.5 text-xs text-ink" />
              <input required type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="bg-ground border border-line rounded-lg p-2.5 text-xs text-ink" />
              <input required type="text" placeholder="Residential Address" value={address} onChange={(event) => setAddress(event.target.value)} className="bg-ground border border-line rounded-lg p-2.5 text-xs text-ink" />
              <input required type="text" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} className="bg-ground border border-line rounded-lg p-2.5 text-xs text-ink" />
              <input required type="text" placeholder="Country" value={country} onChange={(event) => setCountry(event.target.value)} className="bg-ground border border-line rounded-lg p-2.5 text-xs text-ink" />
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex gap-3 items-start">
              <InfoIcon className="text-accent shrink-0 mt-0.5" size={18} />
              <div className="text-sm">
                <h4 className="font-bold text-accent mb-1">Verification Notice</h4>
                <p className="text-ink/80 leading-relaxed text-xs">
                  Our Verification Team will review your information after submission. If additional documentation is required, we'll contact you directly via your registered email address.
                </p>
              </div>
            </div>

            {submitError && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">{submitError}</div>}

            <button type="submit" disabled={isSubmitting} className="w-full bg-accent text-ground font-bold p-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Submitting..." : currentKyc.status === "rejected" ? "Resubmit Verification" : "Submit Verification"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-ground border border-line rounded-xl p-3">
    <p className="text-[10px] uppercase tracking-wider text-muted font-bold">{label}</p>
    <p className="mt-1 text-ink font-bold break-words">{value}</p>
  </div>
);

