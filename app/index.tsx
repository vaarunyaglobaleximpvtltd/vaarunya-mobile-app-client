import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    TrendingUp,
    RefreshCw,
    ShieldCheck,
    Truck,
    Briefcase,
    Zap,
    Users,
    FileText,
    Layout,
    Globe,
    Info,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT;

interface Feature {
    id: string;
    title: string;
    icon: React.ReactNode;
    route?: string;
    color: string;
}

const FEATURES: Feature[] = [
    {
        id: 'prices',
        title: 'Goods Prices',
        icon: <TrendingUp size={32} color="#fff" />,
        route: '/prices',
        color: '#2ecc71',
    },
    {
        id: 'currency',
        title: 'Currency Converter',
        icon: <RefreshCw size={32} color="#fff" />,
        route: '/currency',
        color: '#3498db',
    },
    {
        id: 'compliance',
        title: 'Compliance Check',
        icon: <FileText size={32} color="#fff" />,
        color: '#9b59b6',
    },
    {
        id: 'trade',
        title: 'Trade Finance',
        icon: <Briefcase size={32} color="#fff" />,
        color: '#f1c40f',
    },
    {
        id: 'insights',
        title: 'Market Insights',
        icon: <Zap size={32} color="#fff" />,
        color: '#e74c3c',
    },
    {
        id: 'directory',
        title: 'Partner Directory',
        icon: <Users size={32} color="#fff" />,
        color: '#1abc9c',
    },
    {
        id: 'docs',
        title: 'Export Docs',
        icon: <FileText size={32} color="#fff" />,
        color: '#34495e',
    },
    {
        id: 'customs',
        title: 'Customs Duty',
        icon: <Layout size={32} color="#fff" />,
        color: '#27ae60',
    },
    {
        id: 'global',
        title: 'Global Tenders',
        icon: <Globe size={32} color="#fff" />,
        color: '#2980b9',
    },
];

export default function Dashboard() {
    const router = useRouter();

    const handlePress = (feature: Feature) => {
        if (feature.route) {
            router.push(feature.route as any);
        } else {
            alert(`${feature.title} feature is coming soon!`);
        }
    };

    const renderFeature = ({ item }: { item: Feature }) => (
        <TouchableOpacity
            style={[styles.featureCard]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                {item.icon}
            </View>
            <Text style={styles.featureTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <Text style={styles.brandTitle}>Vaarunya Global</Text>
                </View>

                <FlatList
                    data={FEATURES}
                    renderItem={renderFeature}
                    keyExtractor={(item) => item.id}
                    numColumns={COLUMN_COUNT}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
    header: {
        marginTop: 20,
        marginBottom: 32,
    },
    welcomeText: {
        fontSize: 16,
        color: '#a0a0a0',
        fontWeight: '500',
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#2ecc71',
    },
    listContent: {
        paddingBottom: 20,
    },
    featureCard: {
        width: ITEM_WIDTH,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        marginHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    featureTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});
