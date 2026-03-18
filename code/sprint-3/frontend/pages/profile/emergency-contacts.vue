<template>
    <div class="flex min-h-screen bg-gray-50">
        <ProfileSidebar />

        <div class="flex-1 p-6 md:p-10">
            <div class="max-w-4xl mx-auto">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">ผู้ติดต่อฉุกเฉิน</h1>
                        <p class="text-sm text-gray-500 mt-1">จัดการรายชื่อผู้ติดต่อฉุกเฉินสำหรับแจ้งตำแหน่งของคุณ</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="showHistoryModal = true"
                            class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ประวัติการแจ้ง
                        </button>
                        <button @click="openCreateModal"
                            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                            เพิ่มผู้ติดต่อ
                        </button>
                    </div>
                </div>

                <!-- Loading -->
                <div v-if="loading" class="text-center py-12">
                    <div class="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p class="mt-3 text-gray-500">กำลังโหลด...</p>
                </div>

                <!-- Empty State -->
                <div v-else-if="contacts.length === 0"
                    class="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                    <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 class="text-lg font-medium text-gray-700 mb-1">ยังไม่มีผู้ติดต่อฉุกเฉิน</h3>
                    <p class="text-sm text-gray-500 mb-4">เพิ่มผู้ติดต่อเพื่อให้ระบบแจ้งตำแหน่งของคุณในกรณีฉุกเฉิน</p>
                    <button @click="openCreateModal"
                        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        เพิ่มผู้ติดต่อคนแรก
                    </button>
                </div>

                <!-- Contact Table -->
                <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ</th>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ความสัมพันธ์</th>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสเชื่อมต่อ</th>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ LINE</th>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">เบอร์โทร</th>
                                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">อีเมล</th>
                                    <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="contact in contacts" :key="contact.id" class="hover:bg-gray-50 transition-colors">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-blue-600 text-sm font-semibold">{{ contact.name?.charAt(0) }}</span>
                                            </div>
                                            <span class="text-sm font-medium text-gray-900">{{ contact.name }}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ contact.relationship }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">{{ contact.lineLinkToken }}</span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                            :class="getStatusBadgeClass(contact.lineLinkStatus)">
                                            <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(contact.lineLinkStatus)"></span>
                                            {{ getStatusText(contact.lineLinkStatus) }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ contact.phoneNumber }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ contact.email }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        <button @click="openQrModal(contact)"
                                            class="text-green-600 hover:text-green-800 transition-colors" title="ดูรหัสเชื่อมต่อ">
                                            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                        </button>
                                        <button @click="openEditModal(contact)"
                                            class="text-blue-600 hover:text-blue-800 transition-colors" title="แก้ไข">
                                            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button @click="openDeleteModal(contact)"
                                            class="text-red-500 hover:text-red-700 transition-colors" title="ลบ">
                                            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Toast -->
                <transition enter-active-class="transition ease-out duration-300"
                    enter-from-class="translate-y-2 opacity-0" enter-to-class="translate-y-0 opacity-100"
                    leave-active-class="transition ease-in duration-200"
                    leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-2 opacity-0">
                    <div v-if="toast.show"
                        class="fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-50"
                        :class="toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'">
                        {{ toast.message }}
                    </div>
                </transition>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <EmergencyContactModal
            v-if="showFormModal"
            :contact="editingContact"
            @close="showFormModal = false"
            @saved="onSaved"
        />

        <!-- QR Code Modal -->
        <LineLinkQrModal
            v-if="showQrModal"
            :contact="qrContact"
            @close="showQrModal = false"
        />

        <!-- Sharing History Modal -->
        <SharingHistoryModal
            v-if="showHistoryModal"
            @close="showHistoryModal = false"
        />

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="fixed inset-0 bg-black/50" @click="showDeleteModal = false"></div>
            <div class="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 z-10">
                <div class="text-center">
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
                    <p class="text-sm text-gray-600 mb-6">
                        คุณต้องการลบ <span class="font-semibold">{{ deletingContact?.name }}</span> ออกจากผู้ติดต่อฉุกเฉินจริงหรือไม่?
                    </p>
                    <div class="flex gap-3">
                        <button @click="showDeleteModal = false"
                            class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                            ยกเลิก
                        </button>
                        <button @click="confirmDelete" :disabled="deleting"
                            class="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                            {{ deleting ? 'กำลังลบ...' : 'ลบ' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'
import ProfileSidebar from '~/components/ProfileSidebar.vue'
import EmergencyContactModal from '~/components/EmergencyContactModal.vue'
import LineLinkQrModal from '~/components/LineLinkQrModal.vue'
import SharingHistoryModal from '~/components/SharingHistoryModal.vue'

const contacts = ref([])
const loading = ref(true)
const showFormModal = ref(false)
const editingContact = ref(null)
const showDeleteModal = ref(false)
const deletingContact = ref(null)
const deleting = ref(false)
const showQrModal = ref(false)
const qrContact = ref(null)
const showHistoryModal = ref(false)
const toast = ref({ show: false, message: '', type: 'success' })

const getHeaders = () => {
    const tk = useCookie('token')?.value
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(tk ? { Authorization: `Bearer ${tk}` } : {})
    }
}

const apiBase = () => useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'

const showToast = (message, type = 'success') => {
    toast.value = { show: true, message, type }
    setTimeout(() => { toast.value.show = false }, 3000)
}

const getStatusText = (status) => {
    switch (status) {
        case 'LINKED': return 'เชื่อมต่อแล้ว'
        case 'UNLINKED': return 'ถูกลบออก'
        default: return 'รอเชื่อมต่อ'
    }
}

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'LINKED': return 'bg-green-50 text-green-700'
        case 'UNLINKED': return 'bg-red-50 text-red-700'
        default: return 'bg-yellow-50 text-yellow-700'
    }
}

const getStatusDotClass = (status) => {
    switch (status) {
        case 'LINKED': return 'bg-green-500'
        case 'UNLINKED': return 'bg-red-500'
        default: return 'bg-yellow-400'
    }
}

const fetchContacts = async () => {
    try {
        loading.value = true
        const res = await $fetch('/emergency-contacts/me', {
            baseURL: apiBase(),
            headers: getHeaders()
        })
        contacts.value = res.data || []
    } catch (e) {
        console.error(e)
        showToast('ไม่สามารถโหลดรายชื่อผู้ติดต่อได้', 'error')
    } finally {
        loading.value = false
    }
}

const openCreateModal = () => {
    editingContact.value = null
    showFormModal.value = true
}

const openEditModal = (contact) => {
    editingContact.value = { ...contact }
    showFormModal.value = true
}

const openDeleteModal = (contact) => {
    deletingContact.value = contact
    showDeleteModal.value = true
}

const openQrModal = (contact) => {
    qrContact.value = contact
    showQrModal.value = true
}

const confirmDelete = async () => {
    if (!deletingContact.value) return
    try {
        deleting.value = true
        await $fetch(`/emergency-contacts/${deletingContact.value.id}`, {
            baseURL: apiBase(),
            method: 'DELETE',
            headers: getHeaders()
        })
        showToast('ลบผู้ติดต่อสำเร็จ')
        showDeleteModal.value = false
        await fetchContacts()
    } catch (e) {
        console.error(e)
        showToast('ไม่สามารถลบผู้ติดต่อได้', 'error')
    } finally {
        deleting.value = false
    }
}

const onSaved = (savedContact) => {
    showFormModal.value = false
    const isCreate = !editingContact.value
    showToast(isCreate ? 'เพิ่มผู้ติดต่อสำเร็จ' : 'แก้ไขผู้ติดต่อสำเร็จ')
    fetchContacts()

    // หลังสร้างใหม่ → เปิด QR modal อัตโนมัติ
    if (isCreate && savedContact) {
        qrContact.value = savedContact
        showQrModal.value = true
    }
}

onMounted(fetchContacts)
</script>
