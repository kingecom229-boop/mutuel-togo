/** Colonnes SQL partagees par les routes API (aliases camelCase). */

export const LOAN_SELECT = `
  id, user_id AS "userId", amount_fcfa AS "amountFcfa", duration_years AS "durationYears",
  annual_rate_percent AS "annualRatePercent", monthly_payment_fcfa AS "monthlyPaymentFcfa",
  total_interest_fcfa AS "totalInterestFcfa", total_repay_fcfa AS "totalRepayFcfa",
  reason, status, admin_note AS "adminNote", decided_at AS "decidedAt",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export const TRANSFER_SELECT = `
  id, user_id AS "userId", channel, provider,
  destination_name AS "destinationName", destination_number AS "destinationNumber",
  amount_fcfa AS "amountFcfa", status, admin_note AS "adminNote",
  decided_at AS "decidedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

export const TRANSACTION_SELECT = `
  id, user_id AS "userId", reference, type, label,
  amount_fcfa AS "amountFcfa", balance_after_fcfa AS "balanceAfterFcfa",
  loan_request_id AS "LoanRequestId", transfer_request_id AS "TransferRequestId",
  created_at AS "createdAt"`;

export const MESSAGE_SELECT = `
  id, conversation_user_id AS "conversationUserId", sender_id AS "senderId",
  sender_role AS "senderRole", content, attachment_file_id AS "attachmentFileId",
  read_by_user AS "readByUser", read_by_admin AS "readByAdmin", created_at AS "createdAt"`;
