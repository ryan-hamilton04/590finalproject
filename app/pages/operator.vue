<template>
  <UContainer class="py-8">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold text-info-600">
          Work Screen for {{ (user as any)?.name }}
        </h1>
        <p class="text-gray-600">Operator Dashboard</p>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Orders</h2>
          <UButton @click="refresh" icon="i-heroicons-arrow-path" variant="outline" :loading="loading">
            Refresh
          </UButton>
        </div>

        <UTable
          :data="orders"
          :columns="columns"
          :loading="loading"
          :empty-state="{
            icon: 'i-heroicons-clipboard-document-list',
            label: 'No orders to process.',
            description: 'Orders will appear here when customers place them.'
          }"
        >
          <template #operatorId-cell="{ row: { original }}">
            <div class="flex items-center gap-2">
              <span v-if="original.operatorId">
                {{ original.operatorId }}
              </span>
              <span v-else class="text-gray-400">
                Unassigned
              </span>

              <!-- Action buttons -->
              <UButton
                v-if="!original.operatorId"
                @click="updateOrder(original._id, 'blending')"
                size="xs"
                color="primary"
                :loading="updatingOrders.has(original._id)"
              >
                Start Blending
              </UButton>

              <UButton
                v-else-if="original.operatorId === operatorId && original.state !== 'done'"
                @click="updateOrder(original._id, 'done')"
                size="xs"
                color="success"
                :loading="updatingOrders.has(original._id)"
              >
                Mark Done
              </UButton>
            </div>
          </template>

          <template #state-cell="{ row: { original }}">
            <UBadge
              :color="getStateColor(original.state)"
              variant="subtle"
            >
              {{ original.state }}
            </UBadge>
          </template>

          <template #ingredients-cell="{ row: { original }}">
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="ingredient in original.ingredients"
                :key="ingredient"
                size="xs"
                variant="outline"
              >
                {{ ingredient }}
              </UBadge>
            </div>
          </template>
        </UTable>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import type { Operator, Order } from "../data"

// Auth is handled by global middleware

const { user } = useUserSession()

// Check if user has operator role
if (!(user.value as any)?.roles?.includes('operator')) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. Operator role required.'
  })
}

const operatorId = computed(() => (user.value as any)?.email || '')

const operator = ref<Operator | null>(null)
const orders = ref<Order[]>([])
const loading = ref(false)
const updatingOrders = ref(new Set<string>())

const columns: TableColumn<any>[] = [
  { accessorKey: '_id', header: 'Order ID' },
  { accessorKey: 'customerId', header: 'Customer' },
  { accessorKey: 'state', header: 'Status' },
  { accessorKey: 'ingredients', header: 'Ingredients' },
  { accessorKey: 'operatorId', header: 'Operator' },
]

function getStateColor(state: string) {
  switch (state) {
    case 'queued': return 'warning'
    case 'blending': return 'info'
    case 'done': return 'success'
    default: return 'neutral'
  }
}

async function refresh() {
  loading.value = true
  try {
    // Fetch operator data
    operator.value = await $fetch<Operator>("/api/operator")

    // Fetch all orders
    orders.value = await $fetch<Order[]>("/api/orders")
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

async function updateOrder(orderId: string, state: string) {
  if (!operatorId.value) return

  updatingOrders.value.add(orderId)
  try {
    await $fetch(`/api/order/${encodeURIComponent(orderId)}`, {
      method: "PUT",
      body: {
        operatorId: operatorId.value,
        state: state,
      }
    })
    await refresh()
  } catch (error) {
    console.error('Failed to update order:', error)
  } finally {
    updatingOrders.value.delete(orderId)
  }
}

// Load data when user session is available
watch(() => user.value, (userData) => {
  if (userData) {
    refresh()
  }
}, { immediate: true })
</script>
