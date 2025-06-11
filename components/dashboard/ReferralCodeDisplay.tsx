'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

export function ReferralCodeDisplay({ code }: { code: string | null }) {
  const [hasCopied, setHasCopied] = useState(false)

  const onCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setHasCopied(true)
      setTimeout(() => {
        setHasCopied(false)
      }, 2000)
    }
  }

  return (
    <div className='flex items-center space-x-2'>
      <div className='border-primary/50 flex-grow rounded-lg border-2 border-dashed bg-white p-3 text-center'>
        <p className='text-primary font-mono text-3xl tracking-widest'>
          {code || '...'}
        </p>
      </div>
      <Button
        size='icon'
        variant='outline'
        onClick={onCopy}
        disabled={!code || hasCopied}
      >
        {hasCopied ? (
          <Check className='h-5 w-5 text-green-600' />
        ) : (
          <Copy className='h-5 w-5' />
        )}
        <span className='sr-only'>Copy Code</span>
      </Button>
    </div>
  )
}
