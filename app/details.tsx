import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TrendingUp, ArrowLeft } from 'lucide-react-native';

export default function DetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const commodity = params.commodity ? JSON.parse(params.commodity as string) : {};
    const records = params.records ? JSON.parse(params.records as string) : [];

    const renderMarketItem = ({ item }: { item: any }) => (
        <View style={styles.marketCard}>
            <View style={styles.marketHeader}>
                <Text style={styles.marketName}>{item.market_name}</Text>
                <Text style={styles.marketPrice}>₹{item.model_price}</Text>
            </View>
            <View style={styles.marketFooter}>
                <Text style={styles.secondaryText}>{item.district_name}, {item.state_name}</Text>
                <Text style={styles.secondaryText}>{item.variety_name}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#fff" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>{commodity.cmdt_name}</Text>
                    <Text style={styles.heroPrice}>
                        {records.length > 0 ? `₹${records[0].model_price}` : 'No Data'}
                    </Text>
                    <View style={styles.insightRow}>
                        <TrendingUp size={16} color="#2ecc71" />
                        <Text style={styles.insightText}>Market data from {records.length} locations</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Market-wise Breakdown</Text>

                <FlatList
                    data={records}
                    renderItem={renderMarketItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No detailed market records available for this date.</Text>
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
        marginBottom: 24,
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
        color: '#a0a0a0',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    marketCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    marketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    marketName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    marketPrice: {
        color: '#2ecc71',
        fontSize: 16,
        fontWeight: '700',
    },
    marketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    secondaryText: {
        color: '#a0a0a0',
        fontSize: 12,
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyText: {
        color: '#a0a0a0',
        textAlign: 'center',
        marginTop: 40,
    }
});
