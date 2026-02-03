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
    SafeAreaView
} from 'react-native';
import axios from 'axios';
import dayjs from 'dayjs';
import { Search, ChevronRight, ChevronLeft, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const API_BASE = 'http://localhost:5050/api'; // Updated to machine IP for device connectivity

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

export default function HomeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [prices, setPrices] = useState<Record<number, PriceRecord[]>>({});
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showOnlyWithPrices, setShowOnlyWithPrices] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [selectedDate]);

    const handleForceRefresh = async () => {
        try {
            setLoading(true);
            // Trigger server-side fetch
            console.log(`Triggering background fetch for ${selectedDate}...`);
            await axios.post(`${API_BASE}/fetch/trigger`, { date: selectedDate });

            // Wait a moment before reloading data
            setTimeout(() => {
                fetchInitialData();
            }, 1000);
        } catch (err) {
            console.error("Failed to trigger background fetch:", err);
            // Even if trigger fails, try to load existing data
            fetchInitialData();
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`Fetching from ${API_BASE}...`);
            const [metaRes, priceRes] = await Promise.all([
                axios.get(`${API_BASE}/metadata`),
                axios.get(`${API_BASE}/prices?date=${selectedDate}`)
            ]);

            if (metaRes.data && metaRes.data.data) {
                setMetadata(metaRes.data.data);
                console.log(`Loaded ${metaRes.data.data.cmdt_data.length} commodities`);
            } else {
                throw new Error("Invalid metadata format");
            }

            setPrices(priceRes.data || {});
            console.log(`Loaded prices for ${Object.keys(priceRes.data || {}).length} commodities`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("Failed to fetch data:", msg);
            setError(`Connection Error: ${msg}. Check if your computer IP is ${API_BASE.split('/')[2].split(':')[0]} and server is on port 5050.`);
        } finally {
            setLoading(false);
        }
    };

    const filteredCommodities = metadata?.cmdt_data?.filter((item: Commodity) => {
        const matchesSearch = item.cmdt_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = !selectedGroup || item.cmdt_group_id === selectedGroup;
        const hasPrice = !showOnlyWithPrices || (prices[item.cmdt_id] && prices[item.cmdt_id].length > 0);
        return matchesSearch && matchesGroup && hasPrice;
    }) || [];

    const renderCommodity = ({ item }: { item: Commodity }) => {
        const itemRecords = prices[item.cmdt_id] || [];

        // Calculate Min/Max and Sources
        let totalModalPrice = 0;
        let modalPriceCount = 0;
        let totalArrivals = 0;
        let totalTraded = 0;
        const fees = new Set<string>();

        if (itemRecords.length > 0) {
            itemRecords.forEach(r => {
                const price = parseFloat(String(r.model_price).replace(/,/g, ''));
                if (!isNaN(price)) {
                    totalModalPrice += price;
                    modalPriceCount++;
                }
                fees.add(r.source === 'eNAM' ? 'eNAM' : 'AGMARK');

                // Calculate Trade Score Data
                if (r.commodity_arrivals) {
                    totalArrivals += parseFloat(String(r.commodity_arrivals)) || 0;
                }
                if (r.commodity_traded) {
                    totalTraded += parseFloat(String(r.commodity_traded)) || 0;
                }
            });
        }

        const hasData = itemRecords.length > 0 && modalPriceCount > 0;
        const avgPrice = hasData ? Math.round(totalModalPrice / modalPriceCount) : 0;
        const priceDisplay = hasData ? `₹${avgPrice}` : 'N/A';

        const hasEnam = fees.has('eNAM');
        const hasAgmark = fees.has('AGMARK');

        const rawLiquidity = totalArrivals > 0 ? (totalTraded / totalArrivals) : 0;
        const tradeScore = Math.min(100, rawLiquidity * 100);

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
                        <Text style={styles.title}>Vaarunya Prices</Text>

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
                        <Text style={styles.secondaryText}>Only items with prices ({filteredCommodities.length})</Text>
                    </TouchableOpacity>
                    <View style={styles.datePicker}>
                        <TouchableOpacity
                            onPress={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))}
                            style={{ padding: 4 }} // Add padding for touch target
                        >
                            <ChevronLeft size={20} color="#a0a0a0" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Calendar size={14} color="#a0a0a0" />
                            <Text style={styles.dateText}>{selectedDate}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))}>
                            <ChevronRight size={20} color="#a0a0a0" />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filteredCommodities}
                        renderItem={renderCommodity}
                        keyExtractor={(item) => item.cmdt_id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <Text style={styles.secondaryText}>No commodities found matching your filters.</Text>
                                <Text style={[styles.secondaryText, { marginTop: 8 }]}>Wait for the backend fetcher to populate prices.</Text>
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
        marginBottom: 16,
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
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    dateText: {
        color: '#fff',
        fontSize: 12,
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
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#a0a0a0',
    },
    checkboxActive: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
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
