<script setup lang="ts">
interface Props {
  modelValue: boolean
  width?: string
  height?: string
  maxWidth?: string
  maxHeight?: string
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: "500px",
  height: "auto",
  maxWidth: "90%",
  maxHeight: "90vh",
  fullscreen: false
})

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()

function close() {
  emit("update:modelValue", false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="close"
      >
        <div
          class="modal-box"
          :class="{ fullscreen }"
          :style="!fullscreen ? {
            width,
            height,
            maxWidth,
            maxHeight
          } : {}"
        >
          
          <button class="modal-close" @click="close">
            ✕
          </button>

          <slot />

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 999;
}

.modal-box {
  background: white;
  padding: 20px;
  border-radius: 10px;
  position: relative;
  overflow: auto;
}

.modal-box.fullscreen {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
