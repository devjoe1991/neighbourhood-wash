import type { AccessControlResult } from './access-control'

/**
 * Generate user-friendly access denied messages
 */
export function generateAccessDeniedMessage(result: AccessControlResult): {
    title: string
    description: string
    actionText: string
    actionPath: string
} {
    switch (result.reason) {
        case 'onboarding_incomplete':
            return {
                title: 'Setup Required',
                description: result.message || 'Complete your 4-step setup to unlock this feature',
                actionText: 'Complete Setup',
                actionPath: result.redirectPath || '/washer/dashboard'
            }

        case 'required_steps_incomplete':
            return {
                title: 'Additional Steps Required',
                description: result.message || 'Complete additional onboarding steps to access this feature',
                actionText: 'Continue Setup',
                actionPath: result.redirectPath || '/washer/dashboard'
            }

        case 'authentication_required':
            return {
                title: 'Sign In Required',
                description: 'Please sign in to access this feature',
                actionText: 'Sign In',
                actionPath: '/signin'
            }

        case 'not_washer':
            return {
                title: 'Washer Access Only',
                description: 'This feature is only available to registered washers',
                actionText: 'Become a Washer',
                actionPath: '/user/dashboard/become-washer'
            }

        case 'washer_not_approved':
            return {
                title: 'Application Pending',
                description: 'Your washer application is being reviewed',
                actionText: 'Check Status',
                actionPath: '/user/dashboard/become-washer'
            }

        default:
            return {
                title: 'Access Denied',
                description: result.message || 'You do not have access to this feature',
                actionText: 'Go to Dashboard',
                actionPath: result.redirectPath || '/washer/dashboard'
            }
    }
}