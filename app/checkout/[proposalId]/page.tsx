// app/checkout/[proposalId]/page.tsx
// Server Page xử lý thanh toán ký quỹ cho đề xuất tuyển dụng

import { createPaymentLinkAction } from "./actions";
import CheckoutClient from "./checkout-client";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  const result = await createPaymentLinkAction(proposalId);

  return (
    <CheckoutClient proposalId={proposalId} initialPaymentData={result} />
  );
}
