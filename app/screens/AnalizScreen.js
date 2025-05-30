import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import supabase from '../../supabaseClient';
import { BarChart, StackedBarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View as RNView } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');



// Duyguya göre renk döndüren fonksiyon (web ile aynı)
function getEmotionColor(emotion) {
  const colors = {
    'Mutluluk': '#FFD700',       // parlak altın sarısı
    'Üzüntü': '#4682B4',         // soğuk çelik mavisi
    'Öfke': '#FF4500',           // canlı turuncu-kırmızı
    'Korku': '#800080',          // koyu mor
    'Şaşkınlık': '#FF69B4',      // parlak pembe
    'İğrenme': '#228B22',        // orman yeşili
    'Nötr': '#808080',           // sade gri
    'Sevgi': '#FF1493',          // sıcak pembe
    'Hayranlık': '#00CED1',      // koyu turkuaz
    'Eğlence': '#FFA500',        // canlı turuncu
    'Rahatsızlık': '#A0522D',    // yoğun kahverengi
    'Onay': '#32CD32',           // limon yeşili
    'İlgili': '#20B2AA',         // açık deniz mavisi
    'Kafa Karışıklığı': '#BA55D3', // orkide moru
    'Merak': '#FF6347',          // domates kırmızısı
    'İstek': '#FF8C00',          // koyu turuncu
    'Hayal Kırıklığı': '#8B4513', // koyu kahverengi
    'Onaylamama': '#DC143C',     // kiraz kırmızısı
    'Utangaçlık': '#DB7093',     // soluk pembe
    'Heyecan': '#FF6347',        // domates kırmızısı
    'Minnettarlık': '#DAA520',   // altın kahverengi
    'Keder': '#4B0082',          // çivit moru
    'Gerginlik': '#B22222',      // ateş kırmızısı
    'İyimserlik': '#00FF7F',     // yayla yeşili
    'Gurur': '#FF7F50',          // mercan rengi
    'Farkındalık': '#1E90FF',    // dodger blue
    'Rahatlık': '#98FB98',       // soluk yeşil
    'Pişmanlık': '#C71585'       // orta menekşe
  };
  return colors[emotion] || `hsl(${Math.random() * 360}, 70%, 50%)`;
}

export default function AnalizScreen() {
  const [emotions, setEmotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week');
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [selectedBarData, setSelectedBarData] = useState(null);

  useEffect(() => {
    fetchEmotions();
  }, [range]);

  // Realtime aboneliği için useEffect
  useEffect(() => {
    const user = supabase.auth.user();
    const userId = user ? user.id : null;

    if (!userId) {
      console.warn('Kullanıcı oturumu bulunamadı, realtime aboneliği başlatılamıyor!');
      return;
    }

    const subscription = supabase
      .from('emotions')
      .on('*', payload => {
        console.log('Realtime Değişiklik:', payload);

        const changedEmotionEntry = payload.new;

        setEmotions(prevEmotions => {
          if (payload.eventType === 'INSERT') {
             const newEntry = {
                ...changedEmotionEntry,
                emotions: typeof changedEmotionEntry.emotions === 'string' ? JSON.parse(changedEmotionEntry.emotions) : changedEmotionEntry.emotions,
             };
             const filteredPrev = prevEmotions.filter(e => e.id !== newEntry.id);
             return [newEntry, ...filteredPrev];

          } else if (payload.eventType === 'UPDATE') {
            const updatedEntry = {
               ...changedEmotionEntry,
               emotions: typeof changedEmotionEntry.emotions === 'string' ? JSON.parse(changedEmotionEntry.emotions) : changedEmotionEntry.emotions,
            };
             return prevEmotions.map(entry =>
               entry.id === updatedEntry.id ? updatedEntry : entry
             );
          } else if (payload.eventType === 'DELETE') {
             return prevEmotions.filter(entry => entry.id !== payload.old.id);
          }
          return prevEmotions;
        });

      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []); // Boş dependency array, sadece mount/unmount olduğunda çalışır

  const fetchEmotions = async () => {
    setLoading(true);

    try {
      const user = supabase.auth.user();
      const userId = user ? user.id : null;
      console.log('🟣 Analiz ekranı - kullanıcı id:', userId);

      if (!userId) {
        console.warn('Kullanıcı oturumu bulunamadı!');
        setEmotions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('emotions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Veri çekme hatası:', error);
        setEmotions([]);
      } else {
        // ✅ JSON formatındaki emotions verisini parse et
        const parsedData = data.map(entry => ({
          ...entry,
          emotions: typeof entry.emotions === 'string' ? JSON.parse(entry.emotions) : entry.emotions,
        }));
        console.log('✅ Parsed emotions:', parsedData);
        setEmotions(parsedData);
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err);
      setEmotions([]);
    }

    setLoading(false);
  };

  // Duyguları haftalık/aylık filtrele
  function filterEmotionsByRange(emotions, range) {
    if (!emotions || emotions.length === 0) return [];
    const now = new Date();
    let startDate;
    if (range === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6); // Son 7 gün
    } else if (range === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1); // Son 1 ay
    } else {
      return emotions;
    }
    return emotions.filter(entry => new Date(entry.created_at) >= startDate);
  }

  // En sık duygu hesaplama
  function getMostFrequentEmotion(emotions) {
    if (!emotions || emotions.length === 0) return 'Veri yok';
    const counts = {};
    emotions.forEach(entry =>
      (Array.isArray(entry.emotions) ? entry.emotions : []).forEach(e => {
        counts[e.label] = (counts[e.label] || 0) + 1;
      })
    );
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return max ? `${max[0]} (${max[1]} kez)` : 'Veri yok';
  }

  // Stacked bar chart için veri hazırla
  function prepareStackedBarData(emotions) {
    if (!emotions || emotions.length === 0) return { labels: [], legend: [], data: [], barColors: [] };
    const sorted = [...emotions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const labels = sorted.map(entry => new Date(entry.created_at).toLocaleDateString('tr-TR'));
    const emotionLabels = Array.from(new Set(sorted.flatMap(e => (Array.isArray(e.emotions) ? e.emotions : []).map(em => em.label))));
    const data = sorted.map(entry =>
      emotionLabels.map(label => {
        const arr = Array.isArray(entry.emotions) ? entry.emotions : [];
        const found = arr.find(e => e.label === label);
        return found ? Math.round(found.score * 100) : 0;
      })
    );
    const barColors = emotionLabels.map(label => getEmotionColor(label));
    return { labels, legend: emotionLabels, data, barColors };
  }

  // Pie chart için veri hazırlama (web ile aynı)
  const preparePieData = (filtered) => {
    const counts = {};
    filtered.forEach(entry => {
      (Array.isArray(entry.emotions) ? entry.emotions : []).forEach(e => {
        counts[e.label] = (counts[e.label] || 0) + 1;
      });
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    let startAngle = 0;
    return Object.entries(counts).map(([label, value]) => {
      const percentage = Math.round((value / total) * 100);
      const angle = (value / total) * 360;
      const endAngle = startAngle + angle;

      // Calculate arc path
      const radius = 80; // Adjust as needed
      const centerX = 100; // Adjust as needed
      const centerY = 100; // Adjust as needed

      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = [
        `M ${centerX},${centerY}`,
        `L ${start.x},${start.y}`,
        `A ${radius},${radius} 0 ${largeArcFlag} 0 ${end.x},${end.y}`,
        'Z'
      ].join(' ');

      // Calculate text position
      const textRadius = radius / 2; // Position text in the middle of the slice
      const textAngle = startAngle + angle / 2;
      const textPos = polarToCartesian(centerX, centerY, textRadius, textAngle);

      startAngle = endAngle; // Update start angle for the next slice

      return {
        label,
        percentage,
        value,
        color: getEmotionColor(label),
        path,
        textPos,
      };
    });
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const renderPieChart = () => {
    if (!filtered.length) return null;

    const pieData = preparePieData(filtered);
    const chartWidth = width * 0.55;
    const chartHeight = 220;
    const svgCenterX = chartWidth / 2;
    const svgCenterY = chartHeight / 2;
    const radius = Math.min(svgCenterX, svgCenterY) * 0.8; // Adjust radius as needed

    // Calculate total once before mapping
    const totalEmotionCount = pieData.reduce((sum, slice) => sum + slice.value, 0) || 1;

    // Recalculate path and textPos with dynamic center and radius
    let startAngle = 0;
    const dataWithPos = pieData.map(slice => {
        // Corrected: Use the total emotion count for angle calculation
        const angle = (slice.value / totalEmotionCount) * 360; // Use value from preparePieData and totalEmotionCount
        const endAngle = startAngle + angle;

        const start = polarToCartesian(svgCenterX, svgCenterY, radius, endAngle);
        const end = polarToCartesian(svgCenterX, svgCenterY, radius, startAngle);
        const largeArcFlag = angle > 180 ? 1 : 0;

        const path = [
          `M ${svgCenterX},${svgCenterY}`,
          `L ${start.x},${start.y}`,
          `A ${radius},${radius} 0 ${largeArcFlag} 0 ${end.x},${end.y}`,
          'Z'
        ].join(' ');

        const textRadius = radius * 0.6; // Position text closer to center
        const textAngle = startAngle + angle / 2;
        const textPos = polarToCartesian(svgCenterX, svgCenterY, textRadius, textAngle);

        startAngle = endAngle;

        return {...slice, path, textPos, angle};
    });

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Duygu Dağılımı </Text>
        <Text style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>Seçili aralıktaki duyguların oranlarını pasta grafik olarak görebilirsiniz.</Text>
        <RNView style={{flexDirection: 'column', alignItems: 'center'}}>
          <Svg width={chartWidth} height={chartHeight}>
            <G origin={`${svgCenterX}, ${svgCenterY}`}> {/* Center the group */}
              {dataWithPos.map((slice, index) => (
                <Path
                  key={slice.label}
                  d={slice.path}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
              {dataWithPos.map((slice, index) => (
                <SvgText
                  key={`${slice.label}-text`}
                  x={slice.textPos.x}
                  y={slice.textPos.y}
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {`${slice.percentage}%`}
                </SvgText>
              ))}
            </G>
          </Svg>

          {/* Custom Legend */}
          <RNView style={{marginTop: 16}}>
            {dataWithPos.map((item) => (
              <RNView key={item.label} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                <RNView style={{width: 16, height: 16, backgroundColor: item.color, borderRadius: 8, marginRight: 8}} />
                <Text style={{color: '#333', fontWeight: 'bold', fontSize: 14}}>
                  {item.label} ({item.value} kez)
                </Text>
              </RNView>
            ))}
          </RNView>
        </RNView>

        {selectedSlice && (
          <RNView style={styles.selectedSliceDetail}>
            <Text style={styles.selectedSliceText}>{selectedSlice.labelOnly}: {selectedSlice.count} kez</Text>
          </RNView>
        )}
      </View>
    );
  };

  // Bar chart için veri hazırlama (yığılmış bar chart için güncellendi, web mantığıyla uyumlu)
  const renderBarChart = () => {
    if (!filtered.length) return null;

    const barChartData = prepareStackedBarData(filtered);
    const chartWidth = Math.max(width * 0.95, barChartData.labels.length * 80);

    if (!barChartData.labels || barChartData.labels.length === 0 || !barChartData.data || barChartData.data.length === 0) {
      return <Text style={{ color: '#7c1fa0', marginTop: 20 }}>Bar chart için veri yok</Text>;
    }

    const chartConfig = {
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(124, 31, 160, ${opacity})`,
      labelColor: () => '#7c1fa0',
      propsForLabels: {
        fontSize: 10,
        rotation: 0,
      },
      propsForVerticalLabels: {},
    };

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Duygu Değişim Grafiği</Text>
        <Text style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
          Duygularınızın zaman içindeki değişimini ve yoğunluğunu gösteren yığılmış bar grafik.
        </Text>
        <View style={styles.legendContainerBarChart}>
          {barChartData.legend.map((label, idx) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: barChartData.barColors[idx] }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <StackedBarChart
            data={{
              labels: barChartData.labels,
              data: barChartData.data,
              barColors: barChartData.barColors,
              legend: [],
            }}
            width={chartWidth}
            height={250}
            chartConfig={chartConfig}
            style={{ borderRadius: 16 }}
            showLegend={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
          />
        </ScrollView>
      </View>
    );
  };

  const filtered = filterEmotionsByRange(emotions, range);

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Duygu Analizi İstatistikleri</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, range === 'week' && styles.tabActive]}
            onPress={() => setRange('week')}
          >
            <Text style={[styles.tabText, range === 'week' && styles.tabTextActive]}>Haftalık</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, range === 'month' && styles.tabActive]}
            onPress={() => setRange('month')}
          >
            <Text style={[styles.tabText, range === 'month' && styles.tabTextActive]}>Aylık</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>En Sık Duygu</Text>
          <Text style={styles.mostFrequent}>{getMostFrequentEmotion(filtered)}</Text>
        </View>

        {renderBarChart()}

        {renderPieChart()}

        {selectedSlice && (
          <RNView style={styles.selectedSliceDetail}>
            <Text style={styles.selectedSliceText}>{selectedSlice.labelOnly}: {selectedSlice.count} kez</Text>
          </RNView>
        )}

        {!loading && filtered.length === 0 && (
          <Text style={{ color: '#7c1fa0', marginTop: 20 }}>Henüz veri yok</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { alignItems: 'center', paddingVertical: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tab: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', marginHorizontal: 4 },
  tabActive: { backgroundColor: '#ee00ee' },
  tabText: { color: '#7c1fa0', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: 20, marginVertical: 10, width: '92%', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#7c1fa0', marginBottom: 8 },
  mostFrequent: { fontSize: 20, fontWeight: 'bold', color: '#ee00ee', marginTop: 8 },
  selectedSliceDetail: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ee00ee',
    alignSelf: 'center',
  },
  selectedSliceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c1fa0',
  },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    width: '92%',
    alignItems: 'center',
  },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#7c1fa0', marginBottom: 8 },
  legendContainerBarChart: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping for many emotions
    justifyContent: 'center', // Center legend items
    alignItems: 'center',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5, // Add bottom margin for wrapping
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedBarDetail: {
    marginTop: 10,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7c1fa0',
    width: '92%',
    alignSelf: 'center',
  },
  selectedBarDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c1fa0',
    marginBottom: 5,
  },
  selectedBarDetailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
});
