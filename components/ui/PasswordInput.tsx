'use client'

import { useState, useRef, useEffect, ComponentPropsWithoutRef } from 'react'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Use a more generic type for props if InputProps is not exported
type PasswordInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>

export default function PasswordInput({
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const checkCapsLock = (
    event: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent
  ) => {
    if (typeof event.getModifierState === 'function') {
      setIsCapsLockOn(event.getModifierState('CapsLock'))
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    checkCapsLock(event)
    if (props.onKeyDown) {
      props.onKeyDown(event)
    }
  }

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    checkCapsLock(event)
    if (props.onKeyUp) {
      props.onKeyUp(event)
    }
  }

  useEffect(() => {
    const handleGlobalKeyUp = (event: KeyboardEvent) => {
      if (isCapsLockOn && typeof event.getModifierState === 'function') {
        if (!event.getModifierState('CapsLock')) {
          setIsCapsLockOn(false)
        }
      }
    }
    window.addEventListener('keyup', handleGlobalKeyUp)
    return () => {
      window.removeEventListener('keyup', handleGlobalKeyUp)
    }
  }, [isCapsLockOn])

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Caps Lock detection is primarily handled by keydown/keyup events.
    // Directly checking Caps Lock status on focus without a key event is not reliably supported across browsers.
    // The existing key event handlers will catch Caps Lock state upon first interaction.
    if (props.onFocus) {
      props.onFocus(event)
    }
  }

  return (
    <div className='relative w-full'>
      <Input
        type={showPassword ? 'text' : 'password'}
        {...props}
        ref={inputRef}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={handleFocus}
        className={`${className || ''} pr-12`}
      />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full p-0 hover:bg-gray-100'
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className='h-5 w-5 text-gray-500' />
        ) : (
          <Eye className='h-5 w-5 text-gray-500' />
        )}
      </Button>
      {isCapsLockOn && (
        <p className='mt-1.5 text-xs text-orange-500'>Caps Lock is ON</p>
      )}
    </div>
  )
}
