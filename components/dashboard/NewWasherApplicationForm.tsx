'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { applyToBeWasher } from '@/app/auth/actions' // We will create this server action

// Define Zod schema for validation
const formSchema = z.object({
  // Step 1
  phone_number: z.string().min(10, 'Please enter a valid phone number'),
  service_address: z
    .string()
    .min(10, 'Please enter a complete service address'),

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
    .min(20, 'Please describe your equipment in a bit more detail (at least 20 characters).'),
  washer_bio: z
    .string()
    .min(50, 'Please tell us a bit about yourself (at least 50 characters).'),
})

type FormValues = z.infer<typeof formSchema>

const washerBioPlaceholder = `e.g., "Hi, I'm Sarah! I work from home and would love to help you with your laundry. I take great care with all items..."`

const steps = [
  {
    id: 'personal',
    title: 'Your Details',
    icon: <User className='h-5 w-5' />,
    fields: ['phone_number', 'service_address'],
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
]

// NOTE: This will be a large component.
// It will manage the multi-step form state and logic.
// We will need a server action `applyToBeWasher` to handle the form submission.
// The user prop will be passed from the parent page to pre-fill data.

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
      service_offerings: [],
      offers_collection: false,
      equipment_details: '',
      washer_bio: '',
    },
  })

  const serviceOfferingsValue = watch('service_offerings') || []

  const processForm: SubmitHandler<FormValues> = async (data: FormValues) => {
    // This is the final submission
    console.log('Submitting data:', data)
    setIsSubmitting(true)
    setServerError(null)

    const result = await applyToBeWasher(data)

    // MOCK DELAY & RESULT
    // await new Promise((resolve) => setTimeout(resolve, 2000))
    // const result: { error?: { message: string } } = { error: undefined } // Mock success
    // const result = { error: { message: 'A simulated error occurred on the server.' } }; // Mock error

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
          Thank you! We've received your application. We'll review your details
          and get in touch with the next steps shortly.
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

              {/* Add collection options here if desired */}
            </div>
          )}

          {/* Step 3: Bio & Equipment */}
          {currentStep === 2 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>Equipment & Bio</h3>
              <div>
                <Label htmlFor='equipment_details'>
                  Describe your equipment
                </Label>
                <Textarea
                  id='equipment_details'
                  {...register('equipment_details')}
                  placeholder='e.g., "I have a new 9kg Samsung washing machine and a separate 8kg condenser dryer..."'
                  rows={4}
                />
                {errors.equipment_details && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.equipment_details.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='washer_bio'>
                  Tell your neighbours about you
                </Label>
                <Textarea
                  id='washer_bio'
                  {...register('washer_bio')}
                  placeholder={washerBioPlaceholder}
                  rows={4}
                />
                {errors.washer_bio && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.washer_bio.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Final Review Step */}
          {currentStep === 3 && (
            <div>
              <h3 className='text-lg font-medium'>Review Your Application</h3>
              <div className='mt-4 space-y-3 rounded-md border bg-gray-50 p-4'>
                <h4 className='font-semibold'>Your Details</h4>
                <p>
                  <strong>Phone:</strong> {getValues('phone_number')}
                </p>
                <p>
                  <strong>Address:</strong> {getValues('service_address')}
                </p>
                <hr />
                <h4 className='font-semibold'>Services</h4>
                <p>
                  <strong>Offered:</strong>{' '}
                  {getValues('service_offerings').join(', ')}
                </p>
                <hr />
                <h4 className='font-semibold'>Bio & Equipment</h4>
                <p>
                  <strong>Equipment:</strong> {getValues('equipment_details')}
                </p>
                <p>
                  <strong>Bio:</strong> {getValues('washer_bio')}
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <Alert variant='destructive' className='mt-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className='justify-between'>
          <div>
            {currentStep > 0 && (
              <Button type='button' variant='outline' onClick={prevStep}>
                <ArrowLeft className='mr-2 h-4 w-4' /> Previous
              </Button>
            )}
          </div>
          <div>
            {currentStep < steps.length ? (
              <Button
                type='button'
                onClick={nextStep}
                disabled={isSubmitting}
              >
                {currentStep === steps.length - 1 ? 'Review' : 'Next'}
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            ) : (
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  )
} 