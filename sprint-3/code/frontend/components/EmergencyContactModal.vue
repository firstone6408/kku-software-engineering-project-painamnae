<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>
        <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full z-10">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">
                    {{ isEdit ? 'แก้ไขผู้ติดต่อฉุกเฉิน' : 'เพิ่มผู้ติดต่อฉุกเฉิน' }}
                </h2>
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="px-6 py-4 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ติดต่อ <span class="text-red-500">*</span></label>
                    <input v-model="form.name" type="text" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="ชื่อ-นามสกุล">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">ความสัมพันธ์ <span class="text-red-500">*</span></label>
                    <select v-model="form.relationship" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white">
                        <option value="">— เลือกความสัมพันธ์ —</option>
                        <option value="พ่อ">พ่อ</option>
                        <option value="แม่">แม่</option>
                        <option value="พี่">พี่</option>
                        <option value="น้อง">น้อง</option>
                        <option value="แฟน">แฟน</option>
                        <option value="เพื่อน">เพื่อน</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ <span class="text-red-500">*</span></label>
                    <input v-model="form.phoneNumber" type="tel" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="0812345678">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">อีเมล <span class="text-red-500">*</span></label>
                    <input v-model="form.email" type="email" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="example@gmail.com">
                </div>

                <!-- Error -->
                <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
            </form>

            <!-- Footer -->
            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button @click="$emit('close')"
                    class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    ยกเลิก
                </button>
                <button @click="handleSubmit" :disabled="saving"
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'

const props = defineProps({
    contact: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.contact)

const form = ref({
    name: props.contact?.name || '',
    relationship: props.contact?.relationship || '',
    phoneNumber: props.contact?.phoneNumber || '',
    email: props.contact?.email || '',
})

const saving = ref(false)
const error = ref('')

const handleSubmit = async () => {
    error.value = ''
    if (!form.value.name || !form.value.phoneNumber || !form.value.email) {
        error.value = 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ'
        return
    }

    try {
        saving.value = true
        const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'
        const tk = useCookie('token')?.value
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(tk ? { Authorization: `Bearer ${tk}` } : {})
        }

        let result
        if (isEdit.value) {
            result = await $fetch(`/emergency-contacts/${props.contact.id}`, {
                baseURL: apiBase,
                method: 'PUT',
                headers,
                body: form.value
            })
        } else {
            result = await $fetch('/emergency-contacts', {
                baseURL: apiBase,
                method: 'POST',
                headers,
                body: form.value
            })
        }

        emit('saved', result?.data || result)
    } catch (e) {
        console.error(e)
        error.value = e?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'
    } finally {
        saving.value = false
    }
}
</script>
