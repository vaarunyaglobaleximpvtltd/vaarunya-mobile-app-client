import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Trash2,
    Plus,
    Package,
    Truck,
    Ship,
    Plane,
    TrendingUp,
    CheckCircle2,
    Info
} from 'lucide-react-native';

// Constants
const VOLUME_FACTORS = {
    AIR: 167,
    SEA: 1000,
    ROAD: 333
};

const CONTAINERS = [
    { name: "20' Standard", capacity: 33 },
    { name: "40' Standard", capacity: 66 },
    { name: "40' High Cube", capacity: 72 },
    { name: "45' High Cube", capacity: 86 }
];

interface ShipmentItem {
    id: string;
    length: string;
    width: string;
    height: string;
    quantity: string;
    weightPerPkg: string;
    unit: 'Meter' | 'CM' | 'Inches';
}

export default function CbmCalculatorScreen() {
    const router = useRouter();
    const [unit, setUnit] = useState<'Meter' | 'CM' | 'Inches'>('CM');
    const [items, setItems] = useState<ShipmentItem[]>([
        { id: '1', length: '', width: '', height: '', quantity: '1', weightPerPkg: '', unit: 'CM' }
    ]);
    const [lclRate, setLclRate] = useState('60');
    const [fclRate, setFclRate] = useState('1200');

    const convertToMeters = (val: number, fromUnit: string) => {
        if (fromUnit === 'CM') return val / 100;
        if (fromUnit === 'Inches') return val * 0.0254;
        return val;
    };

    const addItem = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            length: '', width: '', height: '', quantity: '1', weightPerPkg: '',
            unit
        }]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof ShipmentItem, value: string) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const totals = useMemo(() => {
        let totalCbm = 0;
        let totalWeight = 0;
        let totalOriginalVolume = 0;

        items.forEach(item => {
            const l = parseFloat(item.length) || 0;
            const w = parseFloat(item.width) || 0;
            const h = parseFloat(item.height) || 0;
            const q = parseInt(item.quantity) || 0;
            const wt = parseFloat(item.weightPerPkg) || 0;

            const l_m = convertToMeters(l, item.unit);
            const w_m = convertToMeters(w, item.unit);
            const h_m = convertToMeters(h, item.unit);

            totalCbm += (l_m * w_m * h_m) * q;
            totalWeight += wt * q;
            totalOriginalVolume += (l * w * h) * q;
        });

        const totalCft = totalCbm * 35.3147;

        return { totalCbm, totalWeight, totalCft, totalOriginalVolume };
    }, [items]);

    const chargeableWeights = useMemo(() => {
        const { totalCbm, totalWeight } = totals;
        return {
            air: Math.max(totalWeight, totalCbm * VOLUME_FACTORS.AIR),
            sea: Math.max(totalWeight, totalCbm * VOLUME_FACTORS.SEA),
            road: Math.max(totalWeight, totalCbm * VOLUME_FACTORS.ROAD),
            volAir: totalCbm * VOLUME_FACTORS.AIR,
            volSea: totalCbm * VOLUME_FACTORS.SEA,
            volRoad: totalCbm * VOLUME_FACTORS.ROAD,
        };
    }, [totals]);

    const recommendation = useMemo(() => {
        const { totalCbm } = totals;
        const lclTotal = totalCbm * (parseFloat(lclRate) || 0);
        const fclTotal = parseFloat(fclRate) || 0;

        const isFclBetter = totalCbm > 0 && lclTotal > fclTotal;

        // Container suggestion
        let container = "Multi-Container";
        for (const c of CONTAINERS) {
            if (totalCbm <= c.capacity) {
                container = c.name;
                break;
            }
        }

        return {
            mode: isFclBetter ? 'FCL' : 'LCL',
            container,
            lclTotal,
            fclTotal
        };
    }, [totals, lclRate, fclRate]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={28} color="#2ecc71" />
                    </TouchableOpacity>
                    <Text style={styles.title}>CBM Calculator</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Unit Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Global Configuration</Text>
                        <View style={styles.unitSelector}>
                            {(['Meter', 'CM', 'Inches'] as const).map((u) => (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.unitTab, unit === u && styles.activeUnitTab]}
                                    onPress={() => setUnit(u)}
                                >
                                    <Text style={[styles.unitBeforeText, unit === u && styles.activeUnitBeforeText]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Packages Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Packages / Items</Text>
                            <TouchableOpacity style={styles.addButton} onPress={addItem}>
                                <Plus size={20} color="#fff" />
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {items.map((item, index) => (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.indexCircle}>
                                        <Text style={styles.indexText}>{index + 1}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                                        <Trash2 size={20} color="#e74c3c" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputGrid}>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>L ({item.unit})</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={item.length}
                                            onChangeText={(v) => updateItem(item.id, 'length', v)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#555"
                                        />
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>B ({item.unit})</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={item.width}
                                            onChangeText={(v) => updateItem(item.id, 'width', v)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#555"
                                        />
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>H ({item.unit})</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={item.height}
                                            onChangeText={(v) => updateItem(item.id, 'height', v)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#555"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGrid}>
                                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                                        <Text style={styles.inputLabel}>Quantity</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={item.quantity}
                                            onChangeText={(v) => updateItem(item.id, 'quantity', v)}
                                            keyboardType="numeric"
                                            placeholder="1"
                                            placeholderTextColor="#555"
                                        />
                                    </View>
                                    <View style={[styles.inputWrapper, { flex: 2 }]}>
                                        <Text style={styles.inputLabel}>Wt / Package (Kg)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={item.weightPerPkg}
                                            onChangeText={(v) => updateItem(item.id, 'weightPerPkg', v)}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            placeholderTextColor="#555"
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Summary Section */}
                    <View style={styles.totalCard}>
                        <View style={styles.totalRow}>
                            <View style={styles.totalItem}>
                                <Package size={20} color="#2ecc71" />
                                <Text style={styles.totalValue}>{totals.totalCbm.toFixed(4)}</Text>
                                <Text style={styles.totalLabel}>Total CBM</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.totalItem}>
                                <TrendingUp size={20} color="#3498db" />
                                <Text style={styles.totalValue}>{totals.totalCft.toFixed(2)}</Text>
                                <Text style={styles.totalLabel}>Total CFT</Text>
                            </View>
                        </View>

                        {unit !== 'Meter' && (
                            <View style={styles.altUnitRow}>
                                <Info size={14} color="#a0a0a0" />
                                <Text style={styles.altUnitText}>
                                    {totals.totalOriginalVolume.toLocaleString()} {unit === 'CM' ? 'cm³' : 'in³'} (Input Volume)
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Chargeable Weights */}
                    <Text style={styles.sectionLabel}>Chargeable Weights</Text>
                    <View style={styles.cwContainer}>
                        <View style={[styles.cwCard, { borderTopColor: '#3498db' }]}>
                            <Plane size={24} color="#3498db" />
                            <Text style={styles.cwMode}>Air</Text>
                            <Text style={styles.cwValue}>{chargeableWeights.air.toFixed(1)} Kg</Text>
                            <Text style={styles.volWt}>Vol: {chargeableWeights.volAir.toFixed(1)}kg</Text>
                        </View>
                        <View style={[styles.cwCard, { borderTopColor: '#2ecc71' }]}>
                            <Ship size={24} color="#2ecc71" />
                            <Text style={styles.cwMode}>Sea</Text>
                            <Text style={styles.cwValue}>{chargeableWeights.sea.toFixed(1)} Kg</Text>
                            <Text style={styles.volWt}>Vol: {chargeableWeights.volSea.toFixed(1)}kg</Text>
                        </View>
                        <View style={[styles.cwCard, { borderTopColor: '#e67e22' }]}>
                            <Truck size={24} color="#e67e22" />
                            <Text style={styles.cwMode}>Road</Text>
                            <Text style={styles.cwValue}>{chargeableWeights.road.toFixed(1)} Kg</Text>
                            <Text style={styles.volWt}>Vol: {chargeableWeights.volRoad.toFixed(1)}kg</Text>
                        </View>
                    </View>

                    {/* Recommendation */}
                    <View style={styles.recCard}>
                        <View style={styles.recHeader}>
                            <CheckCircle2 size={20} color="#2ecc71" />
                            <Text style={styles.recTitle}>Logistics Suggestion</Text>
                        </View>

                        <View style={styles.recRow}>
                            <View style={styles.recItem}>
                                <Text style={styles.recLabel}>Freight Mode</Text>
                                <Text style={[styles.recValue, { color: recommendation.mode === 'FCL' ? '#e74c3c' : '#2ecc71' }]}>
                                    {recommendation.mode}
                                </Text>
                            </View>
                            <View style={styles.recItem}>
                                <Text style={styles.recLabel}>Container Size</Text>
                                <Text style={styles.recValue}>{recommendation.container}</Text>
                            </View>
                        </View>

                        <View style={styles.costCompare}>
                            <View style={styles.costItem}>
                                <Text style={styles.costLabel}>LCL Est. Cost</Text>
                                <Text style={styles.costValue}>${recommendation.lclTotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.costDivider} />
                            <View style={styles.costItem}>
                                <Text style={styles.costLabel}>FCL 20ft Rate</Text>
                                <Text style={styles.costValue}>${recommendation.fclTotal.toFixed(2)}</Text>
                            </View>
                        </View>

                        <View style={styles.configInline}>
                            <View style={styles.configInput}>
                                <Text style={styles.configLabel}>LCL/CBM ($)</Text>
                                <TextInput
                                    style={styles.miniInput}
                                    value={lclRate}
                                    onChangeText={setLclRate}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.configInput}>
                                <Text style={styles.configLabel}>FCL 20ft ($)</Text>
                                <TextInput
                                    style={styles.miniInput}
                                    value={fclRate}
                                    onChangeText={setFclRate}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0c',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 60,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionLabel: {
        color: '#a0a0a0',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    unitSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 4,
    },
    unitTab: {
        flex: 1,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    activeUnitTab: {
        backgroundColor: '#2ecc71',
    },
    unitBeforeText: {
        color: '#a0a0a0',
        fontWeight: '600',
        fontSize: 13,
    },
    activeUnitBeforeText: {
        color: '#fff',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2ecc71',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        marginLeft: 4,
        fontSize: 13,
    },
    itemCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    indexCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    indexText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    inputGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    inputWrapper: {
        flex: 1,
    },
    inputLabel: {
        color: '#666',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        height: 48,
        color: '#fff',
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    totalCard: {
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.3)',
        marginBottom: 24,
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    totalValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginVertical: 4,
    },
    totalLabel: {
        color: '#a0a0a0',
        fontSize: 12,
        fontWeight: '600',
    },
    altUnitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 6,
    },
    altUnitText: {
        color: '#a0a0a0',
        fontSize: 12,
        fontStyle: 'italic',
    },
    cwContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    cwCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderTopWidth: 4,
    },
    cwMode: {
        color: '#a0a0a0',
        fontSize: 11,
        fontWeight: '700',
        marginVertical: 6,
    },
    cwValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    volWt: {
        color: '#666',
        fontSize: 10,
        marginTop: 2,
    },
    recCard: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    recHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    recTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    recRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    recItem: {
        flex: 1,
    },
    recLabel: {
        color: '#666',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    recValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    costCompare: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    costItem: {
        flex: 1,
        alignItems: 'center',
    },
    costDivider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    costLabel: {
        color: '#666',
        fontSize: 10,
        marginBottom: 4,
    },
    costValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    configInline: {
        flexDirection: 'row',
        gap: 12,
    },
    configInput: {
        flex: 1,
    },
    configLabel: {
        color: '#555',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
    },
    miniInput: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        height: 36,
        color: '#2ecc71',
        paddingHorizontal: 10,
        fontSize: 14,
        fontWeight: '700',
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.2)',
    }
});
