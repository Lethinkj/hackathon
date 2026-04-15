import { useEffect, useState } from 'react'

export default function Countdown({ expiryTime }) {
    const [timeLeft, setTimeLeft] = useState('')
    const [level, setLevel] = useState('normal')

    useEffect(() => {
        const tick = () => {
            const now = new Date()
            const diff = new Date(expiryTime) - now
            if (diff <= 0) {
                setTimeLeft('Expired')
                setLevel('urgent')
                return
            }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setTimeLeft(`${h}h ${m}m ${s}s`)
            setLevel(h < 1 ? 'urgent' : h < 2 ? 'warning-time' : 'normal')
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [expiryTime])

    return (
        <span className={`countdown ${level}`}>
            ⏳ {timeLeft}
        </span>
    )
}
