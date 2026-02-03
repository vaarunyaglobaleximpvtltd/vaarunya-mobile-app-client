import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import dayjs from 'dayjs';

interface PricePoint {
    date: string;
    price: number;
}

interface PriceChartProps {
    data: PricePoint[];
    height?: number;
    color?: string;
}

export default function PriceChart({ data, height = 200, color = '#2ecc71' }: PriceChartProps) {
    const { width } = Dimensions.get('window');
    const CHART_WIDTH = width - 48; // Padding
    const CHART_HEIGHT = height;
    const PADDING_TOP = 20;
    const PADDING_BOTTOM = 20;

    const processed = useMemo(() => {
        if (!data || data.length === 0) return null;

        const prices = data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const range = maxPrice - minPrice || 1; // Avoid divide by zero

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * CHART_WIDTH;
            // Normalize y: 0 is bottom, CHART_HEIGHT is top. 
            // In SVG, 0 is TOP. So we invert.
            // Value 0 -> PADDING_BOTTOM from bottom
            // Value MAX -> PADDING_TOP from top
            const normalizedVal = (d.price - minPrice) / range;
            const y = CHART_HEIGHT - PADDING_BOTTOM - (normalizedVal * (CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM));
            return { x, y, price: d.price, date: d.date };
        });

        // Create Path d string
        const pathData = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
        ).join(' ');

        // Create Area d string (close the path to bottom)
        const areaData = `${pathData} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;

        return { points, pathData, areaData, minPrice, maxPrice };
    }, [data, CHART_WIDTH, CHART_HEIGHT]);

    if (!processed) {
        return (
            <View style={[styles.container, { height }]}>
                <Text style={styles.loadingText}>No price history available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>30-Day Trend</Text>
                <Text style={[styles.title, { color }]}>
                    {data[data.length - 1].price >= data[0].price ? '↑' : '↓'}
                    {Math.abs(((data[data.length - 1].price - data[0].price) / data[0].price) * 100).toFixed(1)}%
                </Text>
            </View>

            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={color} stopOpacity="0" />
                    </LinearGradient>
                </Defs>

                {/* Grid Lines (Optional) */}
                <Line x1="0" y1={CHART_HEIGHT - PADDING_BOTTOM} x2={CHART_WIDTH} y2={CHART_HEIGHT - PADDING_BOTTOM} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <Line x1="0" y1={PADDING_TOP} x2={CHART_WIDTH} y2={PADDING_TOP} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Area */}
                <Path d={processed.areaData} fill="url(#gradient)" />

                {/* Line */}
                <Path d={processed.pathData} stroke={color} strokeWidth="3" fill="none" />

                {/* Min/Max Labels */}
                <SvgText x={10} y={PADDING_TOP - 6} fill="#a0a0a0" fontSize="10">₹{processed.maxPrice}</SvgText>
                <SvgText x={10} y={CHART_HEIGHT - 6} fill="#a0a0a0" fontSize="10">₹{processed.minPrice}</SvgText>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        color: '#a0a0a0',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    loadingText: {
        color: '#666',
        fontSize: 12,
    }
});
