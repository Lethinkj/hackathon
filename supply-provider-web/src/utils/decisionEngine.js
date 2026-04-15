export function decideAction(ratio) {
    if (ratio > 0.5) return 'SELL'
    if (ratio > 0.2) return 'DISCOUNT'
    return 'DONATE'
}

export function getTimerColor(ratio) {
    if (ratio > 0.5) return '#1D9E75'
    if (ratio > 0.2) return '#EF9F27'
    return '#E24B4A'
}

export function getStatusClass(action) {
    if (action === 'SELL') return 'status-sell'
    if (action === 'DISCOUNT') return 'status-discount'
    return 'status-donate'
}

export function getStatusLabel(action) {
    return action
}
