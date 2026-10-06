'use client'

import { useProductMaster } from './useProductMaster'
import { ProductToolbar } from './ProductToolbar'
import { ProductTable } from './ProductTable'
import { ProductPagination } from './ProductPagination'
import { ProductDetailModal } from './ProductDetailModal'

export function ProductMasterView() {
  const {
    filters,
    searchInput,
    handleSearchChange,
    setBrand,
    setDept,
    setStatus,
    setPage,
    setLimit,
    resetFilters,
    data,
    meta,
    loading,
    selectedProduct,
    setSelectedProduct,
  } = useProductMaster()

  return (
    <div className="w-full">
      <ProductToolbar
        filters={filters}
        searchInput={searchInput}
        meta={meta}
        total={data.total}
        onSearchChange={handleSearchChange}
        onBrandChange={setBrand}
        onDeptChange={setDept}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />

      <ProductTable
        items={data.items}
        loading={loading}
        onSelect={setSelectedProduct}
      />

      <ProductPagination
        page={data.page}
        limit={data.limit}
        total={data.total}
        totalPages={data.totalPages}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
