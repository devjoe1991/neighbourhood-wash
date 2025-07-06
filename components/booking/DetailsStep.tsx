'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  UploadCloud,
  FileText,
  User,
  Phone,
  X,
  CheckCircle,
  AlertCircle,
  MapPin,
} from 'lucide-react'
import { uploadBookingImages, type UploadProgress } from '@/lib/storage'
import { createClient } from '@/utils/supabase/client'

interface DetailsStepProps {
  specialInstructions: string
  onSpecialInstructionsChange: (instructions: string) => void
  stainRemovalSelected: boolean
  uploadedImageUrls: string[]
  onImageUrlsChange: (urls: string[]) => void
  accessNotes: string
  onAccessNotesChange: (notes: string) => void
  laundryPreferences?: string
}

export default function DetailsStep({
  specialInstructions,
  onSpecialInstructionsChange,
  stainRemovalSelected,
  uploadedImageUrls,
  onImageUrlsChange,
  accessNotes,
  onAccessNotesChange,
  laundryPreferences,
}: DetailsStepProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-populate special instructions with user preferences
  useEffect(() => {
    if (laundryPreferences && !specialInstructions) {
      onSpecialInstructionsChange(laundryPreferences)
    }
  }, [laundryPreferences, specialInstructions, onSpecialInstructionsChange])

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Validate file types and sizes
    const validFiles = Array.from(files).filter((file) => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    if (validFiles.length === 0) {
      alert('Please select valid image files (max 10MB each)')
      return
    }

    try {
      setIsUploading(true)

      // Get current user for folder naming
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Please log in to upload images')
        return
      }

      const uploadedUrls = await uploadBookingImages(
        validFiles,
        user.id,
        setUploadProgress
      )

      // Add new URLs to existing ones
      const newUrls = [...uploadedImageUrls, ...uploadedUrls]
      onImageUrlsChange(newUrls)

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress([])
    }
  }

  const handleRemoveImage = (urlToRemove: string) => {
    const newUrls = uploadedImageUrls.filter((url) => url !== urlToRemove)
    onImageUrlsChange(newUrls)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }
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
          {laundryPreferences && (
            <p className='mt-2 text-xs text-gray-500'>
              <strong>Tip:</strong> We've pre-filled this with your saved
              preferences. You can modify or add to them.
            </p>
          )}
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

            {/* File Input - Hidden */}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              onChange={handleFileSelect}
              className='hidden'
            />

            {/* Upload Area */}
            <div
              onClick={triggerFileInput}
              className='flex min-h-[200px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50'
            >
              <div className='text-center'>
                <UploadCloud className='mx-auto h-12 w-12 text-gray-400' />
                <div className='mt-4'>
                  <p className='text-sm font-medium text-gray-900'>
                    Click to upload images
                  </p>
                  <p className='text-xs text-gray-500'>
                    PNG, JPG up to 10MB each
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className='mt-4 space-y-2'>
                <Label className='text-sm font-medium'>Upload Progress:</Label>
                {uploadProgress.map((progress, index) => (
                  <div key={index} className='flex items-center gap-2 text-sm'>
                    {progress.status === 'uploading' && (
                      <UploadCloud className='h-4 w-4 animate-pulse text-blue-500' />
                    )}
                    {progress.status === 'success' && (
                      <CheckCircle className='h-4 w-4 text-green-500' />
                    )}
                    {progress.status === 'error' && (
                      <AlertCircle className='h-4 w-4 text-red-500' />
                    )}
                    <span className='flex-1'>{progress.fileName}</span>
                    <Badge
                      variant={
                        progress.status === 'success'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {progress.status === 'success'
                        ? 'Complete'
                        : progress.status === 'error'
                          ? 'Failed'
                          : 'Uploading...'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded Images */}
            {uploadedImageUrls.length > 0 && (
              <div className='mt-4 space-y-2'>
                <Label className='text-sm font-medium'>Uploaded Images:</Label>
                <div className='grid grid-cols-2 gap-2'>
                  {uploadedImageUrls.map((url, index) => (
                    <div key={index} className='relative'>
                      <img
                        src={url}
                        alt={`Stain ${index + 1}`}
                        className='h-24 w-full rounded-lg border object-cover'
                      />
                      <Button
                        variant='destructive'
                        size='sm'
                        className='absolute -top-2 -right-2 h-6 w-6 rounded-full p-0'
                        onClick={() => handleRemoveImage(url)}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className='mt-2 text-xs text-gray-500'>
              <strong>Tip:</strong> Take clear, well-lit photos of each stain
              for best results
            </p>

            {/* Upload Button */}
            <Button
              onClick={triggerFileInput}
              variant='outline'
              className='mt-3 w-full'
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <UploadCloud className='mr-2 h-4 w-4 animate-pulse' />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className='mr-2 h-4 w-4' />
                  Add More Images
                </>
              )}
            </Button>
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

      {/* Access Notes */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Access Notes (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor='access-notes' className='mb-3 block text-sm'>
            Help your Washer find and access your location
          </Label>
          <Textarea
            id='access-notes'
            placeholder='e.g., Dial 123 on the intercom, flat is on the 2nd floor...'
            value={accessNotes}
            onChange={(e) => onAccessNotesChange(e.target.value)}
            className='min-h-[100px]'
          />
          <p className='mt-2 text-xs text-gray-500'>
            <strong>Examples:</strong> Intercom codes, apartment numbers,
            parking instructions, gate codes, etc.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
