import { createClient } from '@/utils/supabase/client'

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

export async function uploadBookingImages(
  files: File[],
  userId: string,
  onProgress?: (progress: UploadProgress[]) => void
): Promise<string[]> {
  const supabase = createClient()
  const uploadedUrls: string[] = []
  const progressArray: UploadProgress[] = files.map((file) => ({
    fileName: file.name,
    progress: 0,
    status: 'uploading' as const,
  }))

  if (onProgress) {
    onProgress([...progressArray])
  }

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      try {
        // Upload file to Supabase Storage
        const { error } = await supabase.storage
          .from('booking_images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) {
          throw error
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('booking_images')
          .getPublicUrl(fileName)

        if (publicUrlData.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl)
          progressArray[i] = {
            fileName: file.name,
            progress: 100,
            status: 'success',
            url: publicUrlData.publicUrl,
          }
        } else {
          throw new Error('Failed to get public URL')
        }
      } catch (error) {
        progressArray[i] = {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        }
      }

      if (onProgress) {
        onProgress([...progressArray])
      }
    }

    return uploadedUrls
  } catch (error) {
    console.error('Error uploading images:', error)
    throw error
  }
}
