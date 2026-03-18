<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import ReportDetail from '~/components/admin/ReportDetail.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToast } from '~/composables/useToast'

dayjs.locale('th')
dayjs.extend(buddhistEra)

definePageMeta({ middleware: ['admin-auth'] })

const route = useRoute()
const { toast } = useToast()
const config = useRuntimeConfig()

const isLoading = ref(false)
const loadError = ref('')
const report = ref(null)
const isSubmitting = ref(false)

// Status update form
const selectedStatus = ref('')
const rejectionReason = ref('')
const showConfirmModal = ref(false)

// Whether the report is finalized (resolved/rejected) — cannot edit
const isFinalized = computed(() => {
    return report.value && (report.value.status === 'RESOLVED' || report.value.status === 'REJECTED')
})

// Whether the submit button should be enabled
const canSubmit = computed(() => {
    if (!report.value || isFinalized.value || isSubmitting.value) return false
    // Must pick a different status than current
    return selectedStatus.value && selectedStatus.value !== report.value.status
})

function getToken() {
    const cookie = useCookie('token')
    return cookie.value || (process.client ? localStorage.getItem('token') : '')
}

async function fetchReport() {
    isLoading.value = true
    loadError.value = ''
    try {
        const token = getToken()
        const res = await fetch(`${config.public.apiBase}reports/admin/${route.params.id}`, {
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.message || `Request failed: ${res.status}`)
        report.value = body?.data || null
        // Initialize selected status to current status
        if (report.value) {
            selectedStatus.value = report.value.status
            rejectionReason.value = report.value.rejectionReason || ''
        }
    } catch (err) {
        console.error(err)
        loadError.value = err?.message || 'ไม่สามารถโหลดข้อมูลได้'
        toast.error('เกิดข้อผิดพลาด', loadError.value)
    } finally {
        isLoading.value = false
    }
}

function confirmStatusChange() {
    if (!canSubmit.value) return
    showConfirmModal.value = true
}

async function submitStatusChange() {
    showConfirmModal.value = false
    isSubmitting.value = true
    const action = selectedStatus.value // save before fetchReport resets it
    try {
        const token = getToken()
        let endpoint = ''
        let bodyPayload = {}

        if (action === 'RESOLVED') {
            endpoint = `${config.public.apiBase}reports/${route.params.id}/resolve`
        } else if (action === 'REJECTED') {
            endpoint = `${config.public.apiBase}reports/${route.params.id}/reject`
            if (rejectionReason.value.trim()) {
                bodyPayload = { rejectionReason: rejectionReason.value.trim() }
            }
        } else {
            return
        }

        const res = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
            body: JSON.stringify(bodyPayload),
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.message || `Request failed: ${res.status}`)
        await fetchReport()

        if (action === 'RESOLVED') {
            toast.success('สำเร็จ', 'เปลี่ยนสถานะเป็นแก้ไขแล้ว และส่งแจ้งเตือนผู้แจ้งเรียบร้อย')
        } else {
            toast.success('สำเร็จ', 'ปฏิเสธ Report แล้ว และส่งแจ้งเตือนผู้แจ้งเรียบร้อย')
        }
    } catch (err) {
        console.error(err)
        toast.error('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถเปลี่ยนสถานะได้')
    } finally {
        isSubmitting.value = false
    }
}

// Confirm modal props
const confirmTitle = computed(() => {
    if (selectedStatus.value === 'RESOLVED') return 'ยืนยันเปลี่ยนสถานะเป็น "แก้ไขแล้ว"'
    if (selectedStatus.value === 'REJECTED') return 'ยืนยันเปลี่ยนสถานะเป็น "ปฏิเสธ"'
    return 'ยืนยันการเปลี่ยนสถานะ'
})
const confirmMessage = computed(() => {
    const base = 'ระบบจะส่งแจ้งเตือนไปยังผู้แจ้งอัตโนมัติ เมื่อยืนยันแล้วจะไม่สามารถเปลี่ยนแปลงได้'
    if (selectedStatus.value === 'REJECTED' && rejectionReason.value.trim()) {
        return `${base}\n\nเหตุผลการปฏิเสธ: "${rejectionReason.value.trim()}"`
    }
    return base
})
const confirmVariant = computed(() => {
    return selectedStatus.value === 'REJECTED' ? 'danger' : 'primary'
})

function statusBadge(s) {
    if (s === 'RESOLVED') return 'bg-green-100 text-green-700'
    if (s === 'REJECTED') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
}
function statusDot(s) {
    if (s === 'RESOLVED') return 'bg-green-500'
    if (s === 'REJECTED') return 'bg-red-500'
    return 'bg-amber-500'
}
function statusLabel(s) {
    if (s === 'RESOLVED') return 'แก้ไขแล้ว'
    if (s === 'REJECTED') return 'ปฏิเสธ'
    return 'รอตรวจสอบ'
}
function formatDate(iso) {
    if (!iso) return '-'
    return dayjs(iso).format('D MMMM BBBB HH:mm')
}

useHead({
    title: 'Report Detail — PNNAdmin',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('overlay')
    if (!sidebar || !overlay) return
    sidebar.classList.remove('mobile-open')
    overlay.classList.add('hidden')
}

function defineGlobalScripts() {
    window.toggleSidebar = function () {
        const sidebar = document.getElementById('sidebar')
        const mainContent = document.getElementById('main-content')
        const toggleIcon = document.getElementById('toggle-icon')
        if (!sidebar || !mainContent || !toggleIcon) return
        sidebar.classList.toggle('collapsed')
        if (sidebar.classList.contains('collapsed')) {
            mainContent.style.marginLeft = '80px'
            toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right')
        } else {
            mainContent.style.marginLeft = '280px'
            toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left')
        }
    }
    window.toggleMobileSidebar = function () {
        const sidebar = document.getElementById('sidebar')
        const overlay = document.getElementById('overlay')
        if (!sidebar || !overlay) return
        sidebar.classList.toggle('mobile-open')
        overlay.classList.toggle('hidden')
    }
    window.__adminResizeHandler__ = function () {
        const sidebar = document.getElementById('sidebar')
        const mainContent = document.getElementById('main-content')
        const overlay = document.getElementById('overlay')
        if (!sidebar || !mainContent || !overlay) return
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('mobile-open')
            overlay.classList.add('hidden')
            if (sidebar.classList.contains('collapsed')) {
                mainContent.style.marginLeft = '80px'
            } else {
                mainContent.style.marginLeft = '280px'
            }
        } else {
            mainContent.style.marginLeft = '0'
        }
    }
    window.addEventListener('resize', window.__adminResizeHandler__)
}

function cleanupGlobalScripts() {
    window.removeEventListener('resize', window.__adminResizeHandler__ || (() => { }))
    delete window.toggleSidebar
    delete window.toggleMobileSidebar
    delete window.closeMobileSidebar
    delete window.__adminResizeHandler__
}

onMounted(() => {
    defineGlobalScripts()
    if (typeof window.__adminResizeHandler__ === 'function') window.__adminResizeHandler__()
    fetchReport()
})
onUnmounted(() => { cleanupGlobalScripts() })
</script>

<template>
    <div>
        <AdminHeader />
        <AdminSidebar />

        <!-- Main Content -->
        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6">
            <div class="mx-auto max-w-5xl">
                <!-- Back Button -->
                <button @click="navigateTo('/admin/reports')"
                    class="inline-flex items-center gap-2 mb-4 text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition">
                    <i class="fas fa-arrow-left"></i> ย้อนกลับ
                </button>

                <!-- Page Title + Prominent Date -->
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-semibold text-gray-800">
                        รายละเอียดการรายงาน
                        <span v-if="report" class="text-base font-mono text-gray-400 ml-2">#{{ report?.id?.slice(-8)
                            }}</span>
                    </h1>
                    <!-- Prominent date badge -->
                    <div v-if="report" class="flex items-center gap-2">
                        <div
                            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <i class="fas fa-calendar-alt text-blue-500"></i>
                            <span class="text-sm font-medium text-blue-700">
                                แจ้งเมื่อ {{ formatDate(report?.createdAt) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Loading / Error -->
                <div v-if="isLoading" class="p-12 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin mr-2"></i> กำลังโหลดข้อมูล...
                </div>
                <div v-else-if="loadError" class="p-12 text-center text-red-600">{{ loadError }}</div>

                <!-- Main Layout: Detail + Sidebar -->
                <div v-else-if="report" class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                    <!-- Left: Report Detail Component -->
                    <ReportDetail :report="report" />

                    <!-- Right: Status Action Card -->
                    <div class="space-y-4">
                        <div class="bg-white border border-gray-200 rounded-lg shadow-sm sticky top-20">
                            <div class="px-5 py-4 border-b border-gray-200">
                                <h3 class="text-base font-semibold text-gray-800">
                                    <i class="mr-2 text-blue-500 fas fa-clipboard-check"></i>
                                    อัปเดตสถานะและแจ้งผู้ใช้
                                </h3>
                            </div>
                            <div class="px-5 py-5 space-y-5">
                                <!-- Current Status Display -->
                                <div>
                                    <span class="text-xs font-medium text-gray-500 uppercase">สถานะปัจจุบัน</span>
                                    <div class="mt-2">
                                        <span
                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                                            :class="statusBadge(report.status)">
                                            <span class="w-2 h-2 rounded-full"
                                                :class="statusDot(report.status)"></span>
                                            {{ statusLabel(report.status) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Show rejection reason if already rejected -->
                                <div v-if="report.status === 'REJECTED' && report.rejectionReason"
                                    class="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div class="text-xs font-medium text-red-600 mb-1">
                                        <i class="fas fa-comment-dots mr-1"></i> เหตุผลการปฏิเสธ
                                    </div>
                                    <p class="text-sm text-red-700">{{ report.rejectionReason }}</p>
                                </div>

                                <!-- Status Dropdown (only if PENDING) -->
                                <div v-if="!isFinalized">
                                    <label class="block text-xs font-medium text-gray-600 mb-1.5">
                                        เปลี่ยนสถานะ <span class="text-red-500">*</span>
                                    </label>
                                    <select v-model="selectedStatus"
                                        class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                        <option value="PENDING">รอตรวจสอบ</option>
                                        <option value="RESOLVED">แก้ไขแล้ว</option>
                                        <option value="REJECTED">ปฏิเสธ</option>
                                    </select>
                                </div>

                                <!-- Rejection Reason Textarea (show only when REJECTED selected) -->
                                <div v-if="!isFinalized && selectedStatus === 'REJECTED'">
                                    <label class="block text-xs font-medium text-gray-600 mb-1.5">
                                        เหตุผลการปฏิเสธ <span class="text-gray-400">(ไม่บังคับ)</span>
                                    </label>
                                    <textarea v-model="rejectionReason" rows="3"
                                        placeholder="พิมพ์เหตุผลเพื่อแจ้งให้ผู้ใช้ทราบ..."
                                        class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"></textarea>
                                </div>

                                <!-- Submit Button -->
                                <button v-if="!isFinalized" @click="confirmStatusChange" :disabled="!canSubmit"
                                    class="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                                    :class="canSubmit
                                        ? (selectedStatus === 'REJECTED'
                                            ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer shadow-sm hover:shadow-md'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm hover:shadow-md')
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'">
                                    <template v-if="isSubmitting">
                                        <i class="fas fa-spinner fa-spin mr-1"></i> กำลังดำเนินการ...
                                    </template>
                                    <template v-else>
                                        <i class="fas fa-paper-plane mr-1"></i> บันทึกและส่งแจ้งเตือน
                                    </template>
                                </button>

                                <!-- Finalized notice -->
                                <div v-if="isFinalized"
                                    class="flex items-center gap-2 p-3 rounded-lg text-sm"
                                    :class="report.status === 'RESOLVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                                    <i class="fas" :class="report.status === 'RESOLVED' ? 'fa-check-circle' : 'fa-times-circle'"></i>
                                    <span>{{ report.status === 'RESOLVED' ? 'ดำเนินการเสร็จสิ้นแล้ว' : 'Report นี้ถูกปฏิเสธแล้ว' }}</span>
                                </div>

                                <!-- Info note -->
                                <p v-if="!isFinalized" class="text-xs text-gray-400 leading-relaxed">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    เมื่อกดปุ่มจะส่งแจ้งเตือนไปยังผู้แจ้งอัตโนมัติ เมื่อดำเนินการแล้วจะไม่สามารถเปลี่ยนแปลงได้
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Confirm Status Change Modal -->
        <ConfirmModal :show="showConfirmModal" :title="confirmTitle"
            :message="confirmMessage"
            confirmText="ยืนยัน" cancelText="ยกเลิก" :variant="confirmVariant" @confirm="submitStatusChange"
            @cancel="showConfirmModal = false" />

        <!-- Mobile Overlay -->
        <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
            @click="closeMobileSidebar"></div>
    </div>
</template>

<style>
.sidebar { transition: width 0.3s ease; }
.sidebar.collapsed { width: 80px; }
.sidebar:not(.collapsed) { width: 280px; }
.sidebar-item { transition: all 0.3s ease; }
.sidebar-item:hover { background-color: rgba(59, 130, 246, 0.05); }
.sidebar.collapsed .sidebar-text { display: none; }
.sidebar.collapsed .sidebar-item { justify-content: center; }
.main-content { transition: margin-left 0.3s ease; }
@media (max-width: 768px) {
    .sidebar { position: fixed; z-index: 1000; transform: translateX(-100%); }
    .sidebar.mobile-open { transform: translateX(0); }
    .main-content { margin-left: 0 !important; }
}
</style>
