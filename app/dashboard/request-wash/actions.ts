'use server'

interface WashRequestData {
  services: string[]
  needsCollection: boolean
  preferredDateTime: string
  specialInstructions: string
}

export async function submitWashRequest(formData: WashRequestData) {
  console.log('New wash request submitted:', formData)

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // In the future, this will trigger the washer matching algorithm.
  // For now, just return a success message
  return {
    success: true,
    message:
      "We are now finding a washer for you! You'll receive a notification once we've matched you with the perfect washer.",
  }
}
