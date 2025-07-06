export const serviceConfig = {
  baseWashDry: {
    '0-6kg': { label: 'Standard Wash (up to 6kg)', price: 18.0 },
    '6-10kg': { label: 'Large Wash (6-10kg)', price: 25.0 },
  },
  specialItems: {
    duvet_double: { label: 'Double Duvet', price: 20.0 },
    duvet_single: { label: 'Single Duvet', price: 15.0 },
    bed_sheets: { label: 'Bed Sheet Set', price: 8.0 },
    pillows: { label: 'Pillows (pair)', price: 6.0 },
    curtains: { label: 'Curtains', price: 12.0 },
  },
  addOns: {
    stain_removal: { label: 'Stain Removal Treatment', price: 5.0 },
    ironing: { label: 'Ironing Service', price: 12.5 },
    own_products: { label: 'User supplies own products', price: -1.5 }, // A discount
  },
  collectionFee: 4.99,
}

export type WeightTier = keyof typeof serviceConfig.baseWashDry
export type SpecialItem = keyof typeof serviceConfig.specialItems
export type AddOn = keyof typeof serviceConfig.addOns

export interface BookingSelection {
  weightTier: WeightTier | null
  selectedItems: SpecialItem[]
  selectedAddOns: AddOn[]
  date: Date | null
  timeSlot: string | null
}

export const timeSlots = [
  '9:00 AM - 12:00 PM',
  '1:00 PM - 4:00 PM',
  '5:00 PM - 8:00 PM',
]

export const calculateTotal = (selection: BookingSelection): number => {
  let total = 0
  let hasServices = false

  // Base wash & dry price
  if (selection.weightTier) {
    total += serviceConfig.baseWashDry[selection.weightTier].price
    hasServices = true
  }

  // Special items
  selection.selectedItems.forEach((item) => {
    total += serviceConfig.specialItems[item].price
    hasServices = true
  })

  // Add-ons
  selection.selectedAddOns.forEach((addOn) => {
    total += serviceConfig.addOns[addOn].price
    hasServices = true
  })

  // Collection fee - only add if services are selected
  if (hasServices) {
    total += serviceConfig.collectionFee
  }

  return Math.max(0, total) // Ensure total is never negative
}

export const getItemizedBreakdown = (selection: BookingSelection) => {
  const items = []
  let hasServices = false

  // Base wash & dry
  if (selection.weightTier) {
    items.push({
      label: serviceConfig.baseWashDry[selection.weightTier].label,
      price: serviceConfig.baseWashDry[selection.weightTier].price,
    })
    hasServices = true
  }

  // Special items
  selection.selectedItems.forEach((item) => {
    items.push({
      label: serviceConfig.specialItems[item].label,
      price: serviceConfig.specialItems[item].price,
    })
    hasServices = true
  })

  // Add-ons
  selection.selectedAddOns.forEach((addOn) => {
    items.push({
      label: serviceConfig.addOns[addOn].label,
      price: serviceConfig.addOns[addOn].price,
    })
    hasServices = true
  })

  // Collection fee - only add if services are selected
  if (hasServices) {
    items.push({
      label: 'Collection & Delivery',
      price: serviceConfig.collectionFee,
    })
  }

  return items
}
