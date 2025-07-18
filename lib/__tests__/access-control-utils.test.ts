import { describe, it, expect } from 'vitest'
import { generateAccessDeniedMessage } from '../access-control-utils'
import type { AccessControlResult } from '../access-control'

describe('Access Control Utils', () => {
  describe('generateAccessDeniedMessage', () => {
    it('should generate message for onboarding_incomplete', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'onboarding_incomplete',
        message: 'Complete your 4-step setup to unlock this feature',
        redirectPath: '/washer/dashboard'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message).toEqual({
        title: 'Setup Required',
        description: 'Complete your 4-step setup to unlock this feature',
        actionText: 'Complete Setup',
        actionPath: '/washer/dashboard'
      })
    })

    it('should generate message for required_steps_incomplete', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'required_steps_incomplete',
        message: 'Complete additional onboarding steps to access this feature',
        redirectPath: '/washer/dashboard'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message).toEqual({
        title: 'Additional Steps Required',
        description: 'Complete additional onboarding steps to access this feature',
        actionText: 'Continue Setup',
        actionPath: '/washer/dashboard'
      })
    })

    it('should generate message for authentication_required', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'authentication_required'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message).toEqual({
        title: 'Sign In Required',
        description: 'Please sign in to access this feature',
        actionText: 'Sign In',
        actionPath: '/signin'
      })
    })

    it('should generate message for not_washer', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'not_washer'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message).toEqual({
        title: 'Washer Access Only',
        description: 'This feature is only available to registered washers',
        actionText: 'Become a Washer',
        actionPath: '/user/dashboard/become-washer'
      })
    })

    it('should generate message for washer_not_approved', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'washer_not_approved'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message).toEqual({
        title: 'Application Pending',
        description: 'Your washer application is being reviewed',
        actionText: 'Check Status',
        actionPath: '/user/dashboard/become-washer'
      })
    })

    it('should generate default message for unknown reason', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'unknown_reason' as any,
        message: 'Custom error message',
        redirectPath: '/custom/path'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message).toEqual({
        title: 'Access Denied',
        description: 'Custom error message',
        actionText: 'Go to Dashboard',
        actionPath: '/custom/path'
      })
    })

    it('should use default descriptions when message is not provided', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'onboarding_incomplete'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message).toEqual({
        title: 'Setup Required',
        description: 'Complete your 4-step setup to unlock this feature',
        actionText: 'Complete Setup',
        actionPath: '/washer/dashboard'
      })
    })

    it('should use default redirect paths when not provided', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'onboarding_incomplete'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message.actionPath).toBe('/washer/dashboard')
    })

    it('should handle custom redirect paths', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'onboarding_incomplete',
        redirectPath: '/custom/onboarding/path'
      }

      const message = generateAccessDeniedMessage(result)

      expect(message.actionPath).toBe('/custom/onboarding/path')
    })

    it('should handle empty message gracefully', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'onboarding_incomplete',
        message: ''
      }

      const message = generateAccessDeniedMessage(result)

      expect(message.description).toBe('Complete your 4-step setup to unlock this feature')
    })

    it('should handle null message gracefully', () => {
      const result: AccessControlResult = {
        canAccess: false,
        reason: 'onboarding_incomplete',
        message: null as any
      }

      const message = generateAccessDeniedMessage(result)

      expect(message.description).toBe('Complete your 4-step setup to unlock this feature')
    })
  })
})