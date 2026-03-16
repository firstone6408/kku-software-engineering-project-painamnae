<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.locale('th')
dayjs.extend(buddhistEra)

defineProps({
    report: { type: Object, default: null },
})

const lightboxUrl = ref('')

function openMedia(url) {
    lightboxUrl.value = url
}

function initials(user) {
    if (!user) return '?'
    const f = (user.firstName || '')[0] || ''
    const l = (user.lastName || '')[0] || ''
    return (f + l).toUpperCase() || '?'
}

function roleBgColor(role) {
    if (role === 'DRIVER') return 'bg-blue-500'
    if (role === 'ADMIN') return 'bg-purple-500'
    return 'bg-orange-400'
}

function roleBadge(role) {
    if (role === 'DRIVER') return 'bg-blue-100 text-blue-700'
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-700'
    return 'bg-orange-100 text-orange-700'
}

function roleLabel(role) {
    if (role === 'DRIVER') return 'คนขับ'
    if (role === 'ADMIN') return 'แอดมิน'
    return 'ผู้โดยสาร'
}

const REASON_LABELS = {
    FAST_DRIVING: 'ขับรถเร็วเกินไป',
    RUDE_BEHAVIOR: 'พฤติกรรมไม่เหมาะสม',
    RECKLESS_DRIVING: 'ขับรถประมาท',
    UNSAFE_DRIVING: 'ขับรถไม่ปลอดภัย',
    INAPPROPRIATE_CONDUCT: 'ประพฤติไม่เหมาะสม',
    ACCIDENT: 'อุบัติเหตุ',
    PASSENGER_MISCONDUCT: 'ผู้โดยสารไม่เหมาะสม',
    PASSENGER_NO_SHOW: 'ผู้โดยสารมาสาย',
    PASSENGER_RUDE: 'ผู้โดยสารหยาบคาย',
    DAMAGE_TO_VEHICLE: 'ทำลายทรัพย์สินรถ',
    OTHER: 'อื่นๆ',
}

function reasonLabel(reason) {
    const r = reason.passengerReason || reason.driverReason || ''
    return REASON_LABELS[r] || r
}

function formatDate(iso) {
    if (!iso) return '-'
    return dayjs(iso).format('D MMMM BBBB HH:mm')
}
</script>

<template>
    <div v-if="report" class="space-y-6">
        <!-- Trip & People Info -->
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-800">
                    <i class="mr-2 text-blue-500 fas fa-info-circle"></i>
                    ข้อมูลการเดินทางและผู้ที่เกี่ยวข้อง
                </h2>
            </div>
            <div class="px-6 py-5 space-y-4">
                <!-- Trip Info -->
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <span class="text-xs font-medium text-gray-500 uppercase">Booking ID</span>
                        <p class="mt-1 text-sm font-mono text-gray-800">{{ report.booking?.id || '-' }}</p>
                    </div>
                    <div>
                        <span class="text-xs font-medium text-gray-500 uppercase">เส้นทาง</span>
                        <p class="mt-1 text-sm text-gray-800">
                            {{ report.booking?.route?.startLocation?.name || '-' }}
                            <span class="mx-1 text-gray-400">→</span>
                            {{ report.booking?.route?.endLocation?.name || '-' }}
                        </p>
                    </div>
                    <div>
                        <span class="text-xs font-medium text-gray-500 uppercase">วันเดินทาง</span>
                        <p class="mt-1 text-sm text-gray-800">{{ formatDate(report.booking?.route?.departureTime) }}</p>
                    </div>
                    <div v-if="report.type === 'PASSENGER_REPORT_DRIVER'">
                        <span class="text-xs font-medium text-gray-500 uppercase">ประเภทรายงาน</span>
                        <p class="mt-1 text-sm text-gray-800">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                <i class="fas fa-user"></i> ผู้โดยสารแจ้งคนขับ
                            </span>
                        </p>
                    </div>
                    <div v-else>
                        <span class="text-xs font-medium text-gray-500 uppercase">ประเภทรายงาน</span>
                        <p class="mt-1 text-sm text-gray-800">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                <i class="fas fa-car"></i> คนขับแจ้งเหตุการณ์
                            </span>
                        </p>
                    </div>
                </div>

                <hr class="border-gray-100" />

                <!-- Reporter -->
                <div>
                    <span class="text-xs font-medium text-gray-500 uppercase">ผู้แจ้ง (REPORTER)</span>
                    <div class="flex items-center gap-3 mt-2">
                        <div class="flex items-center justify-center w-10 h-10 text-white text-sm font-semibold rounded-full"
                            :class="roleBgColor(report.reporter?.role)">
                            {{ initials(report.reporter) }}
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">
                                {{ report.reporter?.firstName }} {{ report.reporter?.lastName }}
                            </div>
                            <div class="text-xs text-gray-500">{{ report.reporter?.email }}</div>
                            <div v-if="report.reporter?.phoneNumber" class="text-xs text-gray-500">
                                <i class="fas fa-phone mr-1"></i>{{ report.reporter.phoneNumber }}
                            </div>
                            <span class="inline-block px-2 py-0.5 text-xs rounded-full mt-0.5"
                                :class="roleBadge(report.reporter?.role)">
                                {{ roleLabel(report.reporter?.role) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Reported User -->
                <div v-if="report.reportedUser">
                    <span class="text-xs font-medium text-gray-500 uppercase">ผู้ถูกแจ้ง (REPORTED USER)</span>
                    <div class="flex items-center gap-3 mt-2">
                        <div class="flex items-center justify-center w-10 h-10 text-white text-sm font-semibold rounded-full"
                            :class="roleBgColor(report.reportedUser?.role)">
                            {{ initials(report.reportedUser) }}
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">
                                {{ report.reportedUser?.firstName }} {{ report.reportedUser?.lastName }}
                            </div>
                            <div class="text-xs text-gray-500">{{ report.reportedUser?.email }}</div>
                            <div v-if="report.reportedUser?.phoneNumber" class="text-xs text-gray-500">
                                <i class="fas fa-phone mr-1"></i>{{ report.reportedUser.phoneNumber }}
                            </div>
                            <span class="inline-block px-2 py-0.5 text-xs rounded-full mt-0.5"
                                :class="roleBadge(report.reportedUser?.role)">
                                {{ roleLabel(report.reportedUser?.role) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Problem Details -->
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-800">
                    <i class="mr-2 text-red-500 fas fa-exclamation-triangle"></i>
                    รายละเอียดปัญหา
                </h2>
            </div>
            <div class="px-6 py-5 space-y-4">
                <div>
                    <span class="text-xs font-medium text-gray-500 uppercase">หัวข้อการรายงาน</span>
                    <div class="flex flex-wrap gap-2 mt-2">
                        <span v-for="reason in report.reasons" :key="reason.id"
                            class="inline-block px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                            {{ reasonLabel(reason) }}
                        </span>
                    </div>
                </div>
                <div v-if="report.otherReasonText">
                    <span class="text-xs font-medium text-gray-500 uppercase">รายละเอียด</span>
                    <p class="mt-1 text-sm text-gray-700 leading-relaxed">{{ report.otherReasonText }}</p>
                </div>
            </div>
        </div>

        <!-- Media / Evidence Section (Always show) -->
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-800">
                    <i class="mr-2 text-purple-500 fas fa-paperclip"></i>
                    หลักฐานประกอบ
                    <span v-if="report.media?.length" class="text-sm font-normal text-gray-400 ml-1">({{ report.media.length }} ไฟล์)</span>
                </h2>
            </div>
            <div class="px-6 py-5">
                <!-- Has media -->
                <div v-if="report.media?.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="m in report.media" :key="m.id" class="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <!-- Image -->
                        <template v-if="m.type === 'IMAGE'">
                            <img :src="m.url" alt="หลักฐานรูปภาพ"
                                class="w-full h-56 object-cover cursor-pointer hover:opacity-90 transition"
                                @click="openMedia(m.url)" />
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                                <span class="text-white text-xs"><i class="fas fa-image mr-1"></i>รูปภาพ</span>
                            </div>
                        </template>
                        <!-- Video -->
                        <template v-else-if="m.type === 'VIDEO'">
                            <video controls class="w-full h-56 object-cover bg-black" preload="metadata">
                                <source :src="m.url" type="video/mp4" />
                                <source :src="m.url" />
                                เบราว์เซอร์ไม่รองรับวิดีโอ
                            </video>
                            <a :href="m.url" download target="_blank" rel="noopener noreferrer"
                                class="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/90 text-xs font-medium text-gray-700 rounded-md shadow hover:bg-white transition cursor-pointer">
                                <i class="fas fa-download"></i> ดาวน์โหลด
                            </a>
                        </template>
                        <!-- Unknown type fallback -->
                        <template v-else>
                            <div class="w-full h-56 flex flex-col items-center justify-center text-gray-400">
                                <i class="fas fa-file text-3xl mb-2"></i>
                                <a :href="m.url" target="_blank" rel="noopener noreferrer"
                                    class="text-sm text-blue-600 hover:underline">
                                    เปิดไฟล์
                                </a>
                            </div>
                        </template>
                    </div>
                </div>
                <!-- No media -->
                <div v-else class="py-6 text-center text-gray-400">
                    <i class="fas fa-image text-3xl mb-2 block"></i>
                    <p class="text-sm">ไม่มีหลักฐานประกอบ</p>
                </div>
            </div>
        </div>

        <!-- Image Lightbox -->
        <transition name="modal-fade">
            <div v-if="lightboxUrl" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
                @click.self="lightboxUrl = ''">
                <button @click="lightboxUrl = ''"
                    class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white text-2xl bg-black/50 rounded-full hover:bg-black/70 transition cursor-pointer">
                    <i class="fas fa-times"></i>
                </button>
                <img :src="lightboxUrl" class="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
            </div>
        </transition>
    </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
