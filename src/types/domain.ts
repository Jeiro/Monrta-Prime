export type PlanStatus = "active" | "paused";
export type InvestmentStatus = "Running" | "Completed" | "active" | "completed" | "cancelled";
export type CopyTradeStatus = "Running" | "Completed" | "Cancelled";
export type UserStatus = "active" | "suspended" | "banned";
export type TransactionStatus = "completed" | "pending" | "failed" | "rejected" | "approved";
export type KycStatus = "unverified" | "pending" | "approved" | "rejected";
export type KycDocumentType = "Government ID" | "Passport" | "Driver's License";
export type TicketStatus = "open" | "resolved" | "pending";
export type TicketPriority = "low" | "medium" | "high";
export type TicketCategory = "deposit" | "withdrawal" | "trading" | "general";
export type AuditStatus = "success" | "warning" | "alert";
export type UserRole = "admin" | "user";
export type AssetType = "crypto" | "stock";
export type TradeSide = "buy" | "sell";
export type TransactionType = "deposit" | "withdrawal" | "investment" | "payout" | "adjustment";
export type AirdropStatus = "Live" | "active" | "disabled" | "ended";
export type AirdropClaimStatus = "Pending" | "Approved" | "Rejected";

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: string;
  sparkline: number[];
}

export interface TraderProfile {
  id: string;
  name: string;
  avatar: string;
  active?: boolean;
  featured?: boolean;
  country?: string;
  tradingStyle?: string;
  markets?: string;
  minimumCopyAmount?: number;
  maximumCopyAmount?: number;
  biography?: string;
  displayOrder?: number;
  roi: number;
  winRate: number;
  followers: number;
  maxFollowers: number;
  assetsUnderManagement: string;
  riskScore: number;
  profitDays: number;
  chartData: number[];
}

export interface InvestmentPlan {
  id: string;
  name: string;
  minDeposit: number;
  maxDeposit: number;
  durationDays: number;
  roiPercent: number;
  roiCapPercent?: number;
  description: string;
  status: PlanStatus;
  enabled: boolean;
  displayOrder: number;
  badge?: string;
  accentColor?: string;
}

export interface ActiveInvestment {
  id: string;
  planId: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  roiPercent?: number;
  expectedProfit?: number;
  totalReturn?: number;
  remainingDays?: number;
  accumulatedProfit: number;
  status: InvestmentStatus;
  progress: number;
  dailyRoiPercent?: number;
  completedAt?: string;
  payoutTransactionId?: string;
}
export interface CopyTrade {
  id: string;
  traderId: string;
  traderName: string;
  amountInvested: number;
  roiPercent: number;
  expectedProfit: number;
  totalReturn: number;
  startTimestamp: string;
  endTimestamp: string;
  remainingDays: number;
  status: CopyTradeStatus;
  payoutCompleted: boolean;
  progress: number;
  completedAt?: string;
  payoutTransactionId?: string;
}


export interface PortfolioAsset {
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  type: AssetType;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  routingCode: string;
  accountName: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  userName?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  status: TransactionStatus;
  asset: string;
  relatedReferenceId?: string;
  timestamp?: string;
  date: string;
  address?: string;
  txHash?: string;
  proofFile?: string;
  notes?: string;
  userEmail?: string;
  destinationTag?: string;
  bankDetails?: BankDetails;
  paypalEmail?: string;
}

export interface DepositWallet {
  id: string;
  coinName: string;
  network: string;
  walletAddress: string;
  /**
   * Destination tag / memo for coins that share one custodial address across
   * users and attribute deposits by tag (XRP, XLM, EOS, …). Empty for every
   * coin that does not use one — the deposit UI treats empty as "no tag has
   * been configured" and falls back to telling the user to contact support,
   * so this must never be given a placeholder value.
   */
  destinationTag: string;
  qrCodeUrl: string;
  minimumDeposit: number;
  enabled: boolean;
  displayOrder: number;
  depositInstructions: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SupportTicketMessage {
  sender: "user" | "support";
  text: string;
  time: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  date: string;
  priority: TicketPriority;
  userEmail?: string;
  messages: SupportTicketMessage[];
}

export type AnnouncementPriority = "Normal" | "Important" | "Critical";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned: boolean;
  enabled?: boolean;
  priority?: AnnouncementPriority;
  publishDate?: string;
  expiryDate?: string;
  scheduledDate?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  email: string;
  ip: string;
  status: AuditStatus;
}

export interface KycSubmission {
  idType: string;
  documentType?: KycDocumentType | string;
  idNumber: string;
  dob: string;
  address: string;
  city: string;
  country: string;
  frontImage: string;
  backImage: string;
  proofOfAddressImage?: string;
  submissionDate?: string;
  status: KycStatus;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

export interface SimulatedUser {
  email: string;
  name: string;
  balance: number;
  portfolioValue: number;
  status: UserStatus;
  role?: UserRole;
  kyc?: KycSubmission;
  connectedWalletName?: string;
  activeInvestments: ActiveInvestment[];
  copyTrades: CopyTrade[];
  portfolio: PortfolioAsset[];
  transactions: Transaction[];
  tickets: SupportTicket[];
  loginHistory: Array<{ date: string; ip: string; device: string }>;
  registrationDate?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  accountType?: string;
  country?: string;
  currency?: string;
  readAnnouncementIds?: string[];
}

export interface UserState {
  isLoggedIn: boolean;
  email: string | null;
  name: string | null;
  balance: number;
  portfolioValue: number;
  kyc?: KycSubmission;
  connectedWalletName?: string;
  activeInvestments: ActiveInvestment[];
  copyTrades: CopyTrade[];
  portfolio: PortfolioAsset[];
  transactions: Transaction[];
  tickets: SupportTicket[];
  status?: UserStatus;
  role?: UserRole;
  isAdmin?: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  accountType?: string;
  country?: string;
  currency?: string;
  referralCount?: number;
  points?: number;
  readAnnouncementIds?: string[];
}

export interface SiteContent {
  hero_title: string;
  hero_subtitle: string;
  hero_button: string;
  dashboard_title: string;
  dashboard_description: string;
  investment_title: string;
  investment_description: string;
  footer_text: string;
  announcement_text: string;
  faq_question_1: string;
  faq_answer_1: string;
  faq_question_2: string;
  faq_answer_2: string;
  faq_question_3: string;
  faq_answer_3: string;
}

export interface AppSettings {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  companyAddress: string;
  senderName: string;
  replyToEmail: string;
  tawkPropertyId: string;
  tawkWidgetId: string;
}

export interface Airdrop {
  id: string;
  title: string;
  token: string;
  rewardAmount: string;
  status: AirdropStatus;
  enabled?: boolean;
  claimLimit?: number;
  startDate?: string;
  endDate?: string;
  eligibility?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AirdropClaim {
  id: string;
  userEmail: string;
  userName?: string;
  airdropId: string;
  campaignTitle?: string;
  token: string;
  rewardAmount: string;
  status: AirdropClaimStatus;
  date: string;
  reviewedAt?: string;
  adminNotes?: string;
  payoutTransactionId?: string;
}

export interface WalletFeedback {
  id: string;
  userEmail: string;
  userName: string;
  wallet: string;
  reason: string;
  wouldUse: boolean;
  status: "new" | "reviewed";
  adminNotes?: string;
  createdAt: string;
}
