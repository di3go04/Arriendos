export interface DashboardMetrics {
  roi: number;
  cashflowMonth: number;
  cashflowYear: number;
  delinquencyRate: number;
  occupancyRate: number;
  mrr: number;
  arr: number;
  collectionEfficiency: number;
  activeContracts: number;
  totalProperties: number;
  totalTenants: number;
  pendingMaintenance: number;
  avgMonthlyIncome: number;
  projectedAnnualIncome: number;
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface AlertEvent {
  id: string;
  userId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  read: boolean;
  createdAt: string;
}

export interface IDashboardAlertsService {
  getMetrics(userId: string): Promise<DashboardMetrics>;
  evaluateAlerts(userId: string): Promise<AlertEvent[]>;
  getActiveAlerts(userId: string): Promise<AlertEvent[]>;
  markAlertRead(alertId: string, userId: string): Promise<void>;
  sendAlertNotification(alert: AlertEvent): Promise<void>;
}
