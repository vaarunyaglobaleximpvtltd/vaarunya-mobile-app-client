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
import { Search, ChevronRight, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const API_BASE = 'https://vaarunya-mobile-app-server.onrender.com/api'; // Updated to machine IP for device connectivity

interface PriceRecord {
    model_price: string;
    unit_name_price?: string;
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
        const avgPrice = itemRecords.length > 0
            ? (itemRecords.reduce((acc: number, curr: PriceRecord) => acc + parseFloat(curr.model_price.replace(/,/g, '')), 0) / itemRecords.length).toFixed(2)
            : null;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/details', params: { commodity: JSON.stringify(item), records: JSON.stringify(itemRecords) } })}
            >
                <View>
                    <Text style={styles.commodityName}>{item.cmdt_name}</Text>
                    <Text style={styles.secondaryText}>{itemRecords.length} markets reported</Text>
                </View>
                <View style={styles.priceContainer}>
                    <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                        <Text style={styles.priceText}>{avgPrice ? `₹${avgPrice}` : 'N/A'}</Text>
                        <Text style={styles.secondaryTextSmall}>{itemRecords.length > 0 ? itemRecords[0].unit_name_price : 'Avg Modal'}</Text>
                    </View>
                    <ChevronRight size={20} color="#a0a0a0" />
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
                        <TouchableOpacity onPress={fetchInitialData} disabled={loading}>
                            <Text style={{ color: '#2ecc71', fontWeight: '600' }}>{loading ? '...' : 'Refresh'}</Text>
                        </TouchableOpacity>
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
                        <Calendar size={14} color="#a0a0a0" />
                        <Text style={styles.dateText}>{selectedDate}</Text>
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
        color: '#a0a0a0',
        fontSize: 10,
    },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
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
});
