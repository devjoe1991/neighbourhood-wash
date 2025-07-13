'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  User,
  WashingMachine,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  PartyPopper,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { applyToBeWasher } from '@/app/auth/actions' // We will create this server action
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Define Zod schema for validation
const formSchema = z.object({
  // Step 1
  phone_number: z.string().min(10, 'Please enter a valid phone number'),
  service_address: z
    .string()
    .min(10, 'Please enter a complete service address'),
  borough: z.string().min(1, 'Please select your borough'),

  // Step 2
  service_offerings: z
    .array(z.string())
    .refine((value: string[]) => value.some((item: string) => item), {
      message: 'You have to select at least one service.',
    }),
  offers_collection: z.boolean().default(false).optional(),
  collection_radius: z.number().optional(),
  collection_fee: z.number().optional(),

  // Step 3
  equipment_details: z
    .string()
    .min(
      20,
      'Please describe your equipment in a bit more detail (at least 20 characters).'
    ),
  washer_bio: z
    .string()
    .min(50, 'Please tell us a bit about yourself (at least 50 characters).'),

  // New Step 4: Legal Consents (all required)
  washer_agreement_consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Washer Agreement to proceed',
  }),
  independent_contractor_consent: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge your independent contractor status',
  }),
  financial_terms_consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the financial terms',
  }),
  insurance_acknowledgment: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge your insurance responsibility',
  }),
  tax_responsibility_consent: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge your tax responsibility',
  }),
  pet_smoke_free_consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the pet-free and smoke-free policy',
  }),
  cancellation_policy_consent: z.boolean().refine((val) => val === true, {
    message: 'You must understand the cancellation policy and penalties',
  }),
  terms_of_service_consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms of Service',
  }),
  privacy_policy_consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Privacy Policy',
  }),
  community_guidelines_consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Community Guidelines',
  }),
})

type FormValues = z.infer<typeof formSchema>

const steps = [
  {
    id: 'personal',
    title: 'Your Details',
    icon: <User className='h-5 w-5' />,
    fields: ['phone_number', 'service_address', 'borough'],
  },
  {
    id: 'services',
    title: 'Services & Pricing',
    icon: <WashingMachine className='h-5 w-5' />,
    fields: [
      'service_offerings',
      'offers_collection',
      'collection_radius',
      'collection_fee',
    ],
  },
  {
    id: 'bio',
    title: 'Equipment & Bio',
    icon: <ClipboardCheck className='h-5 w-5' />,
    fields: ['equipment_details', 'washer_bio'],
  },
  {
    id: 'legal',
    title: 'Legal Agreements',
    icon: <ShieldCheck className='h-5 w-5' />,
    fields: [
      'washer_agreement_consent',
      'independent_contractor_consent',
      'financial_terms_consent',
      'insurance_acknowledgment',
      'tax_responsibility_consent',
      'pet_smoke_free_consent',
      'cancellation_policy_consent',
      'terms_of_service_consent',
      'privacy_policy_consent',
      'community_guidelines_consent',
    ],
  },
]

const londonBoroughs = [
  'Barking and Dagenham',
  'Barnet',
  'Bexley',
  'Brent',
  'Bromley',
  'Camden',
  'City of London',
  'Croydon',
  'Ealing',
  'Enfield',
  'Greenwich',
  'Hackney',
  'Hammersmith and Fulham',
  'Haringey',
  'Harrow',
  'Havering',
  'Hillingdon',
  'Hounslow',
  'Islington',
  'Kensington and Chelsea',
  'Kingston upon Thames',
  'Lambeth',
  'Lewisham',
  'Merton',
  'Newham',
  'Redbridge',
  'Richmond upon Thames',
  'Southwark',
  'Sutton',
  'Tower Hamlets',
  'Waltham Forest',
  'Wandsworth',
  'Westminster',
]

export default function WasherApplicationForm({
  user,
}: {
  user: { phone?: string | null } | null
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone_number: user?.phone || '',
      service_address: '',
      borough: '',
      service_offerings: [],
      offers_collection: false,
      equipment_details: '',
      washer_bio: '',
      // Initialize all consent fields to false
      washer_agreement_consent: false,
      independent_contractor_consent: false,
      financial_terms_consent: false,
      insurance_acknowledgment: false,
      tax_responsibility_consent: false,
      pet_smoke_free_consent: false,
      cancellation_policy_consent: false,
      terms_of_service_consent: false,
      privacy_policy_consent: false,
      community_guidelines_consent: false,
    },
  })

  const serviceOfferingsValue = watch('service_offerings') || []

  const processForm: SubmitHandler<FormValues> = async (data: FormValues) => {
    console.log('Submitting data:', data)
    setIsSubmitting(true)
    setServerError(null)

    const result = await applyToBeWasher(data)

    setIsSubmitting(false)

    if (result && result.error) {
      setServerError(result.error.message)
    } else {
      setIsSuccess(true)
    }
  }

  type FieldName = keyof FormValues

  const nextStep = async () => {
    const fields = steps[currentStep].fields
    const output = await trigger(fields as FieldName[], { shouldFocus: true })
    if (!output) return

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1)
    }
  }
  const progress = ((currentStep + 1) / (steps.length + 1)) * 100

  if (isSuccess) {
    return (
      <Alert className='border-green-500 bg-green-50 text-green-700'>
        <PartyPopper className='h-5 w-5 text-green-600' />
        <AlertTitle className='font-semibold text-green-800'>
          Application Submitted!
        </AlertTitle>
        <AlertDescription>
          Thank you! We&apos;ve received your application. We&apos;ll review
          your details and get in touch with the next steps shortly.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Washer Application</CardTitle>
        <CardDescription>
          Complete the steps below to become a Neighbourhood Washer.
        </CardDescription>
        <Progress value={progress} className='mt-4' />
      </CardHeader>
      <form onSubmit={handleSubmit(processForm)}>
        <CardContent>
          {/* Step 1: Personal Details */}
          {currentStep === 0 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>Your Details</h3>
              <div>
                <Label htmlFor='phone_number'>Phone Number</Label>
                <Input
                  id='phone_number'
                  {...register('phone_number')}
                  placeholder='e.g., 07123456789'
                />
                {errors.phone_number && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.phone_number.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='service_address'>
                  Full Address (for service verification)
                </Label>
                <Textarea
                  id='service_address'
                  {...register('service_address')}
                  placeholder='123 Main Street, London, W1A 1AA'
                />
                {errors.service_address && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.service_address.message}
                  </p>
                )}
                <p className='mt-1 text-xs text-gray-500'>
                  Your full address will not be public. We use it for
                  verification and to show your general area to users.
                </p>
              </div>
              <div>
                <Label htmlFor='borough'>London Borough</Label>
                <Select onValueChange={(value) => setValue('borough', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select your London borough' />
                  </SelectTrigger>
                  <SelectContent>
                    {londonBoroughs.map((borough) => (
                      <SelectItem key={borough} value={borough}>
                        {borough}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.borough && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.borough.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Services & Pricing */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <h3 className='text-lg font-medium'>Services & Pricing</h3>
              <div className='space-y-2'>
                <Label>What services will you offer?</Label>
                {[
                  { id: 'wash', label: 'Wash' },
                  { id: 'dry', label: 'Dry' },
                  { id: 'iron', label: 'Iron' },
                ].map((item) => (
                  <div key={item.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={item.id}
                      checked={serviceOfferingsValue.includes(item.id)}
                      onCheckedChange={(checked) => {
                        const currentValues = getValues('service_offerings')
                        const updatedValues = checked
                          ? [...currentValues, item.id]
                          : currentValues.filter((value) => value !== item.id)
                        setValue('service_offerings', updatedValues, {
                          shouldValidate: true,
                        })
                      }}
                    />
                    <Label
                      htmlFor={item.id}
                      className='font-normal text-gray-700'
                    >
                      {item.label}
                    </Label>
                  </div>
                ))}
                {errors.service_offerings && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.service_offerings.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Bio & Equipment */}
          {currentStep === 2 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>Equipment & Bio</h3>
              <div>
                <Label htmlFor='equipment_details'>
                  Describe your laundry equipment
                </Label>
                <Textarea
                  id='equipment_details'
                  {...register('equipment_details')}
                  placeholder='Tell us about your washing machine, dryer, iron, and any other equipment...'
                />
                {errors.equipment_details && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.equipment_details.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='washer_bio'>Tell us about yourself</Label>
                <Textarea
                  id='washer_bio'
                  {...register('washer_bio')}
                  placeholder='Share your experience, what makes you reliable, and why you want to be a Neighbourhood Washer...'
                />
                {errors.washer_bio && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.washer_bio.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Legal Agreements & Consent */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <div className='text-center'>
                <h3 className='mb-2 text-lg font-medium'>
                  Legal Agreements & Required Acknowledgments
                </h3>
                <p className='text-sm text-gray-600'>
                  Please read and agree to all the following requirements to
                  complete your Washer application.
                </p>
              </div>

              {/* Important Notice */}
              <div className='rounded-lg border-2 border-blue-200 bg-blue-50 p-4'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600' />
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-blue-800'>
                      Important: Independent Contractor Agreement
                    </h4>
                    <p className='text-sm leading-relaxed text-blue-700'>
                      By becoming a Washer, you acknowledge that you will be
                      operating as a{' '}
                      <strong>self-employed independent contractor</strong>, not
                      as an employee of Neighbourhood Wash. You will be
                      responsible for your own taxes, insurance, and business
                      expenses.
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                {/* Washer Agreement */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='washer_agreement_consent'
                    {...register('washer_agreement_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='washer_agreement_consent'
                    className='text-sm leading-5'
                  >
                    I have read and agree to the specific{' '}
                    <Link
                      href='/washer-agreement'
                      target='_blank'
                      className='font-medium text-blue-600 underline hover:text-blue-800'
                    >
                      Washer Agreement
                    </Link>{' '}
                    which governs my role as an independent contractor on the
                    platform.
                  </Label>
                </div>
                {errors.washer_agreement_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.washer_agreement_consent.message}
                  </p>
                )}

                {/* Independent Contractor Status */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='independent_contractor_consent'
                    {...register('independent_contractor_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='independent_contractor_consent'
                    className='text-sm leading-5'
                  >
                    <strong>
                      I acknowledge and agree that I am operating as a
                      self-employed independent contractor.
                    </strong>{' '}
                    I am not an employee, partner, or agent of Neighbourhood
                    Wash. I am responsible for paying my own income tax,
                    National Insurance contributions, and managing my own
                    business expenses.
                  </Label>
                </div>
                {errors.independent_contractor_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.independent_contractor_consent.message}
                  </p>
                )}

                {/* Financial Terms */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='financial_terms_consent'
                    {...register('financial_terms_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='financial_terms_consent'
                    className='text-sm leading-5'
                  >
                    I agree to the financial terms:{' '}
                    <strong>£50 one-time onboarding fee</strong> (subject to
                    promotions),
                    <strong>15% platform commission</strong> on bookings, and{' '}
                    <strong>£2.50 payout fee</strong> per withdrawal. I
                    understand these rates may change with prior notice.
                  </Label>
                </div>
                {errors.financial_terms_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.financial_terms_consent.message}
                  </p>
                )}

                {/* Insurance Responsibility */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='insurance_acknowledgment'
                    {...register('insurance_acknowledgment')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='insurance_acknowledgment'
                    className='text-sm leading-5'
                  >
                    <strong>
                      I acknowledge that Neighbourhood Wash does NOT provide any
                      form of public liability or business insurance.
                    </strong>
                    It is my sole responsibility to obtain and maintain adequate
                    insurance to cover potential damages, accidents, or
                    liabilities arising from my services.
                  </Label>
                </div>
                {errors.insurance_acknowledgment && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.insurance_acknowledgment.message}
                  </p>
                )}

                {/* Tax Responsibility */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='tax_responsibility_consent'
                    {...register('tax_responsibility_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='tax_responsibility_consent'
                    className='text-sm leading-5'
                  >
                    I understand that I am solely responsible for declaring and
                    paying all applicable income tax and National Insurance
                    contributions to HMRC on all earnings received through the
                    Neighbourhood Wash Platform.
                  </Label>
                </div>
                {errors.tax_responsibility_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.tax_responsibility_consent.message}
                  </p>
                )}

                {/* Pet-Free & Smoke-Free Policy */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='pet_smoke_free_consent'
                    {...register('pet_smoke_free_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='pet_smoke_free_consent'
                    className='text-sm leading-5'
                  >
                    <strong>
                      I agree to adhere to the strict pet-free and smoke-free
                      policy
                    </strong>{' '}
                    within my laundry area and on all equipment used for
                    services. This is non-negotiable to protect users with
                    allergies and ensure high cleanliness standards.
                  </Label>
                </div>
                {errors.pet_smoke_free_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.pet_smoke_free_consent.message}
                  </p>
                )}

                {/* Cancellation Policy */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='cancellation_policy_consent'
                    {...register('cancellation_policy_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='cancellation_policy_consent'
                    className='text-sm leading-5'
                  >
                    I understand the{' '}
                    <Link
                      href='/cancellation-refund-policy'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      cancellation policy and penalties
                    </Link>
                    : cancellations within 12 hours incur a penalty equal to the
                    booking price plus £10, and repeated cancellations may
                    result in account suspension.
                  </Label>
                </div>
                {errors.cancellation_policy_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.cancellation_policy_consent.message}
                  </p>
                )}

                {/* Terms of Service */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='terms_of_service_consent'
                    {...register('terms_of_service_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='terms_of_service_consent'
                    className='text-sm leading-5'
                  >
                    I agree to the{' '}
                    <Link
                      href='/terms-of-service'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      Terms of Service
                    </Link>{' '}
                    and understand my role as an independent contractor on the
                    platform.
                  </Label>
                </div>
                {errors.terms_of_service_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.terms_of_service_consent.message}
                  </p>
                )}

                {/* Privacy Policy */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='privacy_policy_consent'
                    {...register('privacy_policy_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='privacy_policy_consent'
                    className='text-sm leading-5'
                  >
                    I agree to the{' '}
                    <Link
                      href='/privacy-policy'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      Privacy Policy
                    </Link>{' '}
                    and consent to the processing of my personal data as
                    described, including ID verification via Stripe Identity.
                  </Label>
                </div>
                {errors.privacy_policy_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.privacy_policy_consent.message}
                  </p>
                )}

                {/* Community Guidelines */}
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    id='community_guidelines_consent'
                    {...register('community_guidelines_consent')}
                    className='mt-1'
                  />
                  <Label
                    htmlFor='community_guidelines_consent'
                    className='text-sm leading-5'
                  >
                    I agree to follow the{' '}
                    <Link
                      href='/community-guidelines'
                      target='_blank'
                      className='text-blue-600 underline hover:text-blue-800'
                    >
                      Community Guidelines & Acceptable Use Policy
                    </Link>{' '}
                    and maintain professional, respectful conduct with all
                    users.
                  </Label>
                </div>
                {errors.community_guidelines_consent && (
                  <p className='ml-6 text-sm text-red-600'>
                    {errors.community_guidelines_consent.message}
                  </p>
                )}
              </div>

              <div className='mt-6 rounded-lg bg-gray-50 p-4'>
                <p className='text-xs text-gray-600'>
                  <strong>Legal Notice:</strong> By completing this application,
                  you confirm that you are at least 18 years old and have the
                  legal capacity to enter into these agreements. All legal
                  documents will open in a new tab for your review. Your
                  application will be reviewed, and you will be contacted with
                  the next steps.
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className='flex justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type='button' onClick={nextStep}>
              Next
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          ) : (
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Submit Application
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
