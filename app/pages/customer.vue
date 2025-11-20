<template>
  <UContainer class="py-8">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold text-primary-600">
          Welcome, {{ (user as any)?.name }}
        </h1>
        <p class="text-gray-600">Customer Dashboard</p>
      </template>

      <div class="space-y-6">
        <!-- Orders Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Your Orders</h2>
            <UButton @click="refresh" icon="i-heroicons-arrow-path" variant="outline" :loading="loading">
              Refresh
            </UButton>
          </div>

          <UTable
            v-if="customer"
            :data="customer.orders"
            :columns="orderColumns"
            :loading="loading"
            :empty-state="{
              icon: 'i-heroicons-shopping-bag',
              label: 'No orders yet.',
              description: 'Create your first smoothie order below!'
            }"
          />
        </div>

        <!-- Draft Order Section -->
        <div>
          <h2 class="text-xl font-semibold mb-4">Create New Order</h2>
          <p class="text-gray-600 mb-4">Check the ingredients you want:</p>

          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <USelect
                v-model="draftOrderIngredients"
                multiple
                :items="possibleIngredients"
                placeholder="Select ingredients..."
                class="capitalize"
              />
            </div>

            <div class="flex gap-2">
              <UButton @click="save" :loading="saving" variant="outline">
                Save Draft
              </UButton>
              <UButton @click="submit" :loading="submitting" color="primary">
                Submit Order
              </UButton>
            </div>
            <p class="text-sm text-gray-500">
              Note: You must save before submitting
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import type { CustomerWithOrders } from "../data"

// Auth is handled by global middleware

const { user } = useUserSession()
const customerId = computed(() => (user.value as any)?.email || '')

const customer = ref<CustomerWithOrders | null>(null)
const draftOrderIngredients = ref<string[]>([])
const possibleIngredients = ref<string[]>([])
const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)

const orderColumns: TableColumn<any>[] = [
  { accessorKey: '_id', header: 'Order ID' },
  { accessorKey: 'state', header: 'Status' },
  { accessorKey: 'ingredients', header: 'Ingredients' },
  { accessorKey: 'operatorId', header: 'Operator' }
]

async function refresh() {
  loading.value = true
  try {
    // Fetch possible ingredients
    possibleIngredients.value = await $fetch<string[]>("/api/possible-ingredients")

    // Fetch customer data
    customer.value = await $fetch<CustomerWithOrders>("/api/customer")

    // Fetch draft order
    const draftOrder = await $fetch("/api/customer/draft-order")
    draftOrderIngredients.value = draftOrder?.ingredients || []
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await $fetch("/api/customer/draft-order", {
      method: "PUT",
      body: { ingredients: draftOrderIngredients.value }
    })
  } catch (error) {
    console.error('Failed to save draft order:', error)
  } finally {
    saving.value = false
  }
}

async function submit() {
  submitting.value = true
  try {
    await $fetch("/api/customer/submit-draft-order", {
      method: "POST"
    })
    await refresh()
  } catch (error) {
    console.error('Failed to submit order:', error)
  } finally {
    submitting.value = false
  }
}

// Load data when user session is available
watch(() => user.value, (userData) => {
  if (userData) {
    refresh()
  }
}, { immediate: true })
</script>
