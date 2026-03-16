<template>
    <div v-if="token" class="relative">
        <button @click="$emit('open-modal')"
            class="relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'">
            <!-- Location Pin Icon -->
            <svg class="w-4 h-4" :class="{ 'animate-pulse text-red-500': isActive }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="hidden sm:inline">{{ isActive ? 'กำลังแจ้งตำแหน่ง' : 'แจ้งตำแหน่ง' }}</span>
            <!-- Active indicator dot -->
            <span v-if="isActive" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            <span v-if="isActive" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>
    </div>
</template>

<script setup>
import { useCookie } from '#app'
import { useLocationSharing } from '~/composables/useLocationSharing'

const token = useCookie('token')
const { isActive } = useLocationSharing()

defineEmits(['open-modal'])
</script>
