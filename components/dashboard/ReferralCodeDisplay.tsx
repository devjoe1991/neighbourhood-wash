'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Share2, MessageCircle, Facebook, Twitter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ReferralCodeDisplayProps {
  code: string | null
}

export function ReferralCodeDisplay({ code }: ReferralCodeDisplayProps) {
  const [hasCopiedCode, setHasCopiedCode] = useState(false)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)

  const referralLink = code ? `${window.location.origin}/signup?ref=${code}` : ''
  
  const shareMessage = `Join me on Neighbourhood Wash and get 50% off your first laundry service! Use my referral code: ${code} or sign up directly: ${referralLink}`

  const onCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setHasCopiedCode(true)
      setTimeout(() => setHasCopiedCode(false), 2000)
    }
  }

  const onCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setHasCopiedLink(true)
      setTimeout(() => setHasCopiedLink(false), 2000)
    }
  }

  const shareToWhatsApp = () => {
    const encodedMessage = encodeURIComponent(shareMessage)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const shareToFacebook = () => {
    const encodedUrl = encodeURIComponent(referralLink)
    const encodedQuote = encodeURIComponent(`Join me on Neighbourhood Wash and get 50% off your first laundry service!`)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`, '_blank')
  }

  const shareToTwitter = () => {
    const encodedText = encodeURIComponent(`Join me on Neighbourhood Wash and get 50% off your first laundry service! 🧺✨`)
    const encodedUrl = encodeURIComponent(referralLink)
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank')
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Neighbourhood Wash',
          text: 'Get 50% off your first laundry service!',
          url: referralLink,
        })
      } catch (_error) {
        // Fallback to copy
        onCopyLink()
      }
    } else {
      onCopyLink()
    }
  }

  return (
    <div className="space-y-4">
      {/* Referral Code */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center mb-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2">Your Referral Code</h4>
            <div className='border-primary/50 rounded-lg border-2 border-dashed bg-primary/5 p-4'>
              <p className='text-primary font-mono text-3xl tracking-widest font-bold'>
                {code || '...'}
              </p>
            </div>
          </div>
          <Button
            onClick={onCopyCode}
            disabled={!code || hasCopiedCode}
            className="w-full"
            variant="outline"
          >
            {hasCopiedCode ? (
              <>
                <Check className='mr-2 h-4 w-4 text-green-600' />
                Code Copied!
              </>
            ) : (
              <>
                <Copy className='mr-2 h-4 w-4' />
                Copy Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Shareable Link */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center mb-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2">Your Referral Link</h4>
            <div className='rounded-lg border bg-gray-50 p-3'>
              <p className='text-xs text-gray-600 break-all font-mono'>
                {referralLink || 'Generating link...'}
              </p>
            </div>
          </div>
          <Button
            onClick={onCopyLink}
            disabled={!referralLink || hasCopiedLink}
            className="w-full"
            variant="outline"
          >
            {hasCopiedLink ? (
              <>
                <Check className='mr-2 h-4 w-4 text-green-600' />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className='mr-2 h-4 w-4' />
                Copy Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Share Options */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-sm text-gray-600 mb-3 text-center">Share with Friends</h4>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button 
              onClick={shareToWhatsApp} 
              disabled={!code}
              variant="outline" 
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <MessageCircle className='mr-2 h-4 w-4' />
              WhatsApp
            </Button>
            
            <Button 
              onClick={shareToFacebook} 
              disabled={!code}
              variant="outline" 
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Facebook className='mr-2 h-4 w-4' />
              Facebook
            </Button>
            
            <Button 
              onClick={shareToTwitter} 
              disabled={!code}
              variant="outline" 
              size="sm"
              className="text-sky-600 border-sky-200 hover:bg-sky-50"
            >
              <Twitter className='mr-2 h-4 w-4' />
              Twitter
            </Button>
            
            <Button 
              onClick={shareNative} 
              disabled={!code}
              variant="outline" 
              size="sm"
            >
              <Share2 className='mr-2 h-4 w-4' />
              More
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Share your code and both you and your friend will get rewards!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
