'use client'

import { useState, useEffect, FormEvent } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { BellIcon, Loader2Icon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface NotificationSettingsFormProps {
  userId: string
  initialPrefs: { email_all?: boolean } | null | undefined
}

export default function NotificationSettingsForm({
  userId,
  initialPrefs,
}: NotificationSettingsFormProps) {
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setEmailNotifications(initialPrefs?.email_all || false)
  }, [initialPrefs])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('User ID not available')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: { email_all: emailNotifications },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating notification preferences:', error)
        toast.error('Failed to update notification preferences')
      } else {
        toast.success('Notification preferences updated successfully!')
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <BellIcon className='mr-2 h-5 w-5 text-blue-600' /> Notification
          Preferences
        </CardTitle>
        <CardDescription>
          Choose how you receive updates and alerts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='emailNotifications'
              checked={emailNotifications}
              onCheckedChange={(checked: boolean | 'indeterminate') => {
                if (typeof checked === 'boolean') {
                  setEmailNotifications(checked)
                }
              }}
            />
            <Label htmlFor='emailNotifications' className='font-normal'>
              Opt-in to all email notifications (booking updates, promotions,
              news)
            </Label>
          </div>
          <Button type='submit' className='w-full sm:w-auto' disabled={saving}>
            {saving ? (
              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {saving ? 'Saving...' : 'Save Notification Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
