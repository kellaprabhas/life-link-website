# LifeLink Medicine Store Firebase Notes

The current page intentionally uses mock catalog data and browser `localStorage`. A real implementation should move data and validation to Firebase rather than trusting the browser.

## Suggested Firestore collections

- `medicines/{medicineId}`: name, category, description, price, imageUrl, available, prescriptionRequired, stock, createdAt.
- `users/{userId}`: displayName, phone, savedAddresses, createdAt. Restrict access to the signed-in user's document.
- `carts/{userId}`: items (medicineId and quantity), updatedAt. Use a user-scoped document or a subcollection for line items.
- `orders/{orderId}`: userId, items snapshot, delivery details, deliveryPreference, paymentMethod, subtotal, deliveryCharge, total, status, prescriptionId, createdAt, updatedAt.
- `prescriptions/{prescriptionId}`: userId, orderId, storagePath, fileType, reviewStatus (`pending`, `approved`, `rejected`), reviewedBy, reviewedAt, notes. Store the file in Cloud Storage, not directly in Firestore.

## Backend steps needed

1. Add Firebase Authentication and replace the demo identity with `request.auth.uid`.
2. Load medicines from Firestore with server-side availability and price checks; keep image files in Cloud Storage.
3. Write prescription uploads to a protected Storage path and create a `prescriptions` document with `pending` status.
4. Create orders through a trusted Cloud Function or server endpoint that rechecks stock, prescription status, totals, and delivery fees.
5. Add pharmacist/admin-only rules for prescription review and order status transitions.
6. Add a real payment provider only after server-side order creation, webhooks, refund handling, and compliance review.
7. Configure Firestore and Storage security rules so users can only read their own carts, orders, and prescriptions; never expose service credentials in client code.

This MVP must not be presented as a licensed pharmacy, medical advice service, prescription approval system, real payment flow, or delivery service until those integrations and operational requirements are in place.

## Medicine reminder collections

- `users/{userId}`: `name`, `email`, `notificationPreference`.
- `medicineReminders/{reminderId}`: `userId`, `medicineName`, `dosage`, `time`, `startDate`, `endDate`, `repeatType`, `selectedDays`, `mealInstruction`, `notes`, `isEnabled`, `createdAt`, `updatedAt`.
- `medicationLogs/{logId}`: `userId`, `reminderId`, `medicineName`, `scheduledTime`, `action`, `completedAt`, `snoozedUntil`, `createdAt`.

Firebase Authentication should identify users. Firestore security rules should limit each user to their own reminders and medication logs. Firebase Cloud Messaging, a server-side scheduler, or a native Android/iOS app is needed for reliable background and closed-app notifications; a PWA cannot guarantee exact alarm delivery, especially on iOS.

## Blood Bank collections

- `users/{userId}`: `name`, `email`, `phone`, `city`, `createdAt`.
- `donors/{userId}`: `displayName`, `bloodGroup`, `city`, `area`, `isAvailable`, `lastDonationDate`, `contactPreference`, `consentGiven`, `updatedAt`.
- `bloodRequests/{requestId}`: `requesterId`, `bloodGroup`, `hospitalName`, `city`, `area`, `urgency`, `unitsRequired`, `message`, `status`, `createdAt`.
- `contactRequests/{contactRequestId}`: `bloodRequestId`, `donorId`, `requesterId`, `status`, `donorResponse`, `createdAt`.

Use Firebase Authentication for identity. Firestore rules should ensure only the profile owner can edit their donor profile, only opted-in donor profiles are searchable, private phone/email details are readable only by the owner and an approved requester, and users can access only blood requests they created or received. A production system also needs server-side validation, hospital verification, audit logging, and explicit medical/privacy review.
