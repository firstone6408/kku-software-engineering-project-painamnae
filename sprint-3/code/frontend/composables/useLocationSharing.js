import { ref, computed, onUnmounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'

const activeSession = ref(null)
const isActive = computed(() => !!activeSession.value)
const remainingMs = ref(0)
const remainingText = computed(() => {
    if (remainingMs.value <= 0) return '0:00'
    const m = Math.floor(remainingMs.value / 60000)
    const s = Math.floor((remainingMs.value % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, '0')}`
})

let sendInterval = null
let countdownInterval = null
let watchId = null
let currentLat = null
let currentLng = null

const getHeaders = () => {
    const tk = useCookie('token')?.value
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(tk ? { Authorization: `Bearer ${tk}` } : {})
    }
}

const apiBase = () => useRuntimeConfig().public.apiBase || 'http://localhost:3000/api'

const startWatchingPosition = () => {
    if (!process.client || !navigator.geolocation) return
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            currentLat = pos.coords.latitude
            currentLng = pos.coords.longitude
        },
        (err) => console.error('[Geolocation]', err.message),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    )
}

const stopWatchingPosition = () => {
    if (watchId !== null && process.client && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
    }
}

const startCountdown = () => {
    if (countdownInterval) clearInterval(countdownInterval)
    countdownInterval = setInterval(() => {
        if (!activeSession.value) {
            remainingMs.value = 0
            return
        }
        const expires = new Date(activeSession.value.expiresAt).getTime()
        remainingMs.value = Math.max(0, expires - Date.now())
        if (remainingMs.value <= 0) {
            stopSharing(true)
        }
    }, 1000)
}

const stopAllIntervals = () => {
    if (sendInterval) { clearInterval(sendInterval); sendInterval = null }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
    stopWatchingPosition()
}

// เตือนก่อนปิดหน้า
const beforeUnloadHandler = (e) => {
    if (isActive.value) {
        e.preventDefault()
        e.returnValue = 'คุณกำลังแจ้งตำแหน่งอยู่ ถ้าปิดหน้านี้ ระบบจะหยุดการแจ้งตำแหน่ง'
    }
}

export function useLocationSharing() {

    const checkActiveSession = async () => {
        try {
            const res = await $fetch('/location-sharing/active', {
                baseURL: apiBase(),
                headers: getHeaders()
            })
            if (res.data) {
                activeSession.value = res.data
                startWatchingPosition()
                startCountdown()
                startPeriodicSend()
                if (process.client) window.addEventListener('beforeunload', beforeUnloadHandler)
            }
        } catch {
            // no active session
        }
    }

    const startSharing = async (contactIds, durationMinutes) => {
        return new Promise((resolve, reject) => {
            if (!process.client || !navigator.geolocation) {
                reject(new Error('ไม่สามารถเข้าถึงตำแหน่งได้'))
                return
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        currentLat = pos.coords.latitude
                        currentLng = pos.coords.longitude

                        const res = await $fetch('/location-sharing', {
                            baseURL: apiBase(),
                            method: 'POST',
                            headers: getHeaders(),
                            body: {
                                contactIds,
                                durationMinutes,
                                latitude: currentLat,
                                longitude: currentLng
                            }
                        })

                        activeSession.value = res.data
                        startWatchingPosition()
                        startCountdown()
                        startPeriodicSend()
                        window.addEventListener('beforeunload', beforeUnloadHandler)
                        resolve(res.data)
                    } catch (e) {
                        reject(e)
                    }
                },
                (err) => {
                    reject(new Error(`ไม่สามารถเข้าถึงตำแหน่ง: ${err.message}`))
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        })
    }

    const startPeriodicSend = () => {
        if (sendInterval) clearInterval(sendInterval)
        const intervalMs = (activeSession.value?.intervalMinutes || 1) * 60 * 1000
        sendInterval = setInterval(async () => {
            if (!activeSession.value || !isActive.value) return
            try {
                // อัปเดตตำแหน่งล่าสุด
                if (currentLat && currentLng) {
                    await $fetch(`/location-sharing/${activeSession.value.id}/location`, {
                        baseURL: apiBase(),
                        method: 'PATCH',
                        headers: getHeaders(),
                        body: { latitude: currentLat, longitude: currentLng }
                    })
                }

                // ส่ง LINE
                const res = await $fetch(`/location-sharing/${activeSession.value.id}/send`, {
                    baseURL: apiBase(),
                    method: 'POST',
                    headers: getHeaders()
                })

                activeSession.value = res.data
            } catch (e) {
                console.error('[LocationSharing] Send failed:', e)
                // session อาจหมดอายุ
                if (e?.data?.statusCode === 400) {
                    stopAllIntervals()
                    activeSession.value = null
                    if (process.client) window.removeEventListener('beforeunload', beforeUnloadHandler)
                }
            }
        }, intervalMs)
    }

    const stopSharing = async (autoExpired = false) => {
        if (!activeSession.value) return

        if (!autoExpired) {
            try {
                await $fetch(`/location-sharing/${activeSession.value.id}/stop`, {
                    baseURL: apiBase(),
                    method: 'PATCH',
                    headers: getHeaders()
                })
            } catch (e) {
                console.error('[LocationSharing] Stop failed:', e)
            }
        }

        stopAllIntervals()
        activeSession.value = null
        remainingMs.value = 0
        if (process.client) window.removeEventListener('beforeunload', beforeUnloadHandler)
    }

    return {
        activeSession,
        isActive,
        remainingText,
        remainingMs,
        checkActiveSession,
        startSharing,
        stopSharing
    }
}
