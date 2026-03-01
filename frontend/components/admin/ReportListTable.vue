<script setup>
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.locale('th')
dayjs.extend(buddhistEra)

defineProps({
    reports: { type: Array, default: () => [] },
})

defineEmits(['view'])

function initials(user) {
    if (!user) return '?'
    const f = (user.firstName || '')[0] || ''
    const l = (user.lastName || '')[0] || ''
    return (f + l).toUpperCase() || '?'
}

function roleBgColor(role) {
    if (role === 'DRIVER') return 'bg-blue-500'
    if (role === 'ADMIN') return 'bg-purple-500'
    return 'bg-orange-400' // PASSENGER
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
</script>

<template>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">ผู้แจ้ง</th>
                    <th class="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">ผู้ถูกแจ้ง</th>
                    <th class="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">หัวข้อปัญหา</th>
                    <th class="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">สถานะ</th>
                    <th class="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">วันที่แจ้ง</th>
                    <th class="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">การกระทำ</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="r in reports" :key="r.id" class="transition hover:bg-gray-50">
                    <!-- Reporter -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-semibold"
                                :class="roleBgColor(r.reporter?.role)">
                                {{ initials(r.reporter) }}
                            </div>
                            <div>
                                <div class="font-medium text-gray-900 text-sm">
                                    {{ r.reporter?.firstName }} {{ r.reporter?.lastName }}
                                </div>
                                <span class="inline-block px-2 py-0.5 text-xs rounded-full mt-0.5"
                                    :class="roleBadge(r.reporter?.role)">
                                    {{ roleLabel(r.reporter?.role) }}
                                </span>
                            </div>
                        </div>
                    </td>

                    <!-- Reported User -->
                    <td class="px-4 py-3">
                        <template v-if="r.reportedUser">
                            <div class="flex items-center gap-3">
                                <div class="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-semibold"
                                    :class="roleBgColor(r.reportedUser?.role)">
                                    {{ initials(r.reportedUser) }}
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 text-sm">
                                        {{ r.reportedUser?.firstName }} {{ r.reportedUser?.lastName }}
                                    </div>
                                    <span class="inline-block px-2 py-0.5 text-xs rounded-full mt-0.5"
                                        :class="roleBadge(r.reportedUser?.role)">
                                        {{ roleLabel(r.reportedUser?.role) }}
                                    </span>
                                </div>
                            </div>
                        </template>
                        <span v-else class="text-sm text-gray-400">-</span>
                    </td>

                    <!-- Reasons -->
                    <td class="px-4 py-3">
                        <div class="flex flex-wrap gap-1 max-w-xs">
                            <span v-for="reason in r.reasons?.slice(0, 2)" :key="reason.id"
                                class="inline-block px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                                {{ reasonLabel(reason) }}
                            </span>
                            <span v-if="r.reasons?.length > 2"
                                class="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                +{{ r.reasons.length - 2 }}
                            </span>
                        </div>
                    </td>

                    <!-- Status -->
                    <td class="px-4 py-3">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                            :class="statusBadge(r.status)">
                            <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(r.status)"></span>
                            {{ statusLabel(r.status) }}
                        </span>
                    </td>

                    <!-- Created At -->
                    <td class="px-4 py-3 text-sm text-gray-700">
                        {{ formatDate(r.createdAt) }}
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-3">
                        <button @click="$emit('view', r)"
                            class="p-2 text-gray-500 transition-colors cursor-pointer hover:text-blue-600"
                            title="ดูรายละเอียด" aria-label="ดูรายละเอียด">
                            <i class="text-lg fa-regular fa-eye"></i>
                        </button>
                    </td>
                </tr>

                <tr v-if="!reports.length">
                    <td colspan="6" class="px-4 py-10 text-center text-gray-500">ไม่มีข้อมูลการรายงาน</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
