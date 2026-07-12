export type SubscriptionTier = "free" | "pro";

export type ConversionEntitlementRequest = {
  isBatch?: boolean;
  outputFormat?: string;
  highQuality?: boolean;
};

export const ENTITLEMENT_MATRIX = {
  free: {
    maxFileBytes: 10 * 1024 * 1024,
    conversionsPerHour: 10,
    batchConversion: false,
    highQualityOutput: false,
    multiPageImageOutput: false,
  },
  pro: {
    maxFileBytes: 50 * 1024 * 1024,
    conversionsPerHour: Infinity,
    batchConversion: true,
    highQualityOutput: true,
    multiPageImageOutput: true,
  },
} as const satisfies Record<SubscriptionTier, object>;

export function requiresPro(request: ConversionEntitlementRequest): boolean {
  return Boolean(request.isBatch || request.highQuality || request.outputFormat === "zip");
}

export function entitlementFor(tier: SubscriptionTier) {
  return ENTITLEMENT_MATRIX[tier];
}
