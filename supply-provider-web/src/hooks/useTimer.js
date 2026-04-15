import { useEffect, useState } from 'react'

export default function useTimer(expiryTime) {
    const getRemainingSeconds = () => {
        if (!expiryTime) return 0
        return Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
    }

    const [remainingSeconds, setRemainingSeconds] = useState(getRemainingSeconds)

    useEffect(() => {
        setRemainingSeconds(getRemainingSeconds())

        const interval = setInterval(() => {
            setRemainingSeconds(getRemainingSeconds())
        }, 1000)

        return () => clearInterval(interval)
    }, [expiryTime])

    return remainingSeconds
}
