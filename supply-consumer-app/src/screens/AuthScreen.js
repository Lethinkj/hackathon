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
import { sendPhoneOtp, signIn, signUp, verifyPhoneOtp } from '../lib/api'

const DEFAULT_COORDS = { lat: 12.9716, lng: 77.5946 }

export default function AuthScreen({ onAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true)
  const [authMethod, setAuthMethod] = useState('email')
  const [showMethodDropdown, setShowMethodDropdown] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    otp: '',
    role: 'consumer',
  })

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function onSubmit() {
    setLoading(true)
    try {
      if (authMethod === 'phone') {
        if (!form.phone) {
          Alert.alert('Missing phone', 'Please enter your phone in E.164 format, for example +15551234567.')
          return
        }

        if (!otpSent) {
          await sendPhoneOtp({ phone: form.phone.trim(), channel: 'sms' })
          setOtpSent(true)
          Alert.alert('OTP sent', 'Enter the code sent to your phone.')
          return
        }

        if (!form.otp) {
          Alert.alert('Missing OTP', 'Please enter the OTP code.')
          return
        }

        const user = await verifyPhoneOtp({
          phone: form.phone.trim(),
          token: form.otp.trim(),
          type: 'sms',
          name: form.name.trim() || undefined,
          role: form.role,
          lat: DEFAULT_COORDS.lat,
          lng: DEFAULT_COORDS.lng,
          capacity: form.role === 'ngo' ? 20 : null,
        })

        onAuthenticated(user)
        return
      }

      if (!form.email || !form.password || (!isLogin && !form.name)) {
        Alert.alert('Missing fields', 'Please fill all required fields.')
        return
      }

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
      Alert.alert('Authentication failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  function onToggleMode(nextLoginState) {
    setIsLogin(nextLoginState)
    setOtpSent(false)
    set('otp', '')
  }

  function onSwitchMethod(nextMethod) {
    setAuthMethod(nextMethod)
    setShowMethodDropdown(false)
    setOtpSent(false)
    set('otp', '')
  }

  const authMethodLabel = authMethod === 'phone' ? 'Mobile Number' : 'Email'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <View style={styles.logoScooterBase} />
            <View style={styles.logoBox} />
            <View style={styles.logoWheelLeft} />
            <View style={styles.logoWheelRight} />
            <View style={styles.logoHead} />
            <View style={styles.logoArm} />
            <View style={styles.logoBody} />
            <View style={styles.logoLeg} />
            <View style={styles.logoTail} />
            <View style={styles.logoHandle} />
          </View>
        </View>
        <Text style={styles.subtitle}>{isLogin ? 'Login to continue' : 'Create your account'}</Text>

        <View style={styles.dropdownWrap}>
          <Text style={styles.dropdownLabel}>Sign in with</Text>
          <Pressable style={styles.dropdownButton} onPress={() => setShowMethodDropdown((prev) => !prev)}>
            <Text style={styles.dropdownValue}>{authMethodLabel}</Text>
            <Text style={styles.dropdownChevron}>{showMethodDropdown ? '▲' : '▼'}</Text>
          </Pressable>
          {showMethodDropdown ? (
            <View style={styles.dropdownMenu}>
              <Pressable style={styles.dropdownItem} onPress={() => onSwitchMethod('email')}>
                <Text style={styles.dropdownItemText}>Email</Text>
              </Pressable>
              <Pressable style={styles.dropdownItem} onPress={() => onSwitchMethod('phone')}>
                <Text style={styles.dropdownItemText}>Mobile Number</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

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

        {!isLogin ? (
          <TextInput
            value={form.name}
            onChangeText={(value) => set('name', value)}
            placeholder={form.role === 'ngo' ? 'Organization name' : 'Full name'}
            style={styles.input}
            autoCapitalize="words"
          />
        ) : null}

        {authMethod === 'email' ? (
          <>
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
          </>
        ) : (
          <>
            <TextInput
              value={form.phone}
              onChangeText={(value) => set('phone', value)}
              placeholder="Phone (e.g. +15551234567)"
              style={styles.input}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            {otpSent ? (
              <TextInput
                value={form.otp}
                onChangeText={(value) => set('otp', value)}
                placeholder="Enter OTP"
                style={styles.input}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
            ) : null}
          </>
        )}

        <Pressable style={[styles.button, loading && styles.disabled]} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {authMethod === 'phone'
                ? otpSent
                  ? 'Verify OTP'
                  : 'Send OTP'
                : isLogin
                  ? 'Login'
                  : 'Register'}
            </Text>
          )}
        </Pressable>

        {authMethod === 'phone' && otpSent ? (
          <Pressable
            onPress={async () => {
              if (loading) return
              if (!form.phone) {
                Alert.alert('Missing phone', 'Please enter your phone number first.')
                return
              }
              try {
                setLoading(true)
                await sendPhoneOtp({ phone: form.phone.trim(), channel: 'sms' })
                Alert.alert('OTP resent', 'A new code has been sent.')
              } catch (err) {
                Alert.alert('Resend failed', err.message)
              } finally {
                setLoading(false)
              }
            }}
          >
            <Text style={styles.toggleText}>Resend OTP</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => onToggleMode(!isLogin)}>
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
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#b70b0b',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoScooterBase: {
    position: 'absolute',
    bottom: 14,
    left: 38,
    width: 38,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 999,
  },
  logoBox: {
    position: 'absolute',
    left: 10,
    bottom: 34,
    width: 24,
    height: 22,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  logoWheelLeft: {
    position: 'absolute',
    left: 14,
    bottom: 22,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  logoWheelRight: {
    position: 'absolute',
    left: 66,
    bottom: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  logoHead: {
    position: 'absolute',
    top: 16,
    left: 52,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },
  logoArm: {
    position: 'absolute',
    top: 34,
    left: 48,
    width: 8,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '16deg' }],
  },
  logoBody: {
    position: 'absolute',
    top: 40,
    left: 48,
    width: 16,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '-10deg' }],
  },
  logoLeg: {
    position: 'absolute',
    top: 58,
    left: 62,
    width: 8,
    height: 34,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '24deg' }],
  },
  logoTail: {
    position: 'absolute',
    top: 52,
    left: 31,
    width: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  logoHandle: {
    position: 'absolute',
    top: 40,
    left: 64,
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '18deg' }],
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#991b1b',
  },
  dropdownWrap: {
    marginBottom: 12,
  },
  dropdownLabel: {
    color: '#991b1b',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  dropdownValue: {
    color: '#7f1d1d',
    fontWeight: '600',
  },
  dropdownChevron: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
  },
  dropdownItemText: {
    color: '#7f1d1d',
    fontWeight: '600',
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
