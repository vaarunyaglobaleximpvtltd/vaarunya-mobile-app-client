import React, { useRef, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    LayoutChangeEvent,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Clock,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Bookmark,
    Layers,
} from 'lucide-react-native';
import { BLOG_ARTICLES, BlogSection } from '@/constants/blog-data';

const { width } = Dimensions.get('window');

/**
 * Parse content into rich blocks:
 * - Lines starting with • or - are bullet items
 * - Lines starting with ✅ ⚠️ 💡 🟢 🔵 🟡 🟠 🔴 are callout items
 * - Lines starting with a number. are numbered list items
 * - Everything else is a paragraph
 */
function parseContentBlocks(content: string) {
    const lines = content.split('\n');
    const blocks: Array<{
        type: 'paragraph' | 'bullet' | 'callout' | 'numbered';
        text: string;
        icon?: string;
    }> = [];

    let currentParagraph = '';

    const flushParagraph = () => {
        if (currentParagraph.trim()) {
            blocks.push({ type: 'paragraph', text: currentParagraph.trim() });
            currentParagraph = '';
        }
    };

    const CALLOUT_ICONS = ['✅', '⚠️', '💡', '🟢', '🔵', '🟡', '🟠', '🔴', '🚢', '⚓'];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            flushParagraph();
            continue;
        }

        // Bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
            flushParagraph();
            blocks.push({ type: 'bullet', text: trimmed.substring(1).trim() });
        }
        // Callout lines
        else if (CALLOUT_ICONS.some(icon => trimmed.startsWith(icon))) {
            flushParagraph();
            const icon = CALLOUT_ICONS.find(icon => trimmed.startsWith(icon)) || '';
            blocks.push({
                type: 'callout',
                icon: icon,
                text: trimmed.substring(icon.length).trim()
            });
        }
        // Numbered list (Simple check for digit + dot)
        else if (!isNaN(parseInt(trimmed[0])) && trimmed.includes('. ')) {
            flushParagraph();
            blocks.push({ type: 'numbered', text: trimmed });
        }
        // Regular text — append to current paragraph
        else {
            if (currentParagraph) currentParagraph += ' ';
            currentParagraph += trimmed;
        }
    }
    flushParagraph();
    return blocks;
}

/** Renders a single content block with appropriate styling */
function ContentBlock({ block, accentColor }: { block: ReturnType<typeof parseContentBlocks>[0]; accentColor: string }) {
    switch (block.type) {
        case 'paragraph':
            return <Text style={styles.paragraph}>{block.text}</Text>;

        case 'bullet':
            return (
                <View style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: accentColor }]} />
                    <Text style={styles.bulletText}>{block.text}</Text>
                </View>
            );

        case 'callout':
            return (
                <View style={[styles.calloutCard, { borderLeftColor: accentColor }]}>
                    {block.icon && <Text style={styles.calloutIcon}>{block.icon}</Text>}
                    <Text style={styles.calloutText}>{block.text}</Text>
                </View>
            );

        case 'numbered':
            // Simple split for numbered items
            const dotIndex = block.text.indexOf('.');
            const num = block.text.substring(0, dotIndex);
            const text = block.text.substring(dotIndex + 1).trim();

            return (
                <View style={styles.numberedRow}>
                    <View style={[styles.numberedBadge, { backgroundColor: accentColor + '20' }]}>
                        <Text style={[styles.numberedNum, { color: accentColor }]}>
                            {num}
                        </Text>
                    </View>
                    <Text style={styles.numberedText}>
                        {text}
                    </Text>
                </View>
            );

        default:
            return null;
    }
}

/** Renders a full section with varied layout based on position & content */
function SectionRenderer({
    section,
    index,
    totalSections,
    accentColor,
    onLayout,
}: {
    section: BlogSection;
    index: number;
    totalSections: number;
    accentColor: string;
    onLayout: (event: LayoutChangeEvent) => void;
}) {
    const blocks = parseContentBlocks(section.content);
    const isFirstSection = index === 0;
    const hasImage = !!section.image;

    return (
        <View style={styles.section} onLayout={onLayout}>
            {/* Section heading — editorial style with accent line */}
            <View style={styles.sectionHeadingWrap}>
                <View style={[styles.sectionAccentLine, { backgroundColor: accentColor }]} />
                <View style={styles.sectionHeadingContent}>
                    <Text style={styles.sectionChapter}>
                        {isFirstSection ? 'Introduction' : `Chapter ${index}`}
                    </Text>
                    <Text style={styles.sectionHeading}>{section.title}</Text>
                </View>
            </View>

            {/* Full-width image if present */}
            {hasImage && (
                <View style={styles.sectionImageWrap}>
                    <Image
                        source={section.image!}
                        style={styles.sectionImage}
                        resizeMode="cover"
                    />
                    {section.imageCaption && (
                        <Text style={styles.imageCaption}>
                            — {section.imageCaption}
                        </Text>
                    )}
                </View>
            )}

            {/* Rich content blocks */}
            <View style={styles.sectionBody}>
                {blocks.map((block, i) => (
                    <ContentBlock key={i} block={block} accentColor={accentColor} />
                ))}
            </View>

            {/* Section divider */}
            {index < totalSections - 1 && (
                <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <View style={[styles.dividerDiamond, { backgroundColor: accentColor + '40' }]} />
                    <View style={styles.dividerLine} />
                </View>
            )}
        </View>
    );
}

export default function BlogDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const scrollRef = useRef<ScrollView>(null);
    const [tocExpanded, setTocExpanded] = useState(false);
    const [sectionLayouts, setSectionLayouts] = useState<Record<number, number>>(
        {},
    );

    const article = BLOG_ARTICLES.find((a) => a.id === id);

    const handleSectionLayout = useCallback(
        (index: number) => (event: LayoutChangeEvent) => {
            setSectionLayouts((prev) => ({
                ...prev,
                [index]: event.nativeEvent.layout.y,
            }));
        },
        [],
    );

    const scrollToSection = (index: number) => {
        const y = sectionLayouts[index];
        if (y !== undefined && scrollRef.current) {
            scrollRef.current.scrollTo({ y: y + 280, animated: true });
        }
        setTocExpanded(false);
    };

    if (!article) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Article not found</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.errorLink}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const accentColor = article.coverGradient[0];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                ref={scrollRef}
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── Hero Header ─── */}
                <View style={[styles.hero, { backgroundColor: accentColor }]}>
                    {article.coverImage && (
                        <Image
                            source={article.coverImage}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                        />
                    )}
                    <View style={styles.heroGradient} />

                    {/* Top bar */}
                    <View style={styles.heroTopBar}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                        >
                            <ArrowLeft size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bookmarkBtn}>
                            <Bookmark size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Hero text */}
                    <View style={styles.heroBottom}>
                        <View style={styles.heroCategoryPill}>
                            <Text style={styles.heroCategoryText}>{article.category}</Text>
                        </View>
                        <Text style={styles.heroTitle}>{article.title}</Text>
                        <Text style={styles.heroSubtitle}>{article.subtitle}</Text>
                        <View style={styles.heroMetaRow}>
                            <Clock size={13} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.heroMetaText}>{article.readTime}</Text>
                            <View style={styles.heroMetaDot} />
                            <Layers size={13} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.heroMetaText}>
                                {article.sections.length} sections
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ─── Table of Contents ─── */}
                <View style={styles.tocContainer}>
                    <TouchableOpacity
                        style={styles.tocHeader}
                        onPress={() => setTocExpanded(!tocExpanded)}
                    >
                        <View style={styles.tocHeaderLeft}>
                            <BookOpen size={16} color={accentColor} />
                            <Text style={[styles.tocHeaderText, { color: accentColor }]}>
                                Table of Contents
                            </Text>
                        </View>
                        {tocExpanded ? (
                            <ChevronUp size={18} color={accentColor} />
                        ) : (
                            <ChevronDown size={18} color={accentColor} />
                        )}
                    </TouchableOpacity>

                    {tocExpanded && (
                        <View style={styles.tocList}>
                            {article.sections.map((section, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.tocItem}
                                    onPress={() => scrollToSection(index)}
                                >
                                    <View style={[styles.tocDot, { backgroundColor: accentColor }]} />
                                    <Text style={styles.tocItemText} numberOfLines={1}>
                                        {section.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* ─── Article Body ─── */}
                <View style={styles.articleBody}>
                    {article.sections.map((section, index) => (
                        <SectionRenderer
                            key={index}
                            section={section}
                            index={index}
                            totalSections={article.sections.length}
                            accentColor={accentColor}
                            onLayout={handleSectionLayout(index)}
                        />
                    ))}
                </View>

                {/* ─── Footer ─── */}
                <View style={styles.footer}>
                    <View style={[styles.footerAccent, { backgroundColor: accentColor + '30' }]}>
                        <BookOpen size={20} color={accentColor} />
                    </View>
                    <Text style={styles.footerSource}>Vaarunya Global Knowledge Hub</Text>
                    <Text style={styles.footerNote}>
                        Based on ICC Incoterms® 2020 rules and DGFT guidelines
                    </Text>
                    <TouchableOpacity
                        style={[styles.backToHubBtn, { borderColor: accentColor + '40' }]}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={16} color={accentColor} />
                        <Text style={[styles.backToHubText, { color: accentColor }]}>
                            Back to Knowledge Hub
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0c',
    },
    scrollView: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    errorLink: {
        color: '#2ecc71',
        fontSize: 16,
        fontWeight: '600',
    },

    // ── Hero ──
    hero: {
        minHeight: 320,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    heroTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookmarkBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroBottom: {
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    heroCategoryPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 14,
    },
    heroCategoryText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 34,
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 21,
        marginBottom: 16,
    },
    heroMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    heroMetaText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    heroMetaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 4,
    },

    // ── TOC ──
    tocContainer: {
        marginHorizontal: 20,
        marginTop: -16,
        backgroundColor: '#111114',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    tocHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    tocHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tocHeaderText: {
        fontSize: 14,
        fontWeight: '700',
    },
    tocList: {
        paddingHorizontal: 18,
        paddingBottom: 14,
    },
    tocItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        gap: 12,
    },
    tocDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    tocItemText: {
        color: '#bbb',
        fontSize: 13,
        flex: 1,
    },

    // ── Article Body ──
    articleBody: {
        paddingHorizontal: 20,
        paddingTop: 32,
    },

    // ── Section ──
    section: {
        marginBottom: 8,
    },
    sectionHeadingWrap: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    sectionAccentLine: {
        width: 3,
        borderRadius: 2,
        marginRight: 14,
    },
    sectionHeadingContent: {
        flex: 1,
    },
    sectionChapter: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    sectionHeading: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f0f0f0',
        lineHeight: 30,
    },

    // ── Section Image ──
    sectionImageWrap: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    sectionImage: {
        width: '100%',
        height: 200,
    },
    imageCaption: {
        fontSize: 12,
        color: '#777',
        fontStyle: 'italic',
        paddingHorizontal: 14,
        paddingVertical: 10,
        lineHeight: 17,
    },

    // ── Section Body ──
    sectionBody: {
        gap: 12,
    },

    // ── Content Blocks ──
    paragraph: {
        fontSize: 15,
        color: '#c8c8c8',
        lineHeight: 25,
        letterSpacing: 0.15,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingLeft: 4,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 9,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: '#b8b8b8',
        lineHeight: 22,
    },
    calloutCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderLeftWidth: 3,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    calloutIcon: {
        fontSize: 16,
        marginTop: 1,
    },
    calloutText: {
        flex: 1,
        fontSize: 14,
        color: '#d4d4d4',
        lineHeight: 21,
        fontWeight: '500',
    },
    numberedRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 6,
    },
    numberedBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    numberedNum: {
        fontSize: 13,
        fontWeight: '800',
    },
    numberedText: {
        flex: 1,
        fontSize: 14,
        color: '#c0c0c0',
        lineHeight: 22,
    },

    // ── Section Divider ──
    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 28,
        gap: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    dividerDiamond: {
        width: 8,
        height: 8,
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
    },

    // ── Footer ──
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        marginTop: 16,
    },
    footerAccent: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    footerSource: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    footerNote: {
        color: '#555',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    backToHubBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
    },
    backToHubText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
