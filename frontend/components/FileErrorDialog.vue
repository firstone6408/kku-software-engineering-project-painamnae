<script setup>
defineProps({
    modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

function dismiss() {
    emit('update:modelValue', '')
}
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="modelValue" class="file-error-overlay" @click.self="dismiss">
                <div class="file-error-dialog">
                    <div class="file-error-icon">⚠️</div>
                    <h3 class="file-error-title">ไฟล์ไม่รองรับ</h3>
                    <p class="file-error-msg">{{ modelValue }}</p>
                    <button class="file-error-btn" @click="dismiss">ตกลง</button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.file-error-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
    padding: 16px;
}

.file-error-dialog {
    background: white;
    border-radius: 16px;
    padding: 28px 32px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
}

.file-error-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
}

.file-error-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #b91c1c;
    margin-bottom: 8px;
}

.file-error-msg {
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 20px;
    line-height: 1.5;
}

.file-error-btn {
    padding: 10px 32px;
    border: none;
    background: #ef4444;
    color: white;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.file-error-btn:hover {
    background: #dc2626;
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
