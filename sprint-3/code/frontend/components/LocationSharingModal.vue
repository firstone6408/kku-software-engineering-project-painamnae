<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>
        <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full z-10">

            <!-- ======== STATE 1: เริ่มใหม่ ======== -->
            <template v-if="!isActive">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">แจ้งตำแหน่งฉุกเฉิน</h2>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="px-6 py-4 space-y-4">
                    <!-- Loading contacts -->
                    <div v-if="loadingContacts" class="text-center py-4">
                        <div class="inline-block w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>

                    <!-- No linked contacts -->
                    <div v-else-if="linkedContacts.length === 0" class="text-center py-4">
                        <p class="text-sm text-gray-500 mb-3">
                            {{ contacts.length === 0
                                ? 'คุณยังไม่มีผู้ติดต่อฉุกเฉิน'
                                : 'ผู้ติดต่อทั้งหมดยังไม่ได้เชื่อมต่อ LINE กรุณาให้ผู้ติดต่อเพิ่มเพื่อน LINE OA และพิมพ์รหัสเชื่อมต่อก่อน' }}
                        </p>
                        <NuxtLink to="/profile/emergency-contacts" @click="$emit('close')"
                            class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            {{ contacts.length === 0 ? 'เพิ่มผู้ติดต่อ →' : 'จัดการผู้ติดต่อ →' }}
                        </NuxtLink>
                    </div>

                    <template v-else>
                        <!-- เลือกผู้ติดต่อ (เฉพาะ LINKED) -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">เลือกผู้ติดต่อ</label>
                            <div class="space-y-2 max-h-40 overflow-y-auto">
                                <label v-for="c in linkedContacts" :key="c.id"
                                    class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                                    :class="{ 'bg-blue-50 border-blue-300': selectedContactIds.includes(c.id) }">
                                    <input type="checkbox" :value="c.id" v-model="selectedContactIds"
                                        class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900 truncate">{{ c.name }}</p>
                                        <p class="text-xs text-gray-500">{{ c.relationship }}</p>
                                    </div>
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        เชื่อมต่อแล้ว
                                    </span>
                                </label>
                            </div>
                        </div>

                        <!-- เลือกระยะเวลา -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ระยะเวลาการแจ้งตำแหน่ง</label>
                            <select v-model.number="durationMinutes"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                <option :value="5">5 นาที</option>
                                <option :value="10">10 นาที</option>
                                <option :value="15">15 นาที</option>
                                <option :value="30">30 นาที</option>
                                <option :value="45">45 นาที</option>
                            </select>
                        </div>

                        <!-- หมายเหตุ -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p class="text-xs text-blue-700">
                                📍 ระบบจะส่งตำแหน่งของคุณทาง LINE ทุก 1 นาที ให้ผู้ติดต่อที่เลือก
                                เป็นระยะเวลาตามที่กำหนด
                            </p>
                        </div>

                        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
                    </template>
                </div>

                <div v-if="linkedContacts.length > 0" class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button @click="$emit('close')"
                        class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        ยกเลิก
                    </button>
                    <button @click="handleStart" :disabled="starting || selectedContactIds.length === 0"
                        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ starting ? 'กำลังส่ง...' : 'ส่งและเริ่มแจ้งตำแหน่ง' }}
                    </button>
                </div>
            </template>

            <!-- ======== STATE 2: กำลัง Active ======== -->
            <template v-else>
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                        กำลังแจ้งตำแหน่ง
                    </h2>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="px-6 py-4 space-y-4">
                    <div class="space-y-3">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-500">ความถี่การส่ง</span>
                            <span class="font-medium text-gray-900">ทุก {{ activeSession?.intervalMinutes || 1 }} นาที</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-500">เวลาที่เหลือ</span>
                            <span class="font-semibold text-red-600 text-lg font-mono">{{ remainingText }}</span>
                        </div>
                        <div class="text-sm">
                            <span class="text-gray-500">ผู้ติดต่อที่เลือก</span>
                            <div class="mt-1 flex flex-wrap gap-2">
                                <span v-for="c in activeSession?.contacts || []" :key="c.id"
                                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {{ c.name }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p class="text-xs text-amber-700">
                            ⚠️ อย่าปิดหน้านี้ขณะแจ้งตำแหน่ง หากกดหยุด ระบบจะส่งข้อความแจ้งผู้ติดต่อว่าหยุดการแจ้งตำแหน่งแล้ว
                        </p>
                    </div>
                </div>

                <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button @click="$emit('close')"
                        class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        ปิด
                    </button>
                    <button @click="handleStop" :disabled="stopping"
                        class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                        {{ stopping ? 'กำลังหยุด...' : 'หยุดการแจ้งตำแหน่ง' }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'
import { useLocationSharing } from '~/composables/useLocationSharing'

const emit = defineEmits(['close'])

const { isActive, activeSession, remainingText, startSharing, stopSharing } = useLocationSharing()

const contacts = ref([])
const loadingContacts = ref(true)
const selectedContactIds = ref([])
const durationMinutes = ref(30)
const starting = ref(false)
const stopping = ref(false)
const error = ref('')

// เฉพาะ contacts ที่ LINKED เท่านั้น
const linkedContacts = computed(() =>
    contacts.value.filter(c => c.lineLinkStatus === 'LINKED' && c.lineUserId)
)

const fetchContacts = async () => {
    try {
        loadingContacts.value = true
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value
        const res = await $fetch('/emergency-contacts/me', {
            baseURL: apiBase,
            headers: {
                Accept: 'application/json',
                ...(tk ? { Authorization: `Bearer ${tk}` } : {})
            }
        })
        contacts.value = res.data || []
    } catch (e) {
        console.error(e)
    } finally {
        loadingContacts.value = false
    }
}

const handleStart = async () => {
    error.value = ''
    if (selectedContactIds.value.length === 0) {
        error.value = 'กรุณาเลือกผู้ติดต่ออย่างน้อย 1 คน'
        return
    }
    try {
        starting.value = true
        await startSharing(selectedContactIds.value, durationMinutes.value)
        emit('close')
    } catch (e) {
        console.error(e)
        error.value = e?.data?.message || e?.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'
    } finally {
        starting.value = false
    }
}

const handleStop = async () => {
    try {
        stopping.value = true
        await stopSharing()
        emit('close')
    } catch (e) {
        console.error(e)
    } finally {
        stopping.value = false
    }
}

onMounted(() => {
    if (!isActive.value) {
        fetchContacts()
    }
})
</script>
