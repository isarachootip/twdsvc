export interface INotificationProvider {
  sendJobOpened(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    productName: string;
    trackingUrl: string;
  }): Promise<{ success: boolean; messageId: string }>;

  sendQuote(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    quoteNo: string;
    totalAmountSatang: number;
    quoteUrl: string;
  }): Promise<{ success: boolean; messageId: string }>;

  sendReadyForPickup(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    branchName: string;
    balanceSatang?: number;
    paymentUrl?: string;
  }): Promise<{ success: boolean; messageId: string }>;

  sendCsatSurvey(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    surveyUrl: string;
  }): Promise<{ success: boolean; messageId: string }>;

  sendSlaBreachAlert(payload: {
    jobNo: string;
    stepName: string;
    ownerDept: string;
    hoursInStep: number;
    slaHours: number;
  }): Promise<{ success: boolean; messageId: string }>;
}
