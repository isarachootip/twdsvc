'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import {
  matchProductTypeFromCommodity,
  type ProductTypeOption,
} from '@/lib/services/product-type-matcher'
import type { Commodity } from './product-types'

export function useProductTypes() {
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([])

  useEffect(() => {
    api<ProductTypeOption[]>('/api/product-types')
      .then(data => {
        if (Array.isArray(data)) setProductTypes(data)
      })
      .catch(() => {})
  }, [])

  const autoMatchProductType = useCallback(
    (commodity: Commodity): string | null =>
      matchProductTypeFromCommodity(
        {
          name: commodity.name,
          productType: commodity.productType,
          deptName: commodity.deptName,
          sdeptName: commodity.sdeptName,
          className: commodity.className,
          sclassName: commodity.sclassName,
        },
        productTypes
      ),
    [productTypes]
  )

  return { productTypes, autoMatchProductType }
}
