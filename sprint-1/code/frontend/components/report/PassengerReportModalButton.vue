<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from '~/composables/useToast'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    bookingId: { type: String, required: true },
    driverId: { type: String, required: true },
    existingReport: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const { $api } = useNuxtApp()
const { toast } = useToast()

const isSubmitting = ref(false)
const selectedReasons = ref([])
const otherReasonText = ref('')
const newFiles = ref([])
const filePreviews = ref([])
const keepMediaIds = ref([])
const existingMedia = ref([])

const reasonOptions = [
    { value: 'FAST_DRIVING', label: 'ขับรถเร็ว' },
    { value: 'RUDE_BEHAVIOR', label: 'พูดจาไม่เพราะ' },
    { value: 'RECKLESS_DRIVING', label: 'ขับรถประมาท' },
    { value: 'UNSAFE_DRIVING', label: 'ขับรถไม่ปลอดภัย' },
    { value: 'INAPPROPRIATE_CONDUCT', label: 'พฤติกรรมไม่เหมาะสม' },
    { value: 'OTHER', label: 'อื่นๆ' },
]

const isEditMode = computed(() => !!props.existingReport)
const showOtherText = computed(() => selectedReasons.value.includes('OTHER'))
const canSubmit = computed(() => selectedReasons.value.length > 0 && !isSubmitting.value)

watch(() => props.modelValue, (val) => {
    if (val) {
        if (props.existingReport) {
            const r = props.existingReport
            selectedReasons.value = (r.reasons || []).map(
                (reason) => reason.passengerReason
            ).filter(Boolean)
            otherReasonText.value = r.otherReasonText || ''
            existingMedia.value = r.media || []
            keepMediaIds.value = (r.media || []).map((m) => m.id)
        } else {
            resetForm()
        }
    }
})

function resetForm() {
    selectedReasons.value = []
    otherReasonText.value = ''
    newFiles.value = []
    filePreviews.value = []
    keepMediaIds.value = []
    existingMedia.value = []
}

function close() {
    emit('update:modelValue', false)
}

function onFileChange(e) {
    const files = Array.from(e.target.files || [])
    for (const f of files) {
        newFiles.value.push(f)
        if (f.type.startsWith('image/')) {
            filePreviews.value.push({ url: URL.createObjectURL(f), type: 'IMAGE', name: f.name })
        } else {
            filePreviews.value.push({ url: URL.createObjectURL(f), type: 'VIDEO', name: f.name })
        }
    }
    e.target.value = ''
}

function removeNewFile(index) {
    URL.revokeObjectURL(filePreviews.value[index].url)
    newFiles.value.splice(index, 1)
    filePreviews.value.splice(index, 1)
}

function removeExistingMedia(mediaId) {
    keepMediaIds.value = keepMediaIds.value.filter((id) => id !== mediaId)
}

async function submit() {
    if (!canSubmit.value) return
    isSubmitting.value = true

    try {
        const fd = new FormData()

        if (isEditMode.value) {
            fd.append('reasons', JSON.stringify(selectedReasons.value))
            if (showOtherText.value) {
                fd.append('otherReasonText', otherReasonText.value)
            }
            fd.append('keepMediaIds', JSON.stringify(keepMediaIds.value))
            for (const file of newFiles.value) {
                fd.append('media', file)
            }
            await $api(`/reports/${props.existingReport.id}`, {
                method: 'PUT',
                body: fd,
            })
            toast.success('แก้ไข Report สำเร็จ', 'บันทึกการเปลี่ยนแปลงแล้ว')
        } else {
            fd.append('reportedUserId', props.driverId)
            fd.append('bookingId', props.bookingId)
            fd.append('passengerReasons', JSON.stringify(selectedReasons.value))
            if (showOtherText.value) {
                fd.append('otherReasonText', otherReasonText.value)
            }
            for (const file of newFiles.value) {
                fd.append('media', file)
            }
            await $api('/reports/passenger', {
                method: 'POST',
                body: fd,
            })
            toast.success('ส่ง Report สำเร็จ', 'เราจะดำเนินการตรวจสอบให้เร็วที่สุด')
        }

        resetForm()
        close()
        emit('submitted')
    } catch (err) {
        console.error('Report submit failed:', err)
        toast.error('เกิดข้อผิดพลาด', err?.data?.message || err?.statusMessage || 'ไม่สามารถส่ง Report ได้')
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="modelValue" class="report-overlay" @click.self="close">
                <div class="report-modal">
                    <button class="report-close" @click="close">✕</button>

                    <h2 class="report-title">
                        <span class="report-icon">🚩</span>
                        {{ isEditMode ? 'แก้ไข Report คนขับ' : 'รายงานปัญหาคนขับ' }}
                    </h2>
                    <p class="report-subtitle">
                        {{ isEditMode ? 'แก้ไขข้อมูลการรายงานที่ส่งไปแล้ว' : 'เลือกรายการปัญหาที่พบ (เลือกได้หลายข้อ)' }}
                    </p>

                    <!-- Checkboxes -->
                    <div class="report-reasons">
                        <label v-for="opt in reasonOptions" :key="opt.value" class="report-checkbox-label"
                            :class="{ 'checked': selectedReasons.includes(opt.value) }">
                            <input type="checkbox" :value="opt.value" v-model="selectedReasons"
                                class="report-checkbox" />
                            <span class="checkmark"></span>
                            <span>{{ opt.label }}</span>
                        </label>
                    </div>

                    <!-- Other reason text -->
                    <div v-if="showOtherText" class="report-other-text">
                        <label class="report-label">ระบุรายละเอียดเพิ่มเติม</label>
                        <textarea v-model="otherReasonText" placeholder="กรุณาระบุปัญหาที่พบ..."
                            class="report-textarea" rows="3"></textarea>
                    </div>

                    <!-- Existing media (edit mode) -->
                    <div v-if="isEditMode && existingMedia.length > 0" class="report-media-section">
                        <label class="report-label">หลักฐานเดิม</label>
                        <div class="report-media-grid">
                            <div v-for="m in existingMedia" :key="m.id" class="report-media-item"
                                :class="{ 'media-removed': !keepMediaIds.includes(m.id) }">
                                <img v-if="m.type === 'IMAGE'" :src="m.url" class="report-thumbnail" />
                                <video v-else :src="m.url" class="report-thumbnail" controls></video>
                                <button v-if="keepMediaIds.includes(m.id)" class="media-remove-btn"
                                    @click="removeExistingMedia(m.id)">✕</button>
                                <span v-else class="media-removed-label">ลบแล้ว</span>
                            </div>
                        </div>
                    </div>

                    <!-- File upload -->
                    <div class="report-media-section">
                        <label class="report-label">แนบหลักฐาน (รูปภาพ/วิดีโอ) — ไม่บังคับ</label>
                        <label class="report-upload-area">
                            <input type="file" multiple accept="image/*,video/*" @change="onFileChange"
                                class="hidden" />
                            <div class="upload-placeholder">
                                <span class="upload-icon">📎</span>
                                <span>คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</span>
                                <span class="upload-hint">รองรับ: รูปภาพ, วิดีโอ (สูงสุด 50MB ต่อไฟล์)</span>
                            </div>
                        </label>
                        <div v-if="filePreviews.length > 0" class="report-media-grid">
                            <div v-for="(preview, i) in filePreviews" :key="i" class="report-media-item">
                                <img v-if="preview.type === 'IMAGE'" :src="preview.url" class="report-thumbnail" />
                                <video v-else :src="preview.url" class="report-thumbnail" controls></video>
                                <button class="media-remove-btn" @click="removeNewFile(i)">✕</button>
                                <span class="media-name">{{ preview.name }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Submit -->
                    <div class="report-actions">
                        <button class="btn-cancel" @click="close">ยกเลิก</button>
                        <button class="btn-submit" :disabled="!canSubmit" @click="submit">
                            {{ isSubmitting ? 'กำลังส่ง...' : (isEditMode ? 'บันทึกการแก้ไข' : 'ส่ง Report') }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.report-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
}

.report-modal {
    background: white;
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.report-close {
    position: absolute;
    top: 16px;
    right: 16px;
    border: none;
    background: #f3f4f6;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.report-close:hover {
    background: #e5e7eb;
}

.report-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.report-icon {
    font-size: 1.5rem;
}

.report-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 20px;
}

.report-reasons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.report-checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.9rem;
    color: #374151;
    transition: all 0.2s;
    user-select: none;
}

.report-checkbox-label:hover {
    border-color: #93c5fd;
    background: #eff6ff;
}

.report-checkbox-label.checked {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 500;
}

.report-checkbox {
    accent-color: #3b82f6;
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.report-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
}

.report-other-text {
    margin-bottom: 16px;
}

.report-textarea {
    width: 100%;
    border: 1.5px solid #d1d5db;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.875rem;
    resize: vertical;
    transition: border-color 0.2s;
    box-sizing: border-box;
}

.report-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.report-media-section {
    margin-bottom: 16px;
}

.report-upload-area {
    display: block;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.report-upload-area:hover {
    border-color: #93c5fd;
    background: #f9fafb;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #6b7280;
    font-size: 0.875rem;
}

.upload-icon {
    font-size: 1.5rem;
}

.upload-hint {
    font-size: 0.75rem;
    color: #9ca3af;
}

.report-media-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 10px;
}

.report-media-item {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
}

.report-media-item.media-removed {
    opacity: 0.4;
}

.report-thumbnail {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
}

.media-remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.media-removed-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(239, 68, 68, 0.85);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
}

.media-name {
    display: block;
    font-size: 0.65rem;
    color: #6b7280;
    text-align: center;
    padding: 2px 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.report-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.btn-cancel {
    padding: 10px 20px;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    border-radius: 10px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cancel:hover {
    background: #f3f4f6;
}

.btn-submit {
    padding: 10px 20px;
    border: none;
    background: #ef4444;
    color: white;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
    background: #dc2626;
}

.btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.hidden {
    display: none;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.25s;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>
