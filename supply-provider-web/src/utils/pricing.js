export function getTimeRatio(remainingSeconds, totalSeconds) {
    if (!totalSeconds) return 0
    return Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
}

export function calculatePrice(basePrice, remainingSeconds, totalSeconds) {
    const ratio = getTimeRatio(remainingSeconds, totalSeconds)
    const floor = Math.max(0.05, ratio)
    return Math.max(0, Math.round(Number(basePrice || 0) * floor))
}

export function formatRemainingTime(remainingSeconds) {
    const seconds = Math.max(0, Math.floor(remainingSeconds || 0))
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m`
    return 'Now'
}
