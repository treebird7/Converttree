export type SubscriptionTier = "free" | "pro";

// Base64 expands binary payloads by up to 4/3. Keep a small JSON/protocol
// margin while still bounding parser memory before decoded-size validation.
export const MAX_ENCODED_REQUEST_BYTES = 72 * 1024 * 1024;

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
