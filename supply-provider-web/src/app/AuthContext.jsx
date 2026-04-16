import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSessionUser, signOut } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        let active = true
        getSessionUser()
            .then((nextUser) => {
                if (!active) return
                setUser(nextUser)
            })
            .catch(() => {
                if (!active) return
                setUser(null)
            })
            .finally(() => {
                if (active) setReady(true)
            })

        return () => {
            active = false
        }
    }, [])

    const value = useMemo(() => ({
        user,
        ready,
        login: (nextUser) => setUser(nextUser),
        logout: async () => {
            await signOut()
            setUser(null)
        },
    }), [user, ready])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
