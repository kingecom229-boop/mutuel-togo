/** Types partagés par les écrans (miroir des réponses API). */

export interface ApiUser {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: string;
  balanceFcfa: number;
  createdAt: string;
}

export interface WalletInfo {
  balanceFcfa: number;
  pendingTransfersFcfa: number;
  hasApprovedLoan: boolean;
  bonusLockedFcfa: number;
  availableFcfa: number;
}

export interface ApiTransaction {
  id: string;
  reference: string;
  type: string;
  label: string;
  amountFcfa: number;
  balanceAfterFcfa: number;
  createdAt: string;
}

export interface ApiLoan {
  id: string;
  userId: string;
  amountFcfa: number;
  durationYears: number;
  annualRatePercent: number;
  monthlyPaymentFcfa: number;
  totalInterestFcfa: number;
  totalRepayFcfa: number;
  reason: string;
  status: string;
  adminNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  clientName?: string;
  clientPhone?: string;
  profilePercent?: number;
  profileStatus?: string;
}

export interface ApiTransfer {
  id: string;
  userId: string;
  channel: string;
  provider: string | null;
  destinationName: string;
  destinationNumber: string;
  amountFcfa: number;
  status: string;
  adminNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  clientName?: string;
  clientPhone?: string;
  clientBalanceFcfa?: number;
}

export interface ApiMessage {
  id: string;
  conversationUserId: string;
  senderId: string;
  senderRole: string;
  content: string;
  attachmentFileId: string | null;
  readByUser: boolean;
  readByAdmin: boolean;
  createdAt: string;
}

export interface ApiProfile {
  id: string;
  userId: string;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  profession: string | null;
  monthlyIncomeFcfa: number | null;
  portraitFileId: string | null;
  cniFrontFileId: string | null;
  cniBackFileId: string | null;
  witnessName: string | null;
  witnessRelation: string | null;
  witnessPhone: string | null;
  completionPercent: number;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
