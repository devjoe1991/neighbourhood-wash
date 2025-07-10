export const weightTiers = {
  '0-6kg': {
    label: 'Standard Wash (up to 6kg)',
    price: 18.0,
    maxWeight: 6,
  },
  '6-10kg': {
    label: 'Large Wash (6-10kg)',
    price: 25.0,
    maxWeight: 10,
  },
}

export const itemCategories = {
  tops: {
    name: 'Tops',
    items: {
      t_shirt: { name: 'T-Shirt / Top', weight: 0.2 },
      shirt: { name: 'Shirt', weight: 0.25 },
      polo_shirt: { name: 'Polo Shirt', weight: 0.25 },
      jumper: { name: 'Jumper / Sweater', weight: 0.4 },
      hoodie: { name: 'Hoodie', weight: 0.6 },
    },
  },
  bottoms: {
    name: 'Bottoms',
    items: {
      trousers: { name: 'Trousers / Chinos', weight: 0.5 },
      jeans: { name: 'Jeans', weight: 0.7 },
      shorts: { name: 'Shorts', weight: 0.3 },
      tracksuit_bottoms: { name: 'Tracksuit Bottoms', weight: 0.4 },
    },
  },
  bedding: {
    name: 'Bedding',
    items: {
      duvet_cover_single: { name: 'Duvet Cover (Single)', weight: 0.8 },
      duvet_cover_double: { name: 'Duvet Cover (Double)', weight: 1.2 },
      bed_sheet: { name: 'Bed Sheet', weight: 0.6 },
      pillowcase: { name: 'Pillowcase', weight: 0.2 },
    },
  },
  homeware: {
    name: 'Towels & Homeware',
    items: {
      bath_towel: { name: 'Bath Towel', weight: 0.7 },
      hand_towel: { name: 'Hand Towel', weight: 0.3 },
      bath_mat: { name: 'Bath Mat', weight: 0.5 },
      tea_towel: { name: 'Tea Towel', weight: 0.1 },
    },
  },
  outerwear: {
    name: 'Outerwear',
    items: {
      coat: { name: 'Coat', weight: 1.8 },
    },
  },
  formalwear: {
    name: 'Formal & Business Wear',
    items: {
      suit_jacket: { name: 'Suit Jacket / Blazer', weight: 1.1 },
      suit_trousers: { name: 'Suit Trousers', weight: 0.5 },
      waistcoat: { name: 'Waistcoat', weight: 0.3 },
    },
  },
}

export const serviceConfig = {
  addOns: {
    stain_removal: { label: 'Stain Removal Treatment', price: 5.0 },
    ironing: { label: 'Ironing Service', price: 12.5 },
    own_products: { label: 'User supplies own products', price: -1.5 }, // A discount
  },
  weCollectFee: 4.99,
}

export type WeightTier = keyof typeof weightTiers
export type AddOn = keyof typeof serviceConfig.addOns
export type ItemCategory = keyof typeof itemCategories
export type ItemKey = {
  [C in ItemCategory]: keyof (typeof itemCategories)[C]['items']
}[ItemCategory]

export interface BookingSelection {
  weightTier: WeightTier | null
  selectedItems: { [key in ItemKey]?: number }
  selectedAddOns: AddOn[]
  date: Date | null
  timeSlot: string | null
  deliveryMethod: 'collection' | 'drop-off'
}

export const timeSlots = [
  '9:00 AM - 12:00 PM',
  '1:00 PM - 4:00 PM',
  '5:00 PM - 8:00 PM',
]

export const getAllItems = () => {
  let allItems: { [key: string]: { name: string; weight: number } } = {}
  for (const category of Object.values(itemCategories)) {
    allItems = { ...allItems, ...category.items }
  }
  return allItems
}

export const calculateTotalWeight = (
  selectedItems: BookingSelection['selectedItems']
): number => {
  let totalWeight = 0
  const allItems = getAllItems()

  for (const [itemKey, quantity] of Object.entries(selectedItems)) {
    if (allItems[itemKey] && quantity) {
      totalWeight += allItems[itemKey].weight * quantity
    }
  }
  return totalWeight
}

export const determineWeightTier = (totalWeight: number): WeightTier | null => {
  if (totalWeight === 0) return null
  if (totalWeight <= weightTiers['0-6kg'].maxWeight) return '0-6kg'
  if (totalWeight <= weightTiers['6-10kg'].maxWeight) return '6-10kg'
  // Add more tiers here if needed in the future
  return '6-10kg' // Default to largest tier if overweight
}

export const calculateTotal = (selection: BookingSelection): number => {
  let total = 0
  let hasServices = false

  if (selection.weightTier) {
    total += weightTiers[selection.weightTier].price
    hasServices = true
  }

  selection.selectedAddOns.forEach((addOn) => {
    total += serviceConfig.addOns[addOn].price
  })

  // Collection fee - only add if services are selected and method is collection
  if (hasServices && selection.deliveryMethod === 'collection') {
    total += serviceConfig.weCollectFee
  }

  return Math.max(0, total) // Ensure total is never negative
}

export const getItemizedBreakdown = (selection: BookingSelection) => {
  const items: Array<{
    label: string
    price: number | null
    isSubItem?: boolean
  }> = []
  const allItems = getAllItems()

  if (selection.weightTier) {
    items.push({
      label: weightTiers[selection.weightTier].label,
      price: weightTiers[selection.weightTier].price,
    })

    // Add selected items as sub-items for clarity
    Object.entries(selection.selectedItems).forEach(([key, quantity]) => {
      if (quantity && quantity > 0) {
        const itemDetails = allItems[key]
        if (itemDetails) {
          items.push({
            label: `${quantity} x ${itemDetails.name}`,
            price: null, // Price is included in the tier
            isSubItem: true,
          })
        }
      }
    })
  }

  selection.selectedAddOns.forEach((addOn) => {
    items.push({
      label: serviceConfig.addOns[addOn].label,
      price: serviceConfig.addOns[addOn].price,
    })
  })

  // Collection fee - only add if services are selected and method is collection
  if (selection.weightTier && selection.deliveryMethod === 'collection') {
    items.push({
      label: 'We Collect Fee',
      price: serviceConfig.weCollectFee,
    })
  }

  return items
}
