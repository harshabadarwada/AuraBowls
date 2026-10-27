import { allocatePaise } from "./money";

export type PricingDelivery = {
  date: string;
  label: string;
  foodPaise: number;
  referenceFoodPaise: number;
  addonPaise: number;
  feePaise: number;
};

export type PricingCoupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderPaise: number;
  stackable: boolean;
};

export type PricingInput = {
  deliveries: PricingDelivery[];
  planDiscountBps: number;
  coupon: PricingCoupon | null;
  taxMode: "none" | "exclusive" | "inclusive";
  taxRateBps: number;
  taxLabel: string;
  bundleDiscountPaise?: number;
};

export type DeliveryAllocation = {
  date: string;
  label: string;
  foodPaise: number;
  addonPaise: number;
  feePaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
};

export type PricingSuccess = {
  ok: true;
  referenceFoodPaise: number;
  foodPaise: number;
  customizationDeltaPaise: number;
  addonPaise: number;
  deliveryFeePaise: number;
  deliveryCount: number;
  planDiscountPaise: number;
  couponPaise: number;
  couponCode: string;
  bundleDiscountPaise: number;
  preTaxPaise: number;
  taxPaise: number;
  totalPaise: number;
  taxMode: PricingInput["taxMode"];
  taxRateBps: number;
  taxLabel: string;
  allocations: DeliveryAllocation[];
};

export type PricingFailure = { ok: false; code: string; message: string };
export type PricingResult = PricingSuccess | PricingFailure;

function roundBps(amount: number, bps: number): number {
  return Math.round((amount * bps) / 10_000);
}

export function priceOrder(input: PricingInput): PricingResult {
  if (input.deliveries.length === 0) {
    return { ok: false, code: "empty_order", message: "Choose at least one delivery." };
  }
  for (const delivery of input.deliveries) {
    if (delivery.foodPaise < 0 || delivery.addonPaise < 0 || delivery.feePaise < 0 || delivery.referenceFoodPaise < 0) {
      return { ok: false, code: "invalid_amount", message: "A price in this order is invalid." };
    }
  }

  const foodPaise = input.deliveries.reduce((sum, delivery) => sum + delivery.foodPaise, 0);
  const referenceFoodPaise = input.deliveries.reduce((sum, delivery) => sum + delivery.referenceFoodPaise, 0);
  const addonPaise = input.deliveries.reduce((sum, delivery) => sum + delivery.addonPaise, 0);
  const deliveryFeePaise = input.deliveries.reduce((sum, delivery) => sum + delivery.feePaise, 0);
  const customizationDeltaPaise = foodPaise - referenceFoodPaise;
  const rawPlanDiscount = roundBps(referenceFoodPaise, Math.max(0, input.planDiscountBps));
  const planDiscountPaise = Math.min(rawPlanDiscount, foodPaise);
  const merchandiseAndFees = foodPaise + addonPaise + deliveryFeePaise - planDiscountPaise;

  if (merchandiseAndFees < 0) {
    return { ok: false, code: "negative_total", message: "This combination cannot be priced below zero." };
  }

  let couponPaise = 0;
  let couponCode = "";
  if (input.coupon) {
    if (!input.coupon.stackable && planDiscountPaise > 0) {
      return {
        ok: false,
        code: "coupon_not_stackable",
        message: "This coupon cannot be combined with the plan discount.",
      };
    }
    if (merchandiseAndFees < input.coupon.minOrderPaise) {
      return {
        ok: false,
        code: "coupon_minimum",
        message: "This coupon needs a higher order total.",
      };
    }
    couponPaise =
      input.coupon.type === "percent" ? roundBps(merchandiseAndFees, input.coupon.value) : input.coupon.value;
    if (couponPaise > merchandiseAndFees) {
      return { ok: false, code: "coupon_too_large", message: "This coupon is larger than the payable amount." };
    }
    if (couponPaise < 0) {
      return { ok: false, code: "invalid_coupon", message: "This coupon is invalid." };
    }
    couponCode = input.coupon.code;
  }

  const requestedBundle = Math.max(0, input.bundleDiscountPaise || 0);
  const bundleDiscountPaise = planDiscountPaise > 0 || couponPaise > 0 ? 0 : Math.min(requestedBundle, merchandiseAndFees - couponPaise);
  const preTaxPaise = merchandiseAndFees - couponPaise - bundleDiscountPaise;
  let taxPaise = 0;
  let totalPaise = preTaxPaise;
  if (input.taxMode === "exclusive") {
    taxPaise = roundBps(preTaxPaise, input.taxRateBps);
    totalPaise = preTaxPaise + taxPaise;
  } else if (input.taxMode === "inclusive") {
    totalPaise = preTaxPaise;
    taxPaise = Math.round((totalPaise * input.taxRateBps) / (10_000 + input.taxRateBps));
  }

  if (totalPaise < 0) {
    return { ok: false, code: "negative_total", message: "This combination cannot be priced below zero." };
  }

  const discountPool = planDiscountPaise + couponPaise + bundleDiscountPaise;
  const weights = input.deliveries.map((delivery) => delivery.foodPaise + delivery.addonPaise + delivery.feePaise);
  const discountShares = allocatePaise(discountPool, weights);
  const afterDiscount = weights.map((weight, index) => weight - discountShares[index]);
  const taxShares = allocatePaise(taxPaise, afterDiscount.map((amount) => Math.max(amount, 0)));
  const totalShares =
    input.taxMode === "exclusive"
      ? afterDiscount.map((amount, index) => amount + taxShares[index])
      : allocatePaise(totalPaise, weights);

  const allocations: DeliveryAllocation[] = input.deliveries.map((delivery, index) => ({
    date: delivery.date,
    label: delivery.label,
    foodPaise: delivery.foodPaise,
    addonPaise: delivery.addonPaise,
    feePaise: delivery.feePaise,
    discountPaise: discountShares[index],
    taxPaise: taxShares[index],
    totalPaise: totalShares[index],
  }));

  return {
    ok: true,
    referenceFoodPaise,
    foodPaise,
    customizationDeltaPaise,
    addonPaise,
    deliveryFeePaise,
    deliveryCount: input.deliveries.length,
    planDiscountPaise,
    couponPaise,
    couponCode,
    bundleDiscountPaise,
    preTaxPaise,
    taxPaise,
    totalPaise,
    taxMode: input.taxMode,
    taxRateBps: input.taxRateBps,
    taxLabel: input.taxLabel,
    allocations,
  };
}
