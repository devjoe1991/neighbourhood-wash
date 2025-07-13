'use client'

import { useState, useEffect } from 'react'
import {
  BookingSelection,
  itemCategories,
  ItemKey,
  AddOn,
  serviceConfig,
  weightTiers,
  WeightTier,
} from '@/lib/pricing'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Scale, List, Check } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const addOnColors: Record<
  AddOn,
  { bg: string; border: string; text: string; button: string }
> = {
  stain_removal: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    button: 'hover:bg-rose-100',
  },
  ironing: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    button: 'hover:bg-indigo-100',
  },
  own_products: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    button: 'hover:bg-green-100',
  },
}

interface ServiceStepProps {
  selection: BookingSelection
  onSelectionChange: (selection: BookingSelection) => void
  estimatedWeight: number
}

function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className='flex items-center gap-1'>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='h-8 w-8 rounded-full'
        onClick={onDecrease}
        disabled={quantity === 0}
      >
        <Minus className='h-4 w-4' />
      </Button>
      <span className='w-8 text-center font-bold'>{quantity}</span>
      <Button
        type='button'
        variant='outline'
        size='icon'
        className='h-8 w-8 rounded-full'
        onClick={onIncrease}
      >
        <Plus className='h-4 w-4' />
      </Button>
    </div>
  )
}

export default function ServiceStep({
  selection,
  onSelectionChange,
  estimatedWeight,
}: ServiceStepProps) {
  const [currentSelection, setCurrentSelection] = useState(selection)

  useEffect(() => {
    onSelectionChange(currentSelection)
  }, [currentSelection, onSelectionChange])

  const handleItemQuantityChange = (itemKey: ItemKey, newQuantity: number) => {
    const updatedItems = { ...currentSelection.selectedItems }
    if (newQuantity > 0) {
      updatedItems[itemKey] = newQuantity
    } else {
      delete updatedItems[itemKey]
    }
    setCurrentSelection({
      ...currentSelection,
      selectedItems: updatedItems,
      weightTier: null,
    })
  }

  const handleWeightTierSelect = (tier: WeightTier) => {
    setCurrentSelection({
      ...currentSelection,
      weightTier: tier,
      selectedItems: {},
    })
  }

  const handleAddOnToggle = (addOn: AddOn) => {
    const newAddOns = currentSelection.selectedAddOns.includes(addOn)
      ? currentSelection.selectedAddOns.filter((a) => a !== addOn)
      : [...currentSelection.selectedAddOns, addOn]
    setCurrentSelection({ ...currentSelection, selectedAddOns: newAddOns })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-end justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800'>Choose Services</h2>
          <p className='mt-1 text-gray-600'>
            Select items individually or choose a weight tier directly.
          </p>
        </div>
        <div className='rounded-xl bg-blue-50 p-3 text-center'>
          <p className='text-sm font-semibold text-blue-700'>
            Estimated Weight
          </p>
          <p className='text-xl font-bold text-blue-900'>
            {estimatedWeight.toFixed(2)} kg
          </p>
        </div>
      </div>

      <Tabs defaultValue='weight'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='weight'>
            <Scale className='mr-2 h-4 w-4' /> By Weight
          </TabsTrigger>
          <TabsTrigger value='items'>
            <List className='mr-2 h-4 w-4' /> By Item
          </TabsTrigger>
        </TabsList>

        <TabsContent value='items' className='mt-4'>
          <div className='space-y-4'>
            {Object.entries(itemCategories).map(([catKey, category]) => (
              <div key={catKey}>
                <h3 className='mb-2 text-lg font-semibold'>{category.name}</h3>
                <div className='space-y-2 rounded-md border p-3'>
                  {Object.entries(category.items).map(([itemKey, item]) => (
                    <div
                      key={itemKey}
                      className='flex items-center justify-between'
                    >
                      <div>
                        <p className='font-medium'>{item.name}</p>
                        <p className='text-xs text-gray-500'>
                          Approx. {item.weight} kg
                        </p>
                      </div>
                      <QuantitySelector
                        quantity={
                          currentSelection.selectedItems[itemKey as ItemKey] ||
                          0
                        }
                        onDecrease={() =>
                          handleItemQuantityChange(
                            itemKey as ItemKey,
                            (currentSelection.selectedItems[
                              itemKey as ItemKey
                            ] || 1) - 1
                          )
                        }
                        onIncrease={() =>
                          handleItemQuantityChange(
                            itemKey as ItemKey,
                            (currentSelection.selectedItems[
                              itemKey as ItemKey
                            ] || 0) + 1
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='weight' className='mt-4'>
          <div className='space-y-3'>
            {Object.entries(weightTiers).map(([key, tier]) => (
              <div
                key={key}
                onClick={() => handleWeightTierSelect(key as WeightTier)}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all',
                  currentSelection.weightTier === key
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                )}
              >
                <div>
                  <h4 className='font-semibold'>{tier.label}</h4>
                  <p className='text-sm text-gray-500'>
                    Up to {tier.maxWeight}kg of laundry
                  </p>
                </div>
                <p className='text-lg font-bold'>£{tier.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add-on Services */}
      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>Optional Add-ons</h3>
        <div className='space-y-2 rounded-lg border bg-gray-50/50 p-3'>
          {Object.entries(serviceConfig.addOns).map(([key, config]) => {
            const isSelected = currentSelection.selectedAddOns.includes(
              key as AddOn
            )
            const colors = addOnColors[key as AddOn]
            return (
              <div
                key={key}
                onClick={() => handleAddOnToggle(key as AddOn)}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-md border p-3 transition-all',
                  colors.bg,
                  isSelected ? 'ring-2 ring-blue-500' : colors.border
                )}
              >
                <div>
                  <p className={cn('font-medium', colors.text)}>
                    {config.label}
                  </p>
                </div>
                <Button
                  size='icon'
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddOnToggle(key as AddOn)
                  }}
                  className={cn(
                    'h-8 w-8 flex-shrink-0 rounded-full',
                    !isSelected && colors.bg,
                    !isSelected && colors.button
                  )}
                >
                  {isSelected ? (
                    <Check className='h-4 w-4' />
                  ) : (
                    <Plus className='h-4 w-4' />
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
