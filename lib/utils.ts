import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a random 4-digit PIN for booking verification
 * @returns A string containing a 4-digit number
 */
export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}
