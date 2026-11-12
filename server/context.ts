import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { SubscriptionTier } from "../shared/entitlements.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  subscriptionTier: SubscriptionTier;
};

/**
 * Decide which entitlement tier a request gets.
 *
 * ConvertTree has no accounts and no billing integration, so there is no
 * identity to look a subscription up against: every request is on the free
 * tier. Pro-only features (batch, high quality, PDF→ZIP of page images) are
 * therefore refused by the server for everyone.
 *
 * OWNER DECISION PENDING: how a request proves Pro (store receipt, account,
 * licence key...). Wire it in here and nowhere else; the routers and the
 * client already read the tier from this one place.
 */
export function resolveSubscriptionTier(_req: CreateExpressContextOptions["req"]): SubscriptionTier {
  return "free";
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    subscriptionTier: resolveSubscriptionTier(opts.req),
  };
}
