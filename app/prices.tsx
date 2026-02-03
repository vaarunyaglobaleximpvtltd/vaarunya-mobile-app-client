import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    Modal,
    ScrollView
} from 'react-native';
import axios from 'axios';
import dayjs from 'dayjs';
import { Search, ChevronRight, ChevronLeft, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Calendar as RNCalendar } from 'react-native-calendars';

const API_BASE = 'https://vaarunya-mobile-app.vercel.app/api';

interface PriceRecord {
    model_price: string;
    unit_name_price?: string;
    source?: string;
    market_name?: string;
    commodity_arrivals?: string | number;
    commodity_traded?: string | number;
    [key: string]: any;
}

interface Commodity {
    cmdt_id: number;
    cmdt_name: string;
    cmdt_group_id: number;
}

interface CommodityGroup {
    id: number;
    cmdt_grp_name: string;
}

interface Metadata {
    cmdt_data: Commodity[];
    cmdt_group_data: CommodityGroup[];
}

export default function PricesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [displayData, setDisplayData] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, hasMore: false, total: 0 });
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showOnlyWithPrices, setShowOnlyWithPrices] = useState(false);

    // Date Range States
    const [fromDate, setFromDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectingType, setSelectingType] = useState<'from' | 'to'>('from');
    const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM-DD'));
    const [showMonthSelect, setShowMonthSelect] = useState(false);
    const [showYearSelect, setShowYearSelect] = useState(false);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i);

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        // Reset and fetch when filters change
        fetchInitialData();
    }, [fromDate, toDate, searchQuery, selectedGroup, showOnlyWithPrices]);

    const fetchMetadata = async () => {
        try {
            const metaRes = await axios.get(`${API_BASE}/metadata`);
            if (metaRes.data && metaRes.data.data) {
                setMetadata(metaRes.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch metadata:", err);
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`${API_BASE}/prices`, {
                params: {
                    fromDate,
                    toDate,
                    search: searchQuery,
                    groupId: selectedGroup,
                    onlyWithPrices: showOnlyWithPrices,
                    page: 1,
                    limit: 20
                }
            });

            setDisplayData(res.data.data || []);
            setPagination(res.data.pagination || { page: 1, hasMore: false, total: 0 });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Connection Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (loadingMore || !pagination.hasMore) return;

        try {
            setLoadingMore(true);
            const nextPage = pagination.page + 1;
            const res = await axios.get(`${API_BASE}/prices`, {
                params: {
                    fromDate,
                    toDate,
                    search: searchQuery,
                    groupId: selectedGroup,
                    onlyWithPrices: showOnlyWithPrices,
                    page: nextPage,
                    limit: 20
                }
            });

            setDisplayData(prev => [...prev, ...(res.data.data || [])]);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Failed to load more:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleForceRefresh = async () => {
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/fetch/trigger`, { date: toDate });
            setTimeout(() => {
                fetchInitialData();
            }, 1000);
        } catch (err) {
            fetchInitialData();
        }
    };

    const renderCommodity = ({ item }: { item: any }) => {
        const itemRecords = item.records || [];

        // Calculate Min/Max and Sources
        let totalModalPrice = 0;
        let modalPriceCount = 0;
        const fees = new Set<string>();
        let maxMarketTraded = 0;
        if (itemRecords.length > 0) {
            itemRecords.forEach((r: PriceRecord) => {
                const price = parseFloat(String(r.model_price).replace(/,/g, ''));
                if (!isNaN(price)) {
                    totalModalPrice += price;
                    modalPriceCount++;
                }
                const trd = parseFloat(String(r.commodity_traded)) || 0;
                if (trd > maxMarketTraded) maxMarketTraded = trd;

                fees.add(r.source === 'eNAM' ? 'eNAM' : 'AGMARK');
            });
        }

        const hasData = itemRecords.length > 0 && modalPriceCount > 0;
        const avgPrice = hasData ? Math.round(totalModalPrice / modalPriceCount) : 0;
        const avgPriceGlobal = modalPriceCount > 0 ? totalModalPrice / modalPriceCount : 0;
        const priceDisplay = hasData ? `₹${avgPrice}` : 'N/A';

        const hasEnam = fees.has('eNAM');
        const hasAgmark = fees.has('AGMARK');

        // Calculate Trading Score (Average of all markets using L, V, C components)
        let totalScore = 0;
        let scoreCount = 0;

        itemRecords.forEach((r: PriceRecord) => {
            const arr = parseFloat(String(r.commodity_arrivals)) || 0;
            const trd = parseFloat(String(r.commodity_traded)) || 0;
            const p = parseFloat(String(r.model_price).replace(/,/g, '')) || 0;

            if (arr > 0) {
                // Liquidity (60%)
                const L = Math.min(1, trd / arr);
                // Volume Significance (20%)
                const V = maxMarketTraded > 0 ? trd / maxMarketTraded : 0;
                // Price Stability (20%)
                const C = avgPriceGlobal > 0 ? (1 - Math.min(1, Math.abs(p - avgPriceGlobal) / avgPriceGlobal)) : 1;

                totalScore += (L * 0.6 + V * 0.2 + C * 0.2) * 100;
                scoreCount++;
            }
        });

        const tradeScore = scoreCount > 0 ? totalScore / scoreCount : 0;

        // Color logic for numerical score
        let strengthColor = '#64748b'; // Slate
        if (tradeScore >= 80) {
            strengthColor = '#10b981'; // Emerald
        } else if (tradeScore >= 40) {
            strengthColor = '#3b82f6'; // Blue
        } else if (tradeScore >= 20) {
            strengthColor = '#f59e0b'; // Amber
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/details', params: { commodity: JSON.stringify(item), records: JSON.stringify(itemRecords) } })}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.commodityName}>{item.cmdt_name}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        {hasAgmark && (
                            <View style={[styles.badge, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                                <Text style={[styles.badgeText, { color: '#2ecc71' }]}>AGMARK</Text>
                            </View>
                        )}
                        {hasEnam && (
                            <View style={[styles.badge, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}>
                                <Text style={[styles.badgeText, { color: '#e67e22' }]}>eNAM</Text>
                            </View>
                        )}
                        {!hasData && (
                            <Text style={styles.secondaryText}>No Data</Text>
                        )}
                    </View>
                </View>

                <View style={styles.priceContainer}>
                    <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                        <Text style={styles.priceText}>{priceDisplay}</Text>

                        {hasData && tradeScore > 0 && (
                            <View style={styles.strengthRow}>
                                <View style={styles.meterContainer}>
                                    <View style={[styles.meterFill, { width: `${tradeScore}%`, backgroundColor: strengthColor }]} />
                                </View>
                                <Text style={[styles.strengthText, { color: strengthColor }]}>
                                    {tradeScore.toFixed(0)}%
                                </Text>
                            </View>
                        )}

                        <Text style={styles.secondaryTextSmall}>
                            {itemRecords.length} Markets
                        </Text>
                    </View>
                    <ChevronRight size={18} color="#444" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <ChevronLeft size={28} color="#2ecc71" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Goods Prices</Text>
                        <View style={{ width: 28 }} />
                    </View>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#a0a0a0" />
                        <TextInput
                            style={styles.input}
                            placeholder="Search commodities..."
                            placeholderTextColor="#a0a0a0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[{ id: null, cmdt_grp_name: 'All' }, ...(metadata?.cmdt_group_data || [])]}
                        renderItem={({ item }: { item: { id: number | null, cmdt_grp_name: string } }) => (
                            <TouchableOpacity
                                style={[styles.pill, selectedGroup === item.id && styles.activePill]}
                                onPress={() => setSelectedGroup(item.id)}
                            >
                                <Text style={[styles.pillText, selectedGroup === item.id && styles.activePillText]}>
                                    {item.cmdt_grp_name}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => (item.id || 'all').toString()}
                        style={styles.categoryList}
                    />
                </View>

                {error && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchInitialData}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <TouchableOpacity onPress={() => setShowOnlyWithPrices(!showOnlyWithPrices)} style={styles.toggleRow}>
                        <View style={[styles.checkbox, showOnlyWithPrices && styles.checkboxActive]} />
                        <Text style={styles.secondaryText}>Only with prices ({pagination.total})</Text>
                    </TouchableOpacity>

                    <View style={styles.rangeContainer}>
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => { setSelectingType('from'); setShowCalendar(true); }}
                        >
                            <Calendar size={12} color="#2ecc71" />
                            <Text style={styles.dateLabel}>{dayjs(fromDate).format('DD MMM')}</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#444', marginHorizontal: 4 }}>-</Text>
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => { setSelectingType('to'); setShowCalendar(true); }}
                        >
                            <Text style={styles.dateLabel}>{dayjs(toDate).format('DD MMM')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date Picker Modal */}
                <Modal visible={showCalendar} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.calendarCard}>
                            <View style={styles.calendarHeader}>
                                <Text style={styles.calendarTitle}>
                                    Select {selectingType === 'from' ? 'From' : 'To'} Date
                                </Text>
                                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                                    <Text style={{ color: '#2ecc71', fontWeight: '700' }}>Done</Text>
                                </TouchableOpacity>
                            </View>

                            <RNCalendar
                                current={currentMonth}
                                key={currentMonth}
                                onDayPress={(day) => {
                                    if (selectingType === 'from') {
                                        setFromDate(day.dateString);
                                        if (dayjs(day.dateString).isAfter(dayjs(toDate))) {
                                            setToDate(day.dateString);
                                        }
                                    } else {
                                        setToDate(day.dateString);
                                        if (dayjs(day.dateString).isBefore(dayjs(fromDate))) {
                                            setFromDate(day.dateString);
                                        }
                                    }
                                }}
                                onMonthChange={(month) => setCurrentMonth(month.dateString)}
                                renderHeader={(date) => (
                                    <View style={styles.customHeader}>
                                        <TouchableOpacity onPress={() => setShowMonthSelect(!showMonthSelect)} style={styles.headerBtn}>
                                            <Text style={styles.headerBtnText}>{dayjs(date).format('MMMM')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setShowYearSelect(!showYearSelect)} style={styles.headerBtn}>
                                            <Text style={styles.headerBtnText}>{dayjs(date).format('YYYY')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                markedDates={{
                                    [fromDate]: { selected: true, startingDay: true, color: '#2ecc71' },
                                    [toDate]: { selected: true, endingDay: true, color: '#27ae60' }
                                }}
                                theme={{
                                    backgroundColor: '#1a1a1a',
                                    calendarBackground: '#1a1a1a',
                                    textSectionTitleColor: '#666',
                                    selectedDayBackgroundColor: '#2ecc71',
                                    selectedDayTextColor: '#000',
                                    todayTextColor: '#2ecc71',
                                    dayTextColor: '#fff',
                                    textDisabledColor: '#333',
                                    monthTextColor: '#fff',
                                    arrowColor: '#2ecc71',
                                }}
                            />

                            {showMonthSelect && (
                                <View style={styles.pickerOverlay}>
                                    <View style={styles.gridContainer}>
                                        {months.map((m, idx) => (
                                            <TouchableOpacity
                                                key={m}
                                                style={styles.gridItem}
                                                onPress={() => {
                                                    const newDate = dayjs(currentMonth).month(idx).format('YYYY-MM-DD');
                                                    setCurrentMonth(newDate);
                                                    setShowMonthSelect(false);
                                                }}
                                            >
                                                <Text style={styles.gridItemText}>{m}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {showYearSelect && (
                                <View style={styles.pickerOverlay}>
                                    <View style={styles.gridContainer}>
                                        {years.map(y => (
                                            <TouchableOpacity
                                                key={y}
                                                style={styles.gridItem}
                                                onPress={() => {
                                                    const newDate = dayjs(currentMonth).year(y).format('YYYY-MM-DD');
                                                    setCurrentMonth(newDate);
                                                    setShowYearSelect(false);
                                                }}
                                            >
                                                <Text style={styles.gridItemText}>{y}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>

                {loading ? (
                    <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={displayData}
                        renderItem={renderCommodity}
                        keyExtractor={(item) => item.cmdt_id.toString()}
                        contentContainerStyle={styles.listContent}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            loadingMore ? (
                                <ActivityIndicator size="small" color="#2ecc71" style={{ marginVertical: 20 }} />
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <Text style={styles.secondaryText}>No commodities found matching your filters.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0c',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2ecc71',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 16,
    },
    input: {
        flex: 1,
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
    },
    categoryList: {
        marginTop: 16,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 8,
    },
    activePill: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
    },
    pillText: {
        color: '#a0a0a0',
        fontSize: 14,
    },
    activePillText: {
        color: '#0a0a0c',
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 2,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    dateLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    calendarCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    calendarTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    customHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    headerBtn: {
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    headerBtnText: {
        color: '#2ecc71',
        fontWeight: '700',
        fontSize: 14,
    },
    pickerOverlay: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        bottom: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        zIndex: 100,
        padding: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    gridItem: {
        width: '30%',
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
    },
    gridItemText: {
        color: '#fff',
        fontWeight: '600',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#444',
    },
    checkboxActive: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
    },
    secondaryText: {
        color: '#a0a0a0',
        fontSize: 12,
    },
    secondaryTextSmall: {
        color: '#666',
        fontSize: 10,
        fontWeight: '500',
    },
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginVertical: 2,
    },
    meterContainer: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 10,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    commodityName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceText: {
        color: '#2ecc71',
        fontSize: 18,
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: 20,
    },
    errorCard: {
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
});
