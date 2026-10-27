# Admin guide

Sign in at `/admin/login`. There is one owner account, created by the seed from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Daily flow

- Dashboard shows today's deliveries, paid orders waiting for acceptance, pending payments, and refunds waiting for a decision.
- Accept a paid order only after the kitchen can prepare it. Rejecting a paid order releases capacity and creates a refund request. Approving that request is a second step.
- Packing slips and the preparation summary are on Kitchen. Allergies are printed in bold text on each slip. CSV export is on that page.
- Failed deliveries need a reason, contact outcome, and a resolution. A refund is still not sent until someone approves it.
- Customer changes arrive on WhatsApp. Log them on the order, then apply a meal change, reschedule, or address change. The 24 hour cutoff is enforced for meal replacement and address changes. Reschedule is the manual path and still checks capacity.
- Skipping a day is a reschedule. It extends the plan by creating a new delivery and does not refund the skipped day.
- Issue a new tracking link only after you know the person messaging you is the customer. The old link stops working.
- Anonymize a customer only after future deliveries are finished or cancelled. Invoices stay in the admin record.

## Menu and money

Changing a meal price does not change orders already placed. Nutrition can be missing, estimated, or verified. Do not mark a value verified unless it was actually checked. Allergen text is a recipe declaration, not a claim that a meal is allergen-free.

Plan discounts are a percentage of the default meal's current menu price. Coupons that are not stackable cannot be combined with that discount.

Leave tax at "Not configured" until the business confirms GST. Invoices include a notice when GSTIN is blank.
