export interface FashnCredits { total: number; subscription: number; onDemand: number; }

export interface AdminEvent {
  id: string;
  type: "job_created" | "job_completed" | "job_failed" | "user_action" | "system"
      | "payment_created" | "payment_updated";
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface DayStats {
  total: number; job_created: number; job_completed: number; job_failed: number;
}

export interface Transaction {
  id: string;
  amount: number;
  status: "pending" | "success" | "failed" | "cancelled" | "refunded";
  provider: string;
  provider_transaction_id: string | null;
  payment_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  user: { id: string; email: string; name: string | null; avatar_url: string | null; current_credit: number } | null;
  package: { name: string; credit_amount: number; bonus_credit: number } | null;
}

export interface TxStats {
  totalRevenue: number; successCount: number; pendingCount: number; failedCount: number;
}

export interface UserDetail {
  id: string; email: string; name: string | null; avatar_url: string | null;
  role: string; status: string; plan_type: string; current_credit: number;
  created_at: string; last_login_at: string | null;
}

export interface JobDetail {
  id: string; type: string; status: string; credit_cost: number;
  input_params: Record<string, any>; error_message: string | null;
  created_at: string; completed_at: string | null; provider: string;
}

export type Tab = "jobs" | "payments";
