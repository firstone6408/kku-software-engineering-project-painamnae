<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">ประวัติการแจ้งตำแหน่ง</h2>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
                <!-- Loading -->
                <div v-if="loading" class="text-center py-8">
                    <div class="inline-block w-7 h-7 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p class="mt-2 text-sm text-gray-500">กำลังโหลดประวัติ...</p>
                </div>

                <!-- Empty -->
                <div v-else-if="sessions.length === 0" class="text-center py-12">
                    <svg class="w-14 h-14 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="text-base font-medium text-gray-600 mb-1">ยังไม่มีประวัติการแจ้งตำแหน่ง</h3>
                    <p class="text-sm text-gray-400">เมื่อคุณเริ่มแจ้งตำแหน่ง ประวัติจะแสดงที่นี่</p>
                </div>

                <!-- Session List -->
                <div v-else class="space-y-3">
                    <div v-for="session in sessions" :key="session.id"
                        class="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                        <!-- Row 1: Status + Date -->
                        <div class="flex items-center justify-between mb-2">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                :class="getStatusBadge(session.status)">
                                <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDot(session.status)"></span>
                                {{ getStatusLabel(session.status) }}
                            </span>
                            <span class="text-xs text-gray-400">{{ formatDate(session.createdAt) }}</span>
                        </div>

                        <!-- Row 2: Details Grid -->
                        <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                            <div>
                                <span class="text-gray-400 text-xs">ระยะเวลา</span>
                                <p class="font-medium text-gray-800">{{ session.durationMinutes }} นาที</p>
                            </div>
                            <div>
                                <span class="text-gray-400 text-xs">ความถี่</span>
                                <p class="font-medium text-gray-800">ทุก {{ session.intervalMinutes }} นาที</p>
                            </div>
                            <div class="col-span-2" v-if="session.lastAddress">
                                <span class="text-gray-400 text-xs">ตำแหน่งล่าสุด</span>
                                <p class="font-medium text-gray-800 text-xs leading-relaxed">
                                    📍 {{ session.lastAddress }}
                                </p>
                            </div>
                            <div class="col-span-2" v-if="session.lastLatitude && session.lastLongitude">
                                <a :href="`https://www.google.com/maps?q=${session.lastLatitude},${session.lastLongitude}`"
                                    target="_blank"
                                    class="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    ดูบน Google Maps
                                </a>
                            </div>
                        </div>

                        <!-- Row 3: Contacts -->
                        <div class="mt-2.5 pt-2.5 border-t border-gray-200">
                            <span class="text-xs text-gray-400 block mb-1.5">ผู้ติดต่อที่แจ้ง</span>
                            <div class="flex flex-wrap gap-1.5">
                                <span v-for="c in session.contacts" :key="c.id"
                                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {{ c.name }} <span class="text-blue-400 ml-1">({{ c.relationship }})</span>
                                </span>
                            </div>
                        </div>

                        <!-- Row 4: Time details -->
                        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span>เริ่ม: {{ formatTime(session.createdAt) }}</span>
                            <span v-if="session.stoppedAt">หยุด: {{ formatTime(session.stoppedAt) }}</span>
                            <span v-else-if="session.status !== 'ACTIVE'">หมดอายุ: {{ formatTime(session.expiresAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-end px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button @click="$emit('close')"
                    class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                    ปิด
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'

defineEmits(['close'])

const sessions = ref([])
const loading = ref(true)

const getStatusLabel = (status) => {
    switch (status) {
        case 'ACTIVE': return 'กำลังแจ้ง'
        case 'STOPPED': return 'หยุดเอง'
        case 'EXPIRED': return 'หมดอายุ'
        default: return status
    }
}

const getStatusBadge = (status) => {
    switch (status) {
        case 'ACTIVE': return 'bg-green-50 text-green-700'
        case 'STOPPED': return 'bg-orange-50 text-orange-700'
        case 'EXPIRED': return 'bg-gray-100 text-gray-600'
        default: return 'bg-gray-100 text-gray-600'
    }
}

const getStatusDot = (status) => {
    switch (status) {
        case 'ACTIVE': return 'bg-green-500'
        case 'STOPPED': return 'bg-orange-500'
        case 'EXPIRED': return 'bg-gray-400'
        default: return 'bg-gray-400'
    }
}

const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
    })
}

const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const fetchHistory = async () => {
    try {
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value
        const res = await $fetch('/location-sharing/history', {
            baseURL: apiBase,
            headers: {
                Accept: 'application/json',
                ...(tk ? { Authorization: `Bearer ${tk}` } : {})
            }
        })
        sessions.value = res.data || []
    } catch (e) {
        console.error('Failed to fetch history:', e)
    } finally {
        loading.value = false
    }
}

onMounted(fetchHistory)
</script>
