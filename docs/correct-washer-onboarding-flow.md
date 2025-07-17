Correct Washer Onboarding Flow:
User signs up as washer → Gets role: 'washer' but washer_status: null/pending
Washer dashboard shows KYC onboarding → Limited access, can't use core features
Washer completes onboarding steps:
Pay onboarding fee
Agree to washer compliance
Provide full address & service area
Complete Stripe KYC verification
Provide other key information
Admin reviews and approves → washer_status: 'approved'
Full washer access → Can take bookings, access payouts, etc.