import React, { useRef, forwardRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    Dimensions,
    Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { BookOpen, Clock, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { BLOG_ARTICLES, BlogArticle } from '@/constants/blog-data';

const { width } = Dimensions.get('window');

const ArticleCard = forwardRef<View, { article: BlogArticle; onPress?: () => void }>(
    ({ article, onPress, ...props }, ref) => {
        const scaleAnim = useRef(new Animated.Value(1)).current;

        const onPressIn = () => {
            Animated.spring(scaleAnim, {
                toValue: 0.97,
                useNativeDriver: true,
            }).start();
        };

        const onPressOut = () => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }).start();
        };

        return (
            <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
                <TouchableOpacity
                    ref={ref}
                    style={styles.articleCard}
                    onPress={onPress}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    activeOpacity={1}
                    {...props}
                >
                    {/* Gradient Header */}
                    <View
                        style={[
                            styles.cardHeader,
                            { backgroundColor: article.coverGradient[0] },
                        ]}
                    >
                        {article.coverImage && (
                            <Image
                                source={article.coverImage}
                                style={styles.cardCoverImage}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.cardHeaderOverlay} />
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{article.category}</Text>
                        </View>
                        <BookOpen size={40} color="rgba(255,255,255,0.3)" style={styles.cardIcon} />
                    </View>

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                        <Text style={styles.articleTitle}>{article.title}</Text>
                        <Text style={styles.articleSubtitle} numberOfLines={2}>
                            {article.subtitle}
                        </Text>

                        <View style={styles.cardFooter}>
                            <View style={styles.readTimeContainer}>
                                <Clock size={14} color="#888" />
                                <Text style={styles.readTimeText}>{article.readTime}</Text>
                            </View>
                            <View style={styles.readMoreContainer}>
                                <Text style={styles.readMoreText}>Read</Text>
                                <ChevronRight size={16} color="#2ecc71" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }
);

export default function BlogScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Knowledge Hub</Text>
                        <Text style={styles.headerSubtitle}>
                            Learn the essentials of international trade
                        </Text>
                    </View>
                </View>

                {/* Articles List */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {BLOG_ARTICLES.map((article) => (
                        <Link
                            key={article.id}
                            href={{
                                pathname: '/blog-detail',
                                params: { id: article.id },
                            }}
                            asChild
                        >
                            <ArticleCard article={article} />
                        </Link>
                    ))}

                    {/* Coming Soon */}
                    <View style={styles.comingSoonCard}>
                        <BookOpen size={24} color="#555" />
                        <Text style={styles.comingSoonText}>More articles coming soon</Text>
                    </View>
                </ScrollView>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextContainer: {
        marginLeft: 14,
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    cardWrapper: {
        marginBottom: 20,
    },
    articleCard: {
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cardHeader: {
        height: 140,
        padding: 16,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    cardCoverImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    cardHeaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    categoryText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardIcon: {
        position: 'absolute',
        right: 16,
        bottom: 12,
    },
    cardBody: {
        padding: 18,
    },
    articleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 24,
    },
    articleSubtitle: {
        fontSize: 13,
        color: '#999',
        marginTop: 8,
        lineHeight: 19,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    readTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    readTimeText: {
        color: '#888',
        fontSize: 13,
    },
    readMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    readMoreText: {
        color: '#2ecc71',
        fontSize: 14,
        fontWeight: '600',
    },
    comingSoonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 30,
        marginTop: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderStyle: 'dashed',
    },
    comingSoonText: {
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
    },
});
