# Architecture

AuraBowls is one Next.js application. Pages render on the server. Checkout, payment, OTP, and admin changes go through route handlers that use Prisma.

Money is stored as integer paise. Dates are `YYYY-MM-DD` in `Asia/Kolkata`. The cutoff is 24 hours before the delivery slot.

## Orders

1. The browser keeps a draft in `sessionStorage`. That draft is not an order.
2. The server rebuilds the dates, checks the PIN, menu, coupon, and price.
3. If the total the customer reviewed does not match, the order is not created.
4. A transaction reserves meal portions and one slot per delivery for 10 minutes, then writes a pending order.
5. Razorpay, or the local simulator, confirms the payment. A matching signature or a signed webhook is required.
6. Payment moves the reservation from held to sold. Kitchen acceptance is a separate admin action.

If the payment arrives after the hold has expired, the order is marked for reconciliation and a refund waits for approval. Deliveries are not confirmed automatically.

Duplicate webhooks are stored by event id. Paying twice does not create a second paid order.

## Sheets

Direction: database → `Orders` sheet, after a captured payment that does not need reconciliation.

Conflict rule: the database wins. The sheet is an operational copy. Turn the export on in settings only after the service account can edit the spreadsheet.

## Capacity

Each meal has a daily portion limit. Each slot has a daily drop limit. A delivery uses one slot and as many portions as the quantity. Both checks happen in the same database transaction with a conditional update, so two customers cannot both take the last portion.

Manual ingredient inventory is separate and does not reserve orders.
