<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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
const showResolveModal = ref(false)
const isResolving = ref(false)

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
    } catch (err) {
        console.error(err)
        loadError.value = err?.message || 'ไม่สามารถโหลดข้อมูลได้'
        toast.error('เกิดข้อผิดพลาด', loadError.value)
    } finally {
        isLoading.value = false
    }
}

async function resolveReport() {
    showResolveModal.value = false
    isResolving.value = true
    try {
        const token = getToken()
        const res = await fetch(`${config.public.apiBase}reports/${route.params.id}/resolve`, {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.message || `Request failed: ${res.status}`)
        // Re-fetch full report data with all includes (resolve returns partial data)
        await fetchReport()
        toast.success('สำเร็จ', 'เปลี่ยนสถานะเป็นแก้ไขแล้ว และส่งแจ้งเตือนผู้แจ้งเรียบร้อย')
    } catch (err) {
        console.error(err)
        toast.error('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถเปลี่ยนสถานะได้')
    } finally {
        isResolving.value = false
    }
}

function statusBadge(s) {
    if (s === 'RESOLVED') return 'bg-green-100 text-green-700'
    return 'bg-amber-100 text-amber-700'
}

function statusDot(s) {
    if (s === 'RESOLVED') return 'bg-green-500'
    return 'bg-amber-500'
}

function statusLabel(s) {
    if (s === 'RESOLVED') return 'เสร็จสิ้น'
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

                <!-- Page Title -->
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-semibold text-gray-800">
                        รายละเอียดการรายงาน
                        <span v-if="report" class="text-base font-mono text-gray-400 ml-2">#{{ report?.id?.slice(-8) }}</span>
                    </h1>
                    <div class="flex items-center gap-3">
                        <!-- Status + Created At -->
                        <span v-if="report" class="text-xs text-gray-500">
                            แจ้งเมื่อ {{ formatDate(report?.createdAt) }}
                        </span>
                    </div>
                </div>

                <!-- Loading / Error -->
                <div v-if="isLoading" class="p-12 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin mr-2"></i> กำลังโหลดข้อมูล...
                </div>
                <div v-else-if="loadError" class="p-12 text-center text-red-600">{{ loadError }}</div>

                <!-- Main Layout: Detail + Sidebar -->
                <div v-else-if="report" class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    <!-- Left: Report Detail Component -->
                    <ReportDetail :report="report" />

                    <!-- Right: Status Action Card -->
                    <div class="space-y-4">
                        <div class="bg-white border border-gray-200 rounded-lg shadow-sm sticky top-20">
                            <div class="px-5 py-4 border-b border-gray-200">
                                <h3 class="text-base font-semibold text-gray-800">
                                    <i class="mr-2 text-blue-500 fas fa-clipboard-check"></i>
                                    อัปเดตสถานะ
                                </h3>
                            </div>
                            <div class="px-5 py-5 space-y-4">
                                <!-- Current Status -->
                                <div>
                                    <span class="text-xs font-medium text-gray-500 uppercase">สถานะปัจจุบัน</span>
                                    <div class="mt-2">
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full"
                                            :class="statusBadge(report.status)">
                                            <span class="w-2 h-2 rounded-full" :class="statusDot(report.status)"></span>
                                            {{ statusLabel(report.status) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Resolve Button -->
                                <button @click="showResolveModal = true"
                                    :disabled="report.status === 'RESOLVED' || isResolving"
                                    class="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                                    :class="report.status === 'RESOLVED'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer shadow-sm hover:shadow-md'">
                                    <template v-if="isResolving">
                                        <i class="fas fa-spinner fa-spin mr-1"></i> กำลังดำเนินการ...
                                    </template>
                                    <template v-else-if="report.status === 'RESOLVED'">
                                        <i class="fas fa-check-circle mr-1"></i> ดำเนินการเสร็จสิ้นแล้ว
                                    </template>
                                    <template v-else>
                                        <i class="fas fa-check mr-1"></i> เปลี่ยนสถานะเป็นแก้ไข
                                    </template>
                                </button>

                                <!-- Info note -->
                                <p v-if="report.status !== 'RESOLVED'" class="text-xs text-gray-400 leading-relaxed">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    เมื่อกดปุ่มจะส่งแจ้งเตือนไปยังผู้แจ้งอัตโนมัติ
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Confirm Resolve Modal -->
        <ConfirmModal :show="showResolveModal" title="ยืนยันการเปลี่ยนสถานะ"
            message="ต้องการเปลี่ยนสถานะเป็น 'แก้ไขแล้ว' หรือไม่? ระบบจะส่งแจ้งเตือนไปยังผู้แจ้งอัตโนมัติ"
            confirmText="ยืนยัน" cancelText="ยกเลิก" variant="primary" @confirm="resolveReport"
            @cancel="showResolveModal = false" />

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
