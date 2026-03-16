<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto z-10">
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
                <h2 class="text-base font-semibold text-gray-900">เชื่อมต่อ LINE</h2>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="px-5 py-4 space-y-4">
                <!-- ชื่อผู้ติดต่อ -->
                <div class="text-center">
                    <p class="text-xs text-gray-500">ผู้ติดต่อ</p>
                    <p class="text-base font-semibold text-gray-900">{{ contact?.name }}</p>
                </div>

                <!-- QR Code -->
                <div class="text-center">
                    <p class="text-xs font-medium text-gray-700 mb-2">ขั้นตอนที่ 1: สแกน QR Code เพิ่มเพื่อน LINE OA</p>
                    <div class="inline-block p-2 bg-white border-2 border-gray-200 rounded-lg">
                        <img :src="qrCodeUrl" alt="QR Code LINE OA" class="w-36 h-36 sm:w-40 sm:h-40 mx-auto">
                    </div>
                    <p class="text-xs text-gray-400 mt-1">หรือเพิ่มเพื่อนด้วย ID: <span class="font-mono font-semibold">@704bapik</span></p>
                </div>

                <!-- Token -->
                <div class="text-center">
                    <p class="text-xs font-medium text-gray-700 mb-1.5">ขั้นตอนที่ 2: พิมพ์รหัสนี้ส่งในแชท LINE</p>
                    <div class="inline-flex items-center px-5 py-2.5 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <span class="text-2xl font-bold tracking-[0.25em] text-blue-700 font-mono">{{ contact?.lineLinkToken }}</span>
                    </div>
                </div>

                <!-- สถานะ -->
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="w-2 h-2 rounded-full" :class="statusColor"></span>
                        <span class="text-xs font-medium" :class="statusTextColor">{{ statusText }}</span>
                    </div>
                    <p class="text-xs text-gray-500">
                        เมื่อผู้ติดต่อเพิ่มเพื่อนและพิมพ์รหัสสำเร็จ สถานะจะเปลี่ยนเป็น "เชื่อมต่อแล้ว"
                    </p>
                </div>
            </div>

            <div class="flex justify-end px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl sticky bottom-0">
                <button @click="$emit('close')"
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    เข้าใจแล้ว
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    contact: { type: Object, required: true }
})

defineEmits(['close'])

const LINE_OA_URL = 'https://line.me/R/ti/p/@704bapik'

const qrCodeUrl = computed(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(LINE_OA_URL)}`
})

const statusText = computed(() => {
    switch (props.contact?.lineLinkStatus) {
        case 'LINKED': return 'เชื่อมต่อแล้ว'
        case 'UNLINKED': return 'ถูกลบออก — กรุณาให้ผู้ติดต่อ add เพื่อนใหม่'
        default: return 'รอเชื่อมต่อ'
    }
})

const statusColor = computed(() => {
    switch (props.contact?.lineLinkStatus) {
        case 'LINKED': return 'bg-green-500'
        case 'UNLINKED': return 'bg-red-500'
        default: return 'bg-yellow-400'
    }
})

const statusTextColor = computed(() => {
    switch (props.contact?.lineLinkStatus) {
        case 'LINKED': return 'text-green-700'
        case 'UNLINKED': return 'text-red-600'
        default: return 'text-yellow-700'
    }
})
</script>
