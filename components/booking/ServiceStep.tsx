'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HelpCircle, Scale, Shirt, Sparkles, Zap } from 'lucide-react'
import { WeightTier, SpecialItem, AddOn, serviceConfig } from '@/lib/pricing'

interface ServiceStepProps {
  weightTier: WeightTier | null
  selectedItems: SpecialItem[]
  selectedAddOns: AddOn[]
  onWeightTierChange: (tier: WeightTier) => void
  onItemsChange: (items: SpecialItem[]) => void
  onAddOnsChange: (addOns: AddOn[]) => void
}

export default function ServiceStep({
  weightTier,
  selectedItems,
  selectedAddOns,
  onWeightTierChange,
  onItemsChange,
  onAddOnsChange,
}: ServiceStepProps) {
  const handleItemToggle = (item: SpecialItem, checked: boolean) => {
    if (checked) {
      onItemsChange([...selectedItems, item])
    } else {
      onItemsChange(selectedItems.filter((i) => i !== item))
    }
  }

  const handleAddOnToggle = (addOn: AddOn, checked: boolean) => {
    if (checked) {
      onAddOnsChange([...selectedAddOns, addOn])
    } else {
      onAddOnsChange(selectedAddOns.filter((a) => a !== addOn))
    }
  }

  // Filter out own_products from add-ons to display separately
  const regularAddOns = Object.entries(serviceConfig.addOns).filter(
    ([key]) => key !== 'own_products'
  )

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='mb-2 text-lg font-semibold'>Choose Your Services</h3>
        <p className='mb-4 text-gray-600'>
          Select the services you need and see the price update in real-time.
        </p>
      </div>

      {/* Washing Products */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5' />
            Washing Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='own_products'
              checked={selectedAddOns.includes('own_products')}
              onCheckedChange={(checked) =>
                handleAddOnToggle('own_products', checked as boolean)
              }
            />
            <Label htmlFor='own_products' className='flex-1 cursor-pointer'>
              <div className='flex items-center justify-between'>
                <span>I will supply my own products</span>
                <span className='font-medium text-green-600'>
                  -£
                  {Math.abs(serviceConfig.addOns.own_products.price).toFixed(2)}
                </span>
              </div>
            </Label>
          </div>
          <p className='mt-2 text-sm text-gray-600'>
            Save money by providing your own detergent and fabric softener
          </p>
        </CardContent>
      </Card>

      {/* Weight Selection */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Scale className='h-5 w-5' />
            Wash & Dry (by Weight)
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='ghost' size='sm' className='ml-2'>
                  <HelpCircle className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle>How much does my laundry weigh?</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <h4 className='font-medium'>6kg Load Examples:</h4>
                    <ul className='space-y-1 text-sm text-gray-600'>
                      <li>
                        • 5 complete outfits (shirt, trousers, underwear, socks)
                      </li>
                      <li>• 1 full set of double bedding</li>
                      <li>
                        • 2 pairs of jeans, 5 t-shirts, underwear for a week, 2
                        towels
                      </li>
                      <li>
                        • 1 hoodie, 3 shirts, 2 pairs of trousers, 7 pairs of
                        socks
                      </li>
                    </ul>
                  </div>
                  <div className='space-y-2'>
                    <h4 className='font-medium'>10kg Load Examples:</h4>
                    <ul className='space-y-1 text-sm text-gray-600'>
                      <li>• 8-10 complete outfits</li>
                      <li>• 2 full sets of bedding</li>
                      <li>• 1 week's worth of clothes for 2 people</li>
                      <li>
                        • 3-4 towels, 5 shirts, 3 pairs of jeans, underwear
                      </li>
                    </ul>
                  </div>
                  <div className='rounded-md bg-blue-50 p-3'>
                    <p className='text-sm text-blue-700'>
                      <strong>Tip:</strong> If you're unsure, it's better to
                      select the higher weight option. Our Washers can handle
                      mixed loads efficiently.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={weightTier || ''}
            onValueChange={onWeightTierChange}
          >
            {Object.entries(serviceConfig.baseWashDry).map(([key, config]) => (
              <div key={key} className='flex items-center space-x-2'>
                <RadioGroupItem value={key} id={key} />
                <Label htmlFor={key} className='flex-1 cursor-pointer'>
                  <div className='flex items-center justify-between'>
                    <span>{config.label}</span>
                    <span className='font-medium text-blue-600'>
                      £{config.price.toFixed(2)}
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Special Items */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shirt className='h-5 w-5' />
            Bulky Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4 text-sm text-gray-600'>
            Add individual items that need special handling
          </p>
          <div className='space-y-3'>
            {Object.entries(serviceConfig.specialItems).map(([key, config]) => (
              <div key={key} className='flex items-center space-x-2'>
                <Checkbox
                  id={key}
                  checked={selectedItems.includes(key as SpecialItem)}
                  onCheckedChange={(checked) =>
                    handleItemToggle(key as SpecialItem, checked as boolean)
                  }
                />
                <Label htmlFor={key} className='flex-1 cursor-pointer'>
                  <div className='flex items-center justify-between'>
                    <span>{config.label}</span>
                    <span className='font-medium text-blue-600'>
                      £{config.price.toFixed(2)}
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add-on Services */}
      {regularAddOns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5' />
              Add-on Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {regularAddOns.map(([key, config]) => (
                <div key={key} className='flex items-center space-x-2'>
                  <Checkbox
                    id={key}
                    checked={selectedAddOns.includes(key as AddOn)}
                    onCheckedChange={(checked) =>
                      handleAddOnToggle(key as AddOn, checked as boolean)
                    }
                  />
                  <Label htmlFor={key} className='flex-1 cursor-pointer'>
                    <div className='flex items-center justify-between'>
                      <span>{config.label}</span>
                      <span className='font-medium text-blue-600'>
                        £{config.price.toFixed(2)}
                      </span>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
