import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DashboardStats } from '@yakin/types'
import { formatTaka } from '@yakin/utils'
import { TrendingUp, Users, Briefcase, Clock, AlertCircle } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'

function StatTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <View style={[styles.tile, { borderLeftColor: color }]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      {sub && <Text style={styles.tileSub}>{sub}</Text>}
    </View>
  )
}

export default function HomeScreen() {
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<{ data: DashboardStats }>('/api/dashboard/stats').then(r => r.data.data),
  })

  const s = stats

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fb' }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0f2d5e" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={['#0f2d5e', '#1a4a8a']} style={styles.header}>
          <Text style={styles.greeting}>আস্সালামু আলাইকুম</Text>
          <Text style={styles.headerTitle}>ইয়াকিন গ্রুপ</Text>
          <Text style={styles.headerSub}>ব্যবসা ব্যবস্থাপনা সিস্টেম</Text>
        </LinearGradient>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
            </View>
          ) : (
            <>
              {/* Alert */}
              {(s?.pendingApprovals ?? 0) > 0 && (
                <View style={styles.alert}>
                  <AlertCircle size={16} color="#b45309" />
                  <Text style={styles.alertText}>{s?.pendingApprovals} টি অনুমোদন অপেক্ষমান</Text>
                </View>
              )}

              {/* Financial Overview */}
              <Text style={styles.sectionTitle}>আর্থিক সারসংক্ষেপ</Text>
              <View style={styles.grid}>
                <StatTile label="মোট সম্পদ"     value={formatTaka(s?.totalAssets ?? 0)}     color="#0f2d5e" />
                <StatTile label="মোট বিনিয়োগ"  value={formatTaka(s?.totalInvestment ?? 0)}  color="#0d7c5f" />
                <StatTile label="মোট আয়"        value={formatTaka(s?.totalIncome ?? 0)}      color="#0d7c5f" />
                <StatTile label="নিট লাভ/ক্ষতি"  value={formatTaka(s?.netProfitLoss ?? 0)}   color={(s?.netProfitLoss ?? 0) >= 0 ? '#0d7c5f' : '#dc2626'} />
              </View>

              {/* People */}
              <Text style={styles.sectionTitle}>সংগঠন</Text>
              <View style={styles.grid}>
                <StatTile label="মোট সদস্য"        value={String(s?.totalMembers ?? 0)}      sub={`সক্রিয়: ${s?.activeMembers ?? 0}`}  color="#0f2d5e" />
                <StatTile label="বিনিয়োগকারী"     value={String(s?.totalInvestors ?? 0)}     sub={`সক্রিয়: ${s?.activeInvestors ?? 0}`} color="#c9902a" />
                <StatTile label="কর্মী"            value={String(s?.totalEmployees ?? 0)}     color="#0f2d5e" />
                <StatTile label="প্রজেক্ট"         value={String(s?.activeProjects ?? 0)}     sub="চলমান"                               color="#0d7c5f" />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 },
  greeting: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  headerSub: { color: 'rgba(255,255,255,0.60)', fontSize: 12 },
  content: { padding: 16, gap: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0e1523', marginTop: 12, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  tile: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    width: '47%', borderLeftWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  tileLabel: { fontSize: 11, color: '#718096', marginBottom: 4 },
  tileValue: { fontSize: 15, fontWeight: '700', color: '#0e1523', fontVariant: ['tabular-nums'] },
  tileSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  loadingBox: { height: 120, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#718096', fontSize: 14 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 10, padding: 12, marginBottom: 4 },
  alertText: { fontSize: 13, color: '#92400e', flex: 1 },
})
