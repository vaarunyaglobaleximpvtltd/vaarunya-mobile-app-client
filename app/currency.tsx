import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCw, Info, ArrowRightLeft } from 'lucide-react-native';
import axios from 'axios';

const API_BASE = 'https://vaarunya-mobile-app.vercel.app/api';

export default function CurrencyScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState('1');
    const [loading, setLoading] = useState(false);
    const [rates, setRates] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRates = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`${API_BASE}/exchange-rates`);
            setRates(res.data.data);
        } catch (err) {
            console.error("Failed to fetch rates:", err);
            setError("Could not fetch latest rates. Please try again.");
            // Mock data for UI demonstration if API fails
            setRates({
                rbi: { USD: 83.12, date: '2024-02-03' },
                hdfc: { USD: 83.95, date: '2024-02-03' },
                lastUpdated: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const numAmount = parseFloat(amount) || 0;
    const rbiRate = rates?.rbi?.USD || 0;
    const hdfcRate = rates?.hdfc?.USD || 0;

    const rbiValue = numAmount * rbiRate;
    const hdfcValue = numAmount * hdfcRate;
    const difference = hdfcValue - rbiValue;
    const markupPercent = rbiRate > 0 ? ((hdfcRate - rbiRate) / rbiRate) * 100 : 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <ChevronLeft size={28} color="#2ecc71" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Currency Converter</Text>
                        <TouchableOpacity onPress={fetchRates}>
                            <RefreshCw size={24} color="#2ecc71" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.converterCard}>
                        <Text style={styles.label}>Amount (USD)</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.input}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.swapIcon}>
                            <ArrowRightLeft size={20} color="#2ecc71" />
                        </View>

                        <Text style={styles.label}>Target Currency</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <Text style={styles.readOnlyText}>Indian Rupee (INR)</Text>
                        </View>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 40 }} />
                    ) : rates ? (
                        <View style={styles.resultsContainer}>
                            <View style={styles.comparisonRow}>
                                <View style={styles.rateCard}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.sourceLabel}>RBI Reference</Text>
                                        <Info size={14} color="#a0a0a0" />
                                    </View>
                                    <Text style={styles.rateValue}>₹{rbiRate.toFixed(4)}</Text>
                                    <Text style={styles.convertedValue}>₹{rbiValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                                </View>

                                <View style={styles.rateCard}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.sourceLabel}>HDFC Bank Rate</Text>
                                        <Info size={14} color="#a0a0a0" />
                                    </View>
                                    <Text style={[styles.rateValue, { color: '#3498db' }]}>₹{hdfcRate.toFixed(4)}</Text>
                                    <Text style={styles.convertedValue}>₹{hdfcValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                                </View>
                            </View>

                            <View style={styles.analysisCard}>
                                <Text style={styles.analysisTitle}>Rate Analysis</Text>
                                <View style={styles.analysisRow}>
                                    <Text style={styles.analysisLabel}>Bank Markup</Text>
                                    <Text style={styles.markupValue}>+{markupPercent.toFixed(2)}%</Text>
                                </View>
                                <View style={styles.analysisRow}>
                                    <Text style={styles.analysisLabel}>Additional Cost</Text>
                                    <Text style={styles.costValue}>+₹{difference.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                                </View>
                                <Text style={styles.disclaimer}>
                                    * Rates are indicative. Actual bank rates may vary at the time of transaction.
                                </Text>
                            </View>
                        </View>
                    ) : error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}
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
    container: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    converterCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    label: {
        color: '#a0a0a0',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    currencySymbol: {
        color: '#2ecc71',
        fontSize: 20,
        fontWeight: '700',
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
    },
    readOnlyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    swapIcon: {
        alignItems: 'center',
        marginVertical: 12,
    },
    resultsContainer: {
        gap: 16,
    },
    comparisonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    rateCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sourceLabel: {
        color: '#a0a0a0',
        fontSize: 11,
        fontWeight: '700',
    },
    rateValue: {
        color: '#2ecc71',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    convertedValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    analysisCard: {
        backgroundColor: 'rgba(46, 204, 113, 0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.2)',
    },
    analysisTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    analysisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    analysisLabel: {
        color: '#a0a0a0',
        fontSize: 14,
    },
    markupValue: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: '700',
    },
    costValue: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: '700',
    },
    disclaimer: {
        color: '#666',
        fontSize: 10,
        fontStyle: 'italic',
        marginTop: 8,
    },
    errorText: {
        color: '#e74c3c',
        textAlign: 'center',
        marginTop: 20,
    },
});
