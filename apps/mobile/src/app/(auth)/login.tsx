import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { api, setTokens } from '@/lib/api'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ত্রুটি', 'ইমেইল এবং পাসওয়ার্ড দিন')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password, totpCode: totpCode || undefined })
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setLoading(false)
        return
      }
      await setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken)
      router.replace('/(tabs)')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { messageBn?: string } } })?.response?.data?.messageBn ?? 'লগইন ব্যর্থ'
      Alert.alert('লগইন ব্যর্থ', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0f2d5e', '#1a4a8a']} style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>ই</Text>
        </View>
        <Text style={styles.appName}>ইয়াকিন গ্রুপ</Text>
        <Text style={styles.appSub}>ব্যবসা ব্যবস্থাপনা সিস্টেম</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>লগইন করুন</Text>

        <View style={styles.field}>
          <Text style={styles.label}>ইমেইল</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="admin@yakingroup.com"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>পাসওয়ার্ড</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#aaa"
          />
        </View>

        {requiresTwoFactor && (
          <View style={styles.field}>
            <Text style={styles.label}>দুই-ধাপ কোড</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={totpCode}
              onChangeText={setTotpCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#aaa"
            />
            <Text style={styles.hint}>অথেনটিকেটর অ্যাপ থেকে ৬ সংখ্যার কোড দিন</Text>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>লগইন করুন</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  logoCircle: { width: 72, height: 72, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  appName: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  appSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  body: { flex: 1, backgroundColor: '#f8f9fb' },
  bodyContent: { padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#0e1523', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#0e1523', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0e1523' },
  otpInput: { textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: '700' },
  hint: { fontSize: 11, color: '#718096', marginTop: 4 },
  btn: { marginTop: 8, backgroundColor: '#0f2d5e', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
