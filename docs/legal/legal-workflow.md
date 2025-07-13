# Legal Framework & Workflow Documentation

## Neighbourhood Wash Platform

### Overview

This document provides a comprehensive guide to the legal framework implementation across the Neighbourhood Wash platform, detailing where each legal document is referenced, how consent mechanisms work, and the workflow for updating legal documents.

---

## Legal Documents Implemented

### 1. Terms of Service

- **Location**: `/app/terms-of-service/page.tsx`
- **Content**: Platform role, booking process, PIN system, liability limitations, legal framework
- **SEO**: Full metadata, OpenGraph tags, structured content

### 2. Privacy Policy

- **Location**: `/app/privacy-policy/page.tsx`
- **Content**: GDPR-compliant data collection, legal basis table, user rights, ICO contact
- **Compliance**: UK GDPR compliant with data processing transparency

### 3. Cancellation & Refund Policy

- **Location**: `/app/cancellation-refund-policy/page.tsx`
- **Content**: User/washer cancellation timeframes, penalties, visual summary table
- **Features**: Clear timeline structure with penalty breakdown

### 4. Dispute Resolution & Claims Policy

- **Location**: `/app/dispute-resolution-claims-policy/page.tsx`
- **Content**: 4-step dispute process, visual flow diagram, mediation procedures
- **Features**: Visual process flow with step-by-step guidance

### 5. Community Guidelines

- **Location**: `/app/community-guidelines/page.tsx`
- **Content**: Conduct standards, platform integrity, hygiene standards, enforcement
- **Focus**: User safety and platform quality maintenance

### 6. Washer Agreement

- **Location**: `/app/washer-agreement/page.tsx`
- **Content**: Independent contractor terms, insurance, financial terms, property standards
- **Specific**: Washer-only obligations and business requirements

### 7. Cookie Policy

- **Location**: `/app/cookie-policy/page.tsx`
- **Content**: Cookie usage, types (essential/analytics/marketing), user choices, GDPR rights
- **Features**: Cookie preference management, third-party service transparency

---

## Implementation Locations & Consent Mechanisms

### 1. User Registration Consent

**File**: `/app/signup/page.tsx`
**Consent Required**:

- ✅ Terms of Service (required)
- ✅ Privacy Policy (required)
- ✅ Community Guidelines (required)
- ✅ Cancellation & Refund Policy (required)
- ⚪ Marketing Communications (optional)

**Implementation Details**:

- All required documents open in new tabs for review
- Form validation prevents submission without required consents
- Legal notices about age requirements and document review obligation

### 2. Booking Confirmation Consent

**File**: `/components/booking/PaymentStep.tsx`
**Consent Required**:

- ✅ Terms of Service understanding
- ✅ Cancellation & Refund Policy acceptance
- ✅ Dispute Resolution process understanding
- ✅ Liability limitations acknowledgment
- ✅ PIN system responsibility
- ✅ Personal items responsibility

**Implementation Details**:

- Six required consent checkboxes
- Independent contractor status notice
- Payment security information
- Enhanced legal disclaimers

### 3. Washer Application Consent

**File**: `/components/dashboard/WasherApplicationForm.tsx`
**Step**: 4th step of washer onboarding
**Consent Required**:

- ✅ Washer Agreement (washer-specific)
- ✅ Independent contractor status
- ✅ Financial terms (£50 fee, 15% commission, £2.50 payout fee)
- ✅ Insurance responsibility
- ✅ Tax responsibility
- ✅ Pet-free policy
- ✅ Smoke-free policy
- ✅ Terms of Service
- ✅ Privacy Policy
- ✅ Community Guidelines

**Implementation Details**:

- Ten required legal consent checkboxes
- Financial transparency with specific fee disclosure
- Professional obligations and standards
- All standard platform policies

### 4. Footer Navigation

**File**: `/components/layout/Footer.tsx`
**Legal Links Section**:

- Terms of Service
- Privacy Policy
- Cookie Policy
- Cancellation & Refund Policy
- Dispute Resolution & Claims Policy
- Community Guidelines
- Washer Agreement

**Implementation Details**:

- Organized "Legal" section in footer
- All links open in new tabs
- Consistent navigation across all pages
- Mobile-responsive design

### 5. Cookie Consent Banner

**File**: `/components/legal/CookieConsent.tsx`
**Features**:

- ✅ Granular cookie preferences (Essential/Analytics/Marketing)
- ✅ GDPR-compliant consent mechanism
- ✅ Local storage preference management
- ✅ Cookie preference modal with detailed explanations
- ✅ "Accept All", "Essential Only", and "Custom Settings" options

**Implementation Details**:

- Appears on first visit with 1-second delay
- Persistent across sessions once preferences are set
- Integrates with analytics initialization
- Mobile-responsive design with proper z-indexing

### 6. GDPR Data Management

**File**: `/components/legal/GDPRDataManagement.tsx`
**GDPR Rights Implemented**:

- ✅ Right to Access (data export in JSON/CSV)
- ✅ Right to Rectification (data correction requests)
- ✅ Right to Erasure (account deletion)
- ✅ Right to Portability (data export for transfer)

**Implementation Details**:

- Tabbed interface for different GDPR rights
- Secure confirmation for account deletion
- Request tracking and status management
- 72-hour response time commitment
- Integration with backend for data processing

### 7. Legal Provider Integration

**File**: `/components/providers/LegalProvider.tsx`
**Integration**: `/app/layout.tsx`
**Features**:

- Global cookie consent banner management
- Suspense loading for legal components
- Centralized legal component provider

**Implementation Details**:

- Wraps entire application in root layout
- Lazy-loaded cookie consent for performance
- No hydration conflicts with server-side rendering

---

## Document Update Workflow

### Step 1: Document Analysis

Before updating any legal document, analyze:

1. **Impact Scope**: Which user flows are affected?
2. **Consent Requirements**: Do new terms require explicit user consent?
3. **Implementation Points**: Where are references across the platform?
4. **Timeline**: When do changes take effect?

### Step 2: Document Update Process

1. **Update Source Document**: Modify the relevant page in `/app/[document-name]/page.tsx`
2. **Update Consent Text**: Modify consent checkbox text in relevant components
3. **Version Control**: Add effective date and version number to document
4. **SEO Updates**: Update metadata if document title/description changes

### Step 3: Platform Implementation Points

For each document update, check and update these locations:

#### Terms of Service Updates

- [ ] `/app/terms-of-service/page.tsx` (source document)
- [ ] `/app/signup/page.tsx` (user registration consent)
- [ ] `/components/booking/PaymentStep.tsx` (booking consent)
- [ ] `/components/dashboard/WasherApplicationForm.tsx` (washer consent)
- [ ] `/components/layout/Footer.tsx` (navigation link)

#### Privacy Policy Updates

- [ ] `/app/privacy-policy/page.tsx` (source document)
- [ ] `/app/signup/page.tsx` (user registration consent)
- [ ] `/components/dashboard/WasherApplicationForm.tsx` (washer consent)
- [ ] `/components/layout/Footer.tsx` (navigation link)
- [ ] `/components/legal/CookieConsent.tsx` (cookie consent banner)

#### Cookie Policy Updates

- [ ] `/app/cookie-policy/page.tsx` (source document)
- [ ] `/components/layout/Footer.tsx` (navigation link)
- [ ] `/components/legal/CookieConsent.tsx` (cookie consent banner)
- [ ] Analytics initialization (if cookie types change)
- [ ] Marketing cookie integration (if marketing enabled)

#### Cancellation & Refund Policy Updates

- [ ] `/app/cancellation-refund-policy/page.tsx` (source document)
- [ ] `/app/signup/page.tsx` (user registration consent)
- [ ] `/components/booking/PaymentStep.tsx` (booking consent)
- [ ] `/components/layout/Footer.tsx` (navigation link)

#### Dispute Resolution Updates

- [ ] `/app/dispute-resolution-claims-policy/page.tsx` (source document)
- [ ] `/components/booking/PaymentStep.tsx` (booking consent)
- [ ] `/components/layout/Footer.tsx` (navigation link)

#### Community Guidelines Updates

- [ ] `/app/community-guidelines/page.tsx` (source document)
- [ ] `/app/signup/page.tsx` (user registration consent)
- [ ] `/components/dashboard/WasherApplicationForm.tsx` (washer consent)
- [ ] `/components/layout/Footer.tsx` (navigation link)

#### Washer Agreement Updates

- [ ] `/app/washer-agreement/page.tsx` (source document)
- [ ] `/components/dashboard/WasherApplicationForm.tsx` (washer consent)
- [ ] `/components/layout/Footer.tsx` (navigation link)

---

## Future Update Prompt Template

### When Legal Document Updates Are Needed

**Use this prompt structure when requesting legal document updates:**

```
## Legal Document Update Request

**Document**: [Terms of Service / Privacy Policy / Cancellation Policy / etc.]
**Update Type**: [Minor clarification / Major changes / New requirement / Compliance update]
**Effective Date**: [When changes should take effect]
**Reason**: [Legal requirement / Business change / Compliance / Bug fix]

### Changes Required:
1. [Specific change 1]
2. [Specific change 2]
3. [etc.]

### Impact Analysis:
- **User Registration**: [Does this affect signup consent?]
- **Booking Flow**: [Does this affect booking consent?]
- **Washer Onboarding**: [Does this affect washer consent?]
- **Existing Users**: [Do existing users need to re-consent?]

### Compliance Requirements:
- **GDPR**: [Any data processing changes?]
- **UK Law**: [Any regulatory compliance needed?]
- **Platform Policy**: [Internal policy changes?]

### Implementation Priority:
- **Urgent** (legal compliance required)
- **High** (business critical)
- **Medium** (improvement)
- **Low** (minor update)
```

### Example Update Request

```
## Legal Document Update Request

**Document**: Privacy Policy
**Update Type**: Major changes
**Effective Date**: January 15, 2025
**Reason**: New AI features require additional data processing disclosure

### Changes Required:
1. Add section about AI-powered washer matching algorithm
2. Update data retention periods from 2 years to 3 years
3. Add third-party AI service provider (OpenAI) to data sharing section
4. Include new user rights for AI decision-making

### Impact Analysis:
- **User Registration**: Yes - new AI data processing consent needed
- **Booking Flow**: Yes - AI matching disclosure needed
- **Washer Onboarding**: Yes - AI algorithm explanation needed
- **Existing Users**: Yes - re-consent required for AI features

### Compliance Requirements:
- **GDPR**: Yes - automated decision-making disclosure required
- **UK Law**: Yes - UK GDPR Article 22 compliance
- **Platform Policy**: New AI ethics policy alignment

### Implementation Priority:
- **High** (compliance required before AI feature launch)
```

---

## Best Practices for Legal Updates

### 1. Version Control

- Always include effective date in document headers
- Maintain version history in document comments
- Use semantic versioning for major/minor changes

### 2. User Communication

- Email existing users about significant changes
- Provide clear summary of changes
- Give reasonable notice period (minimum 30 days for major changes)

### 3. Consent Management

- Major changes require explicit re-consent
- Minor clarifications may not require re-consent
- Always err on the side of transparency

### 4. Technical Implementation

- Test all consent flows after updates
- Verify SEO metadata updates
- Check mobile responsiveness of updated documents
- Validate all internal links work correctly

### 5. Compliance Verification

- Review with legal counsel for major changes
- Ensure GDPR compliance for data processing changes
- Verify UK law compliance for platform operations
- Check industry-specific requirements for laundry services

---

## Monitoring & Maintenance

### Monthly Review Checklist

- [ ] Review all legal documents for outdated information
- [ ] Check consent completion rates in analytics
- [ ] Verify all footer links are working
- [ ] Test consent flows on different devices
- [ ] Review any legal compliance updates in UK law

### Quarterly Audit

- [ ] Full legal document review with counsel
- [ ] Consent mechanism effectiveness analysis
- [ ] Compliance requirement updates
- [ ] User feedback on legal clarity
- [ ] Platform policy alignment check

---

## Emergency Legal Update Process

### For Urgent Legal Compliance

1. **Immediate**: Update source document with emergency notice
2. **Within 24h**: Update all consent mechanisms
3. **Within 48h**: Notify all users via email
4. **Within 72h**: Complete full platform implementation
5. **Within 1 week**: Legal counsel review and final approval

### Emergency Contact Protocol

- Legal counsel contact information
- Platform admin notification system
- User communication channels
- Regulatory body reporting procedures

---

## Cookie Consent & GDPR Compliance Implementation

### Cookie Consent System

**Implementation Status**: ✅ Completed July 13, 2025

**Features Implemented**:

- **Granular Cookie Categories**: Essential (always active), Analytics (optional), Marketing (coming soon)
- **User Choice Options**: Accept All, Essential Only, Custom Preferences
- **Persistent Storage**: LocalStorage-based preference management with versioning
- **Modal Interface**: Detailed explanations of each cookie category with toggle controls
- **Privacy Integration**: Direct links to cookie policy and privacy documents

**Technical Implementation**:

- Client-side component with React hooks for state management
- Delayed appearance (1 second) for better user experience
- Z-index optimization to appear above all content
- Mobile-responsive design with proper touch targets
- Analytics integration hooks (Google Analytics ready)

### GDPR Data Management System

**Implementation Status**: ✅ Completed July 13, 2025

**Rights Implementation**:

1. **Right to Access**: Data export in JSON or CSV format with secure download links
2. **Right to Rectification**: Form-based data correction requests with reason tracking
3. **Right to Erasure**: Account deletion with secure confirmation process
4. **Right to Portability**: Data export specifically for transfer to other services

**Security Features**:

- Confirmation requirements for destructive actions
- Request tracking and status management
- 72-hour response time commitment
- Email verification for sensitive operations
- Audit trail for all GDPR requests

**User Interface**:

- Tabbed interface for easy navigation between rights
- Clear explanations of each right and process
- Progress indicators for request status
- Contact information for DPO and support

### Integration Points

**Global Integration**:

- Cookie consent banner appears site-wide via LegalProvider
- GDPR components available in user dashboard/settings
- Footer links updated to include cookie policy
- All legal documents cross-reference each other

**Backend Integration Ready**:

- API endpoints needed for GDPR request processing
- Data export functionality hooks prepared
- Account deletion process outlined
- Cookie preference persistence system

### Compliance Notes

**GDPR Compliance**:

- ✅ Explicit consent mechanisms implemented
- ✅ Granular cookie controls provided
- ✅ Clear privacy information available
- ✅ User rights accessible and documented
- ✅ Data processing transparency maintained

**UK GDPR Compliance**:

- ✅ ICO contact information provided
- ✅ UK-specific data protection rights explained
- ✅ Appropriate retention periods documented
- ✅ Lawful basis for processing clearly stated

**Industry Best Practices**:

- ✅ Privacy by design implementation
- ✅ Minimal data collection approach
- ✅ User-friendly consent mechanisms
- ✅ Regular review and update procedures

---

_Last Updated: July 13, 2025_
_Next Review Date: October 2025_
_Cookie Consent & GDPR Features Added: July 13, 2025_
