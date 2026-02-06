import React, { useState, useMemo, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TrendingUp, ChevronLeft, ChevronUp, ChevronDown, Search } from 'lucide-react-native';
import axios from 'axios';
import PriceChart from '../components/PriceChart';
import { SectionList } from 'react-native';

const API_BASE = 'https://vaarunya-mobile-app.vercel.app/api';

export default function DetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const commodity = params.commodity ? JSON.parse(params.commodity as string) : {};
    const records = params.records ? JSON.parse(params.records as string) : [];

    useEffect(() => {
        if (records.length > 0) {
            const units = Array.from(new Set(records.map((r: any) => r.unit_name_price || 'Unit')));
            console.log(`[DEBUG] Details Screen Loaded for: ${commodity.cmdt_name}`);
            console.log(`[DEBUG] Available Unit Name Prices:`, units);
        }
    }, [commodity.cmdt_name, records.length]);

    const [selectedSource, setSelectedSource] = useState('All');
    const [priceHistory, setPriceHistory] = useState<any[]>([]);
    const [duration, setDuration] = useState('1M');
    const [marketSearch, setMarketSearch] = useState('');

    const toTitleCase = (str: string) => {
        return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
    };

    useEffect(() => {
        if (commodity.cmdt_name) {
            fetchHistory();
        }
    }, [commodity.cmdt_name, duration]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_BASE}/history`, {
                params: { commodity_name: commodity.cmdt_name, duration }
            });
            if (res.data && Array.isArray(res.data)) {
                // Apply 15% bump to historical prices for Vaarunya Trend
                const bumpedData = res.data.map((h: any) => ({
                    ...h,
                    price: Math.round(h.price * 1.15)
                }));
                setPriceHistory(bumpedData);
            }
        } catch (err) {
            console.log("Failed to fetch history", err);
        }
    };
    const [selectedState, setSelectedState] = useState('All');
    const [selectedSubFilter, setSelectedSubFilter] = useState('All');
    const [sortField, setSortField] = useState<'price' | 'market'>('price');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Extract Unique States (Normalized to Title Case)
    const uniqueStates = useMemo(() => {
        const states = new Set<string>();
        records.forEach((r: any) => {
            if (r.state_name) {
                states.add(toTitleCase(r.state_name));
            }
        });
        return ['All', ...Array.from(states).sort()];
    }, [records]);

    // Extract Sub-Filters based on source (District for AGMARK, APMC for eNAM)
    const uniqueSubFilters = useMemo(() => {
        if (selectedState === 'All') return ['All'];
        const items = new Set<string>();
        records.forEach((r: any) => {
            // Case-insensitive state comparison
            if (toTitleCase(r.state_name || '') === selectedState) {
                if (selectedSource === 'eNAM') {
                    // eNAM uses market_name as the primary regional filter (APMC)
                    if (r.market_name) items.add(toTitleCase(r.market_name));
                } else if (selectedSource === 'AGMARK') {
                    // AGMARK uses district_name, fallback to market_name if missing
                    const location = r.district_name || r.market_name;
                    if (location) items.add(toTitleCase(location));
                } else {
                    // All Sources - Combine Districts and APMCs
                    const location = r.source === 'eNAM' ? r.market_name : (r.district_name || r.market_name);
                    if (location) items.add(toTitleCase(location));
                }
            }
        });
        return ['All', ...Array.from(items).sort()];
    }, [records, selectedState, selectedSource]);

    const subFilterLabel = useMemo(() => {
        if (selectedSource === 'eNAM') return 'SELECT APMC';
        if (selectedSource === 'AGMARK') return 'SELECT DISTRICT';
        return 'SELECT DISTRICT / APMC';
    }, [selectedSource]);

    const aggregateData = useMemo(() => {
        if (records.length === 0) return { maxTraded: 0, avgPrice: 0 };
        let maxTrd = 0;
        let totalPrice = 0;
        let count = 0;

        records.forEach((r: any) => {
            const trd = parseFloat(r.commodity_traded) || 0;
            if (trd > maxTrd) maxTrd = trd;
            const price = parseFloat(String(r.model_price).replace(/,/g, '')) || 0;
            if (price > 0) {
                totalPrice += price;
                count++;
            }
        });

        return {
            maxTraded: maxTrd,
            avgPrice: count > 0 ? totalPrice / count : 0
        };
    }, [records]);

    const filteredAndSortedRecords = useMemo(() => {
        let data = records.filter((r: any) => {
            // Source Filter
            if (selectedSource !== 'All') {
                const src = r.source === 'eNAM' ? 'eNAM' : 'AGMARK';
                if (src !== selectedSource) return false;
            }
            // State Filter (Case Insensitive)
            if (selectedState !== 'All') {
                if (toTitleCase(r.state_name || '') !== selectedState) return false;
            }
            // Sub-Filter (District/APMC)
            if (selectedSubFilter !== 'All') {
                if (selectedSource === 'eNAM') {
                    if (toTitleCase(r.market_name || '') !== selectedSubFilter) return false;
                } else if (selectedSource === 'AGMARK') {
                    const location = r.district_name || r.market_name;
                    if (toTitleCase(location || '') !== selectedSubFilter) return false;
                } else {
                    // All Sources logic
                    const location = r.source === 'eNAM' ? r.market_name : (r.district_name || r.market_name);
                    if (toTitleCase(location || '') !== selectedSubFilter) return false;
                }
            }
            // Market Search
            if (marketSearch) {
                if (!(r.market_name || '').toLowerCase().includes(marketSearch.toLowerCase())) return false;
            }
            return true;
        });

        // Sorting
        return data.sort((a: any, b: any) => {
            let res = 0;
            if (sortField === 'price') {
                const priceA = parseFloat(String(a.model_price).replace(/,/g, '')) || 0;
                const priceB = parseFloat(String(b.model_price).replace(/,/g, '')) || 0;
                res = priceA - priceB;
            } else {
                const nameA = (a.market_name || '').toLowerCase();
                const nameB = (b.market_name || '').toLowerCase();
                res = nameA.localeCompare(nameB);
            }
            return sortDirection === 'asc' ? res : -res;
        });
    }, [records, selectedSource, selectedState, selectedSubFilter, sortField, sortDirection, marketSearch]);

    const handleSort = (field: 'price' | 'market') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const renderHeader = () => (
        <View style={styles.tableHeader}>
            <TouchableOpacity
                style={[styles.headerCell, { flex: 1.6, justifyContent: 'flex-start' }]}
                onPress={() => handleSort('market')}
            >
                <Text style={styles.headerText}>Market</Text>
                {sortField === 'market' && (
                    sortDirection === 'asc' ? <ChevronUp size={12} color="#2ecc71" /> : <ChevronDown size={12} color="#2ecc71" />
                )}
            </TouchableOpacity>

            <View style={[styles.headerCell, { flex: 0.6, justifyContent: 'center' }]}>
                <Text style={styles.headerText}>Score</Text>
            </View>

            <View style={[styles.headerCell, { flex: 0.8, justifyContent: 'flex-end' }]}>
                <Text style={styles.headerText}>Min</Text>
            </View>

            <View style={[styles.headerCell, { flex: 0.8, justifyContent: 'flex-end' }]}>
                <Text style={styles.headerText}>Max</Text>
            </View>

            <TouchableOpacity
                style={[styles.headerCell, { flex: 0.9, justifyContent: 'flex-end' }]}
                onPress={() => handleSort('price')}
            >
                <Text style={styles.headerText}>Avg</Text>
                {sortField === 'price' && (
                    sortDirection === 'asc' ? <ChevronUp size={12} color="#2ecc71" /> : <ChevronDown size={12} color="#2ecc71" />
                )}
            </TouchableOpacity>
        </View>
    );

    const renderMarketItem = ({ item, index }: { item: any; index: number }) => {
        const isEnam = item.source === 'eNAM';
        let tradeScore = 0;
        const arr = parseFloat(item.commodity_arrivals) || 0;
        const trd = parseFloat(item.commodity_traded) || 0;
        const p = parseFloat(String(item.model_price).replace(/,/g, '')) || 0;

        if (isEnam && (arr > 0 || trd > 0)) {
            // Liquidity (60%): How much of the arrivals were traded.
            // If arrivals report 0 but something was traded, we assume 100% liquidity
            const L = arr > 0 ? Math.min(1, trd / arr) : (trd > 0 ? 1 : 0);

            // Volume Significance (20%): How large is this market compared to the biggest peer
            const V = aggregateData.maxTraded > 0 ? trd / aggregateData.maxTraded : 0;

            // Price Stability (20%): How close is the price to the global average today
            const C = aggregateData.avgPrice > 0 ? (1 - Math.min(1, Math.abs(p - aggregateData.avgPrice) / aggregateData.avgPrice)) : 1;

            tradeScore = (L * 0.6 + V * 0.2 + C * 0.2) * 100;

            console.log(`[DEBUG] Score for ${item.market_name}: ${tradeScore.toFixed(2)}% | Formula: (L:${L.toFixed(2)}*0.6 + V:${V.toFixed(2)}*0.2 + C:${C.toFixed(2)}*0.2) | Values: Arr:${arr}, Trd:${trd}, Price:${p}, GlobalAvg:${aggregateData.avgPrice.toFixed(0)}, MaxTrd:${aggregateData.maxTraded}`);
        } else if (isEnam) {
            console.log(`[DEBUG] Missing Score for ${item.market_name} | Reason: Both Arrivals and Traded are 0. Raw Arrivals: ${item.commodity_arrivals}, Raw Traded: ${item.commodity_traded}`);
        }

        const minPrice = item.min_price && parseFloat(item.min_price) > 0 ? Math.round(parseFloat(item.min_price)) : '-';
        const maxPrice = item.max_price && parseFloat(item.max_price) > 0 ? Math.round(parseFloat(item.max_price)) : '-';

        let scoreColor = '#3498db'; // Default blue
        let scoreBg = 'rgba(52, 152, 219, 0.1)';
        if (tradeScore >= 80) {
            scoreColor = '#2ecc71';
            scoreBg = 'rgba(46, 204, 113, 0.1)';
        } else if (tradeScore < 40) {
            scoreColor = '#e74c3c';
            scoreBg = 'rgba(231, 76, 60, 0.1)';
        }

        return (
            <View style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)' }
            ]}>
                <View style={{ flex: 1.6, justifyContent: 'center' }}>
                    <Text style={styles.cellTextBold} numberOfLines={1}>
                        {toTitleCase(item.market_name)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View style={[styles.badge, {
                            backgroundColor: isEnam ? 'rgba(230, 126, 34, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4
                        }]}>
                            <Text style={[styles.badgeText, {
                                color: isEnam ? '#e67e22' : '#2ecc71',
                                fontSize: 9,
                                fontWeight: '700'
                            }]}>
                                {isEnam ? 'eNAM' : 'AGMARK'}
                            </Text>
                        </View>
                        <Text style={styles.cellSubText} numberOfLines={1}>
                            {toTitleCase(item.district_name || item.state_name)}
                        </Text>
                    </View>
                </View>

                <View style={{ flex: 0.6, alignItems: 'center', justifyContent: 'center' }}>
                    {tradeScore > 0 ? (
                        <View style={[styles.scorePill, { backgroundColor: scoreBg }]}>
                            <Text style={[styles.scoreText, { color: scoreColor }]}>
                                {tradeScore.toFixed(0)}%
                            </Text>
                        </View>
                    ) : (
                        <Text style={[styles.cellSubText, { color: '#444' }]}>-</Text>
                    )}
                </View>

                <View style={{ flex: 0.8, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.secondaryPriceText}>{minPrice}</Text>
                </View>

                <View style={{ flex: 0.8, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.secondaryPriceText}>{maxPrice}</Text>
                </View>

                <View style={{ flex: 0.9, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.priceCellText}>₹{item.model_price}</Text>
                    <Text style={[styles.cellSubText, { fontSize: 8, color: '#666' }]}>{item.unit_name_price}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <SectionList
                    sections={[{
                        title: 'Breakdown',
                        data: filteredAndSortedRecords
                    }]}
                    renderItem={renderMarketItem}
                    renderSectionHeader={() => (
                        <View style={{ backgroundColor: '#0a0a0c' }}>
                            <Text style={styles.sectionTitle}>
                                Market-wise Breakdown ({filteredAndSortedRecords.length})
                            </Text>
                            {renderHeader()}
                        </View>
                    )}
                    stickySectionHeadersEnabled={true}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <ChevronLeft size={28} color="#2ecc71" />
                                <Text style={styles.backText}>Back</Text>
                            </TouchableOpacity>

                            <View style={styles.heroCard}>
                                <Text style={styles.heroLabel}>Vaarunya Market Price • {commodity.cmdt_name}</Text>
                                {(() => {
                                    const unitsMap: { [unit: string]: { total: number, count: number } } = {};
                                    records.forEach((r: any) => {
                                        const unit = r.unit_name_price || 'Unit';
                                        const price = parseFloat(String(r.model_price).replace(/,/g, ''));
                                        if (!unitsMap[unit]) unitsMap[unit] = { total: 0, count: 0 };
                                        if (!isNaN(price)) {
                                            unitsMap[unit].total += price;
                                            unitsMap[unit].count++;
                                        }
                                    });
                                    const unitEntries = Object.entries(unitsMap).filter(([_, data]) => data.count > 0);

                                    if (unitEntries.length === 0) {
                                        return <Text style={styles.heroPrice}>No Data</Text>;
                                    }

                                    return unitEntries.map(([unit, data], idx) => (
                                        <View key={unit} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: idx > 0 ? 8 : 4 }}>
                                            <Text style={styles.heroPrice}>
                                                ₹{Math.round((data.total / data.count) * 1.15)}
                                            </Text>
                                            <Text style={styles.secondaryText}>{unit}</Text>
                                        </View>
                                    ));
                                })()}
                                <View style={styles.insightRow}>
                                    <TrendingUp size={16} color="#2ecc71" />
                                    <Text style={styles.insightText}>Market data from {records.length} locations</Text>
                                </View>
                            </View>

                            <View style={styles.chartSection}>
                                <View style={styles.timeSelector}>
                                    {['1W', '1M', '3M', '6M', 'ALL'].map((d) => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[styles.timeButton, duration === d && styles.activeTimeButton]}
                                            onPress={() => setDuration(d)}
                                        >
                                            <Text style={[styles.timeText, duration === d && styles.activeTimeText]}>{d}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {priceHistory.length > 1 ? (
                                    <View>
                                        <PriceChart data={priceHistory} color={priceHistory[priceHistory.length - 1].price >= priceHistory[0].price ? '#2ecc71' : '#e74c3c'} />
                                        <View style={styles.statsRow}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>V-High</Text>
                                                <Text style={styles.statValue}>₹{Math.max(...priceHistory.map(p => p.price))}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>V-Low</Text>
                                                <Text style={styles.statValue}>₹{Math.min(...priceHistory.map(p => p.price))}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Vaarunya Avg</Text>
                                                <Text style={styles.statValue}>₹{Math.round(priceHistory.reduce((a, b) => a + b.price, 0) / priceHistory.length)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.loadingChart}>
                                        <Text style={styles.secondaryText}>Loading history...</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.controlsContainer}>
                                <View style={styles.tabContainer}>
                                    {['All', 'AGMARK', 'eNAM'].map((tab) => (
                                        <TouchableOpacity
                                            key={tab}
                                            style={[styles.tab, selectedSource === tab && styles.activeTab]}
                                            onPress={() => setSelectedSource(tab)}
                                        >
                                            <Text style={[styles.tabText, selectedSource === tab && styles.activeTabText]}>{tab}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <FlatList
                                    horizontal
                                    data={uniqueStates}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.stateListContent}
                                    style={{ marginTop: 12, maxHeight: 40 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.stateChip, selectedState === item && styles.activeStateChip]}
                                            onPress={() => {
                                                setSelectedState(item);
                                                setSelectedSubFilter('All');
                                            }}
                                        >
                                            <Text style={[styles.stateChipText, selectedState === item && styles.activeStateChipText]}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={item => item}
                                />

                                {selectedState !== 'All' && uniqueSubFilters.length > 1 && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={[styles.secondaryTextSmall, { marginLeft: 4, marginBottom: 8, color: '#666' }]}>
                                            {subFilterLabel}
                                        </Text>
                                        <FlatList
                                            horizontal
                                            data={uniqueSubFilters}
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.stateListContent}
                                            style={{ maxHeight: 40 }}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={[styles.districtChip, selectedSubFilter === item && styles.activeDistrictChip]}
                                                    onPress={() => setSelectedSubFilter(item)}
                                                >
                                                    <Text style={[styles.districtChipText, selectedSubFilter === item && styles.activeDistrictChipText]}>
                                                        {item}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            keyExtractor={item => item}
                                        />
                                    </View>
                                )}

                                <View style={[styles.searchBar, { marginTop: 16 }]}>
                                    <Search size={18} color="#a0a0a0" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Search markets..."
                                        placeholderTextColor="#666"
                                        value={marketSearch}
                                        onChangeText={setMarketSearch}
                                    />
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No records found.</Text>
                    }
                />
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
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    backText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    heroCard: {
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.2)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
    },
    heroLabel: {
        color: '#a0a0a0',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroPrice: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '800',
        marginVertical: 8,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    insightText: {
        color: '#2ecc71',
        fontSize: 14,
        fontWeight: '500',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
        marginTop: 24,
    },
    secondaryText: {
        color: '#a0a0a0',
        fontSize: 12,
    },
    secondaryTextSmall: {
        color: '#a0a0a0',
        fontSize: 10,
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyText: {
        color: '#a0a0a0',
        textAlign: 'center',
        marginTop: 40,
    },
    controlsContainer: {
        marginBottom: 12,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
        marginTop: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#2ecc71',
    },
    tabText: {
        color: '#a0a0a0',
        fontWeight: '600',
        fontSize: 14,
    },
    activeTabText: {
        color: '#0a0a0c',
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
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
        fontSize: 14,
    },
    gridContainer: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        backgroundColor: '#111',
    },
    headerCell: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerText: {
        color: '#888',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
    },
    cellTextBold: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    cellSubText: {
        color: '#888',
        fontSize: 11,
    },
    secondaryPriceText: {
        color: '#777',
        fontSize: 12,
        fontWeight: '500',
    },
    priceCellText: {
        color: '#2ecc71',
        fontSize: 16,
        fontWeight: '700',
    },
    scorePill: {
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    scoreText: {
        color: '#3498db',
        fontSize: 11,
        fontWeight: '700',
    },
    stateListContent: {
        paddingRight: 16,
    },
    stateChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    activeStateChip: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
    },
    stateChipText: {
        color: '#a0a0a0',
        fontSize: 12,
        fontWeight: '600',
    },
    activeStateChipText: {
        color: '#0a0a0c',
    },
    districtChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(52, 152, 219, 0.05)',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(52, 152, 219, 0.1)',
    },
    activeDistrictChip: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    districtChipText: {
        color: '#a0a0a0',
        fontSize: 11,
        fontWeight: '600',
    },
    activeDistrictChipText: {
        color: '#fff',
    },
    chartSection: {
        marginBottom: 20,
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#222'
    },
    timeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 4
    },
    timeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    activeTimeButton: {
        backgroundColor: '#333',
    },
    timeText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    activeTimeText: {
        color: '#fff',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#666',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    loadingChart: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
