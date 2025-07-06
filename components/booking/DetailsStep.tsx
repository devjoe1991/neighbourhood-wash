'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UploadCloud, FileText, User, Phone } from 'lucide-react'

interface DetailsStepProps {
  specialInstructions: string
  onSpecialInstructionsChange: (instructions: string) => void
  stainRemovalSelected: boolean
}

export default function DetailsStep({
  specialInstructions,
  onSpecialInstructionsChange,
  stainRemovalSelected,
}: DetailsStepProps) {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='mb-2 text-lg font-semibold'>Final Details</h3>
        <p className='mb-4 text-gray-600'>
          Add any special instructions and upload photos if needed.
        </p>
      </div>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Special Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor='instructions' className='mb-3 block text-sm'>
            Let your Washer know about any specific requirements or preferences
          </Label>
          <Textarea
            id='instructions'
            placeholder='e.g., Please use non-bio detergent, the blue shirt is delicate...'
            value={specialInstructions}
            onChange={(e) => onSpecialInstructionsChange(e.target.value)}
            className='min-h-[120px]'
          />
        </CardContent>
      </Card>

      {/* Image Uploader - Conditional */}
      {stainRemovalSelected && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UploadCloud className='h-5 w-5' />
              Upload Photos of Stains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className='mb-3 block text-sm'>
              Help your Washer identify and treat stains effectively by
              uploading clear photos
            </Label>
            <div className='flex min-h-[200px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50'>
              <div className='text-center'>
                <UploadCloud className='mx-auto h-12 w-12 text-gray-400' />
                <div className='mt-4'>
                  <p className='text-sm font-medium text-gray-900'>
                    Click or drag to upload images
                  </p>
                  <p className='text-xs text-gray-500'>
                    PNG, JPG up to 10MB each
                  </p>
                </div>
              </div>
            </div>
            <p className='mt-2 text-xs text-gray-500'>
              <strong>Tip:</strong> Take clear, well-lit photos of each stain
              for best results
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className='mb-3 block text-sm'>
            Your Washer will use these details to coordinate collection
          </Label>
          <div className='space-y-3 rounded-lg bg-gray-50 p-4'>
            <div className='flex items-center gap-3'>
              <User className='h-4 w-4 text-gray-500' />
              <span className='text-sm font-medium'>Joe Bloggs</span>
            </div>
            <div className='flex items-center gap-3'>
              <Phone className='h-4 w-4 text-gray-500' />
              <span className='text-sm font-medium'>07123 456789</span>
            </div>
          </div>
          <p className='mt-2 text-xs text-gray-500'>
            You can update your contact details in{' '}
            <span className='text-blue-600 underline'>Settings</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
