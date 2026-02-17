import { ImageSourcePropType } from 'react-native';

export interface BlogSection {
    title: string;
    content: string;
    image?: ImageSourcePropType;
    imageCaption?: string;
}

export interface BlogArticle {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    readTime: string;
    coverGradient: [string, string];
    coverImage?: ImageSourcePropType;
    sections: BlogSection[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
    {
        id: 'incoterms-2020',
        title: 'The Complete Guide to Incoterms® 2020',
        subtitle:
            'Understanding international trade terms — who pays, who bears risk, and when responsibility transfers.',
        category: 'Trade Knowledge',
        readTime: '15 min read',
        coverGradient: ['#1a6b3c', '#0d3d22'],
        coverImage: {
            uri: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=900&q=80',
        },
        sections: [
            {
                title: 'What Are Incoterms®?',
                content:
                    'Incoterms® (International Commercial Terms) are a set of 11 internationally recognized rules published by the International Chamber of Commerce (ICC). They define the responsibilities of buyers and sellers in international trade transactions.\n\nFirst published in 1936, these rules clarify three critical questions for every shipment:\n\n• Who arranges transport?\n• Who pays for insurance and freight?\n• At what point does risk transfer from seller to buyer?\n\nThe latest version — Incoterms® 2020 — took effect on January 1, 2020, and is widely used across global trade today.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
                },
                imageCaption:
                    'International trade relies on clear rules defined by the ICC',
            },
            {
                title: 'Why Incoterms® Matter for Exporters',
                content:
                    'Choosing the right Incoterm directly impacts your profit margin, risk exposure, and cash flow. The wrong choice can mean:\n\n• Unexpected freight and insurance costs eating into your margins\n• Being liable for goods damaged during transit you thought were the buyer\'s responsibility\n• Customs delays because documentation obligations were unclear\n• Disputes with buyers over who should handle port charges\n\nAs an Indian exporter, understanding Incoterms helps you quote competitive prices while protecting your business interests.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
                },
                imageCaption:
                    'Risk and profit margins depend on selecting the right term',
            },
            {
                title: 'The 11 Incoterms® 2020 — Overview',
                content:
                    'The 11 terms are divided into two categories:\n\n🚢 Rules for Any Mode of Transport (7 terms):\nEXW, FCA, CPT, CIP, DAP, DPU, DDP\n\n⚓ Rules for Sea & Inland Waterway Only (4 terms):\nFAS, FOB, CFR, CIF\n\nThe terms are ordered from minimum seller obligation (EXW) to maximum seller obligation (DDP). As you move from EXW towards DDP, the seller takes on more responsibility for transport, insurance, and risk.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=800&q=80',
                },
                imageCaption:
                    'Incoterms® 2020 — From EXW (minimal risk) to DDP (maximum risk)',
            },
            {
                title: 'EXW — Ex Works',
                content:
                    'Seller\'s Obligation: Make goods available at their premises (factory, warehouse).\n\nBuyer\'s Obligation: Everything else — pickup, export clearance, freight, insurance, import clearance, delivery.\n\nRisk Transfer: At the seller\'s premises when goods are placed at buyer\'s disposal.\n\n✅ Best For: When the buyer has strong logistics capabilities and wants full control over the shipment.\n\n⚠️ Caution: As an Indian exporter, using EXW means you don\'t handle export customs clearance. This can create complications since the exporter is typically the party that files the Shipping Bill in India.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=800&q=80',
                },
                imageCaption:
                    'EXW — Buyer picks up goods directly from the factory warehouse',
            },
            {
                title: 'FCA — Free Carrier',
                content:
                    'Seller\'s Obligation: Deliver goods to the carrier or nominated place, cleared for export.\n\nBuyer\'s Obligation: Main carriage, insurance, import clearance.\n\nRisk Transfer: When goods are handed over to the carrier at the named place.\n\n✅ Best For: Container shipments, multimodal transport. This is one of the most versatile and commonly recommended terms.\n\n💡 New in 2020: The buyer can instruct their carrier to issue a Bill of Lading with an on-board notation to the seller, which helps when Letters of Credit require this document.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
                },
                imageCaption:
                    'FCA — Handing over goods to the carrier for export',
            },
            {
                title: 'FAS — Free Alongside Ship',
                content:
                    'Seller\'s Obligation: Deliver goods alongside the vessel at the named port of shipment, cleared for export.\n\nBuyer\'s Obligation: Loading onto vessel, freight, insurance, import clearance.\n\nRisk Transfer: When goods are placed alongside the ship at the port.\n\n✅ Best For: Bulk cargo or heavy equipment shipped via sea.\n\n⚠️ Note: Sea/inland waterway transport only.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=800&q=80',
                },
                imageCaption:
                    'FAS — Bulk cargo waiting alongside the vessel at port',
            },
            {
                title: 'FOB — Free On Board',
                content:
                    'Seller\'s Obligation: Deliver goods on board the vessel at the named port, cleared for export.\n\nBuyer\'s Obligation: Freight from port of shipment, insurance, import clearance.\n\nRisk Transfer: When goods are on board the vessel.\n\n✅ Best For: The most popular term for Indian exporters in sea freight. You handle everything up to loading the goods onto the ship.\n\n💡 Tip: FOB is widely used in Indian exports because it aligns well with the Shipping Bill process and gives exporters control over port-side operations.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80',
                },
                imageCaption:
                    'FOB — Risk transfers once the goods are loaded on the ship',
            },
            {
                title: 'CFR — Cost and Freight',
                content:
                    'Seller\'s Obligation: Deliver goods on board the vessel, pay freight to the destination port, export clearance.\n\nBuyer\'s Obligation: Insurance from port of shipment, import clearance, unloading.\n\nRisk Transfer: When goods are on board the vessel at origin (even though seller pays freight).\n\n✅ Best For: When the seller can negotiate better freight rates.\n\n⚠️ Important: Risk transfers at origin port, but cost responsibility extends to destination. This mismatch often confuses new exporters.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1559511260-66a68e8f3455?w=800&q=80',
                },
                imageCaption:
                    'CFR — Seller manages and pays for the freight journey',
            },
            {
                title: 'CIF — Cost, Insurance and Freight',
                content:
                    'Seller\'s Obligation: Same as CFR plus minimum insurance coverage (110% of invoice value, Institute Cargo Clause C).\n\nBuyer\'s Obligation: Import clearance, unloading, delivery to final destination.\n\nRisk Transfer: When goods are on board the vessel at origin.\n\n✅ Best For: When buyers want the seller to arrange basic insurance. Very common in international trade.\n\n💡 Key Change in 2020: CIF still requires only minimum insurance (Clause C), while CIP now requires maximum coverage (Clause A).',
                image: {
                    uri: 'https://images.unsplash.com/photo-1451933371641-a56da26937f3?w=800&q=80',
                },
                imageCaption:
                    'CIF — Includes insurance coverage for the maritime journey',
            },
            {
                title: 'CPT — Carriage Paid To',
                content:
                    'Seller\'s Obligation: Deliver goods to the carrier, pay freight to named destination, export clearance.\n\nBuyer\'s Obligation: Insurance, import clearance, unloading.\n\nRisk Transfer: When goods are handed to the first carrier.\n\n✅ Best For: Multimodal transport (air + road, sea + rail). Works like CFR but for any mode of transport.',
            },
            {
                title: 'CIP — Carriage and Insurance Paid To',
                content:
                    'Seller\'s Obligation: Same as CPT plus insurance coverage at maximum level (Institute Cargo Clause A — all risks).\n\nBuyer\'s Obligation: Import clearance, unloading.\n\nRisk Transfer: When goods are handed to the first carrier.\n\n✅ Best For: High-value goods where comprehensive insurance is critical.\n\n💡 Key Change in 2020: CIP now requires the highest level of insurance (Clause A — all risks), upgraded from Clause C in Incoterms 2010. This is a major change.',
            },
            {
                title: 'DAP — Delivered at Place',
                content:
                    'Seller\'s Obligation: Deliver goods at the named destination, ready for unloading. Seller bears all transport costs and risks to that point.\n\nBuyer\'s Obligation: Unloading, import clearance, duties.\n\nRisk Transfer: When goods arrive at the named destination, ready for unloading.\n\n✅ Best For: When the seller wants to offer door-to-door service but without handling import customs.',
            },
            {
                title: 'DPU — Delivered at Place Unloaded',
                content:
                    'Seller\'s Obligation: Deliver and unload goods at the named destination.\n\nBuyer\'s Obligation: Import clearance, duties.\n\nRisk Transfer: When goods are unloaded at the destination.\n\n✅ Best For: When the seller has the capability to unload at destination (e.g., own warehousing).\n\n💡 New in 2020: DPU replaces DAT (Delivered at Terminal) from Incoterms 2010. The key change is that DPU can be any place, not just a terminal.',
            },
            {
                title: 'DDP — Delivered Duty Paid',
                content:
                    'Seller\'s Obligation: Maximum — deliver goods to destination, cleared for import, all duties and taxes paid. The seller bears all costs and risks.\n\nBuyer\'s Obligation: Receive the goods. That\'s it.\n\nRisk Transfer: At the named destination.\n\n✅ Best For: E-commerce, when you want to offer a complete landed-cost price to the buyer.\n\n⚠️ Caution: As an Indian exporter, DDP means you must register for tax/VAT in the destination country and handle all import formalities. This can be complex and expensive.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80',
                },
                imageCaption:
                    'DDP — Complete door-to-door delivery with duties paid',
            },
            {
                title: 'Quick Comparison: Which Incoterm Should You Use?',
                content:
                    '🟢 New to exporting? → Start with FOB.\nThe buyer handles international freight and insurance. You control the Indian side.\n\n🔵 Want competitive pricing? → Use CIF or CFR.\nInclude freight (and insurance) in your quote. Buyers in many countries prefer this.\n\n🟡 Selling on e-commerce / Amazon Global? → Consider DDP.\nThe buyer wants a landed price with no surprises.\n\n🟠 Container / Multimodal shipments? → Use FCA or CIP.\nMore flexible than FOB/CIF for non-port deliveries.\n\n🔴 Buyer arranges everything? → EXW.\nMinimum responsibility for you, but limited control over the shipment.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1535198032734-638531d04467?w=800&q=80',
                },
                imageCaption:
                    'Comparison strategy — balancing risk and control',
            },
            {
                title: 'Key Changes in Incoterms® 2020 vs 2010',
                content:
                    '1. DAT renamed to DPU — Destination is no longer limited to a terminal.\n\n2. CIP insurance upgraded — Now requires maximum coverage (Clause A) instead of minimum (Clause C). CIF remains at Clause C.\n\n3. FCA Bill of Lading — New provision allowing on-board B/L notation, solving a major issue with Letters of Credit.\n\n4. Own transport allowed — Under FCA, DAP, DPU, DDP, the seller or buyer can use their own transport instead of a third-party carrier.\n\n5. Security requirements — Clearer allocation of security-related transport obligations between parties.\n\n6. Explanatory notes restructured — Each term now has a user-friendly structure making it easier to understand obligations.',
            },
            {
                title: 'Tips for Indian Exporters',
                content:
                    '1. Always specify the Incoterms version — Write "FOB Mumbai Incoterms® 2020" not just "FOB Mumbai."\n\n2. Match the Incoterm to your Shipping Bill — FOB and CIF align most naturally with Indian export documentation.\n\n3. Negotiate freight early — If quoting CFR/CIF, lock in freight rates before giving the buyer a final price.\n\n4. Understand the GST implications — Different Incoterms affect when and how GST is applied to your export invoice.\n\n5. Insurance is your safety net — Even if the Incoterm doesn\'t require you to insure, consider taking contingency insurance for high-value shipments.\n\n6. Document everything — The Incoterm you choose should be clearly stated in the proforma invoice, commercial invoice, and the contract of sale.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
                },
                imageCaption:
                    'Clear documentation and insurance are key for Indian exporters',
            },
        ],
    },
    {
        id: 'export-documentation-checklist',
        title: 'Export Documentation Checklist for Indian Exporters',
        subtitle:
            'Every document you need — from IEC to Bill of Lading — explained simply.',
        category: 'Export Essentials',
        readTime: '8 min read',
        coverGradient: ['#2563eb', '#1e40af'],
        coverImage: {
            uri: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80',
        },
        sections: [
            {
                title: 'Why Documentation Matters',
                content:
                    'Export documentation is the backbone of international trade. A single missing or incorrect document can delay your shipment, block payment through a Letter of Credit, or create customs issues at the destination.\n\nIndian exporters must comply with regulations from DGFT, Customs, RBI, and the destination country\'s import authority. Getting your paperwork right from day one saves time, money, and reputation.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
                },
                imageCaption:
                    'Correct paperwork prevents costly delays and payment refusals',
            },
            {
                title: 'Pre-Shipment Documents',
                content:
                    '1. Import Export Code (IEC) — Mandatory 10-digit registration from DGFT. Apply online at dgft.gov.in.\n\n2. AD Code Registration — Register your Authorized Dealer (bank) code with the customs port from which you plan to export.\n\n3. RCMC (Registration Cum Membership Certificate) — Required to avail export incentives. Obtained from relevant Export Promotion Council.\n\n4. Proforma Invoice — Your formal price quotation to the buyer, including Incoterm, payment terms, and delivery schedule.\n\n5. Purchase Order / Export Contract — The buyer\'s formal order confirming the transaction.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
                },
                imageCaption:
                    'Starting right: IEC code and Proforma Invoice',
            },
            {
                title: 'Shipping Documents',
                content:
                    '1. Commercial Invoice — The final invoice for customs and payment purposes. Must include HS Code, Incoterm, and accurate item descriptions.\n\n2. Packing List — Detailed list of contents, weights, dimensions of each package.\n\n3. Bill of Lading (Sea) / Airway Bill (Air) — Issued by the carrier. Serves as receipt, contract of carriage, and document of title (B/L only).\n\n4. Shipping Bill — Filed electronically on ICEGATE. This is the key customs document for Indian exports.\n\n5. Certificate of Origin — Proves the goods were manufactured/processed in India. Needed for preferential duty rates under FTAs.\n\n6. Inspection Certificate — Required for certain products (e.g., food, pharma) from agencies like EIA, FSSAI, or APEDA.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1616423664033-631d80da9299?w=800&q=80',
                },
                imageCaption:
                    'The Shipping Bill and Bill of Lading are critical for customs',
            },
            {
                title: 'Financial Documents',
                content:
                    '1. Letter of Credit (L/C) — Bank guarantee for payment. Requires strict document compliance.\n\n2. Bill of Exchange — Your demand for payment, drawn on the buyer or their bank.\n\n3. Bank Realization Certificate (BRC) — Proof that export proceeds have been received. Needed for claiming export incentives.\n\n4. FIRC (Foreign Inward Remittance Certificate) — Issued by your bank confirming receipt of foreign currency.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1601597111158-2fceff292cd4?w=800&q=80',
                },
                imageCaption:
                    'Ensuring payment: Letters of Credit and Bank Realization Certificates',
            },
            {
                title: 'Post-Shipment Checklist',
                content:
                    '✅ Submit documents to bank within 21 days of shipment\n✅ File SOFTEX (for software exports) or physical export documents\n✅ Realize export proceeds within 9 months (RBI guideline)\n✅ Claim IGST refund or export incentives (RoDTEP, MEIS if applicable)\n✅ Update records in DGFT for EPCG / Advance Authorization if used\n✅ File monthly returns if registered under any export scheme\n\nPro Tip: Maintain a digital copy of every document. Many banks and customs authorities now accept e-documents, and having organized records simplifies audits.',
                image: {
                    uri: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
                },
                imageCaption:
                    'Timely submission and digital records ensure compliance',
            },
        ],
    },
];
