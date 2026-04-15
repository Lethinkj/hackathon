import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { signIn, signUp } from '../lib/api'

const DEFAULT_COORDS = { lat: 12.9716, lng: 77.5946 }

export default function AuthScreen({ onAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'consumer',
  })

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function onSubmit() {
    if (!form.email || !form.password || (!isLogin && !form.name)) {
      Alert.alert('Missing fields', 'Please fill all required fields.')
      return
    }

    setLoading(true)
    try {
      const user = isLogin
        ? await signIn({ email: form.email.trim(), password: form.password })
        : await signUp({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
            lat: DEFAULT_COORDS.lat,
            lng: DEFAULT_COORDS.lng,
            capacity: form.role === 'ngo' ? 20 : null,
          })

      onAuthenticated(user)
    } catch (err) {
      Alert.alert(isLogin ? 'Login failed' : 'Registration failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Left2Lift</Text>
        <Text style={styles.subtitle}>{isLogin ? 'Login to continue' : 'Create your account'}</Text>

        {!isLogin ? (
          <View style={styles.roles}>
            {['consumer', 'ngo'].map((role) => (
              <Pressable
                key={role}
                style={[styles.roleButton, form.role === role && styles.roleButtonActive]}
                onPress={() => set('role', role)}
              >
                <Text style={[styles.roleText, form.role === role && styles.roleTextActive]}>
                  {role.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!isLogin ? (
          <TextInput
            value={form.name}
            onChangeText={(value) => set('name', value)}
            placeholder={form.role === 'ngo' ? 'Organization name' : 'Full name'}
            style={styles.input}
            autoCapitalize="words"
          />
        ) : null}

        <TextInput
          value={form.email}
          onChangeText={(value) => set('email', value)}
          placeholder="Email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={form.password}
          onChangeText={(value) => set('password', value)}
          placeholder="Password"
          style={styles.input}
          secureTextEntry
        />

        <Pressable style={[styles.button, loading && styles.disabled]} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setIsLogin((prev) => !prev)}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 18,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#b91c1c',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#991b1b',
  },
  roles: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  roleText: {
    fontWeight: '700',
    color: '#7f1d1d',
    fontSize: 12,
  },
  roleTextActive: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#7f1d1d',
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    marginTop: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  toggleText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#dc2626',
    fontWeight: '600',
  },
})
