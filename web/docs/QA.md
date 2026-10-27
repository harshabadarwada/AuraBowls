# Manual QA

Use the local simulator. Do not use live Razorpay keys for this pass.

1. Open the home page at a narrow phone width and on a desktop width. Move through menu, a meal, and a weekday plan.
2. Build a plan with a seeded PIN such as 500081. Change one day to a different meal. Confirm the review shows a meal-change line.
3. Enter an unknown PIN and confirm the order stops.
4. At checkout, request a development code, enter it wrong once, then enter it correctly.
5. Place the order and complete the simulator payment. Confirm the tracking page says the kitchen has not accepted it yet.
6. Refresh the payment page. Confirm it does not create a second order.
7. In admin, accept the order, mark one delivery packed, then delivered, and submit a private rating from the tracking page.
8. Reschedule one future delivery and confirm the other dates stay put.
9. Create a refund for part of the order, approve it, and confirm the invoice is still the original number and a credit note exists.
10. Turn dinner off and confirm the dinner page says coming soon.
