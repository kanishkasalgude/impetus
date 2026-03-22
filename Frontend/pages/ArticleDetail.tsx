import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Article, LocalizedContent } from '../src/types/article';
import { useLanguage } from '../src/context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

const ArticleDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { language, t } = useLanguage();
    const [article, setArticle] = useState<any | null>(null);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadArticle = async () => {
            if (!slug) return;

            try {
                setLoading(true);
                // Dynamic import - updated to look in src/articles
                const modules = import.meta.glob('/src/articles/*/index.json', { eager: true });
                const imageModules = import.meta.glob('/src/articles/*/*.{png,jpg,jpeg,svg,webp}', { eager: true });

                // Find the article that matches the slug
                let articleModuleEntry = Object.entries(modules).find(([path, mod]: [string, any]) => {
                    const data = mod.default || mod;
                    const parts = path.split('/');
                    const folderName = parts[parts.length - 2];

                    // Match against folder name OR the explicit slug in JSON
                    return folderName === slug || data.slug === slug;
                });

                if (!articleModuleEntry) {
                    throw new Error('Article not found');
                }

                const [path, mod] = articleModuleEntry;
                const data = (mod as any).default || mod;
                const parts = path.split('/');
                const folderName = parts[parts.length - 2];

                // Resolve Hero Image
                let heroImage = data.heroImage;
                if (heroImage) {
                    const exactPath = `/src/articles/${folderName}/${heroImage}`;
                    if (imageModules[exactPath]) {
                        heroImage = (imageModules[exactPath] as any).default || imageModules[exactPath];
                    } else {
                        // Fallback: search for the image file name within the article's folder
                        const relativeImageEntry = Object.entries(imageModules).find(([imgPath]) =>
                            imgPath.includes(`/${folderName}/`) && imgPath.endsWith(data.heroImage)
                        );
                        if (relativeImageEntry) {
                            heroImage = (relativeImageEntry[1] as any).default || relativeImageEntry[1];
                        }
                    }
                }

                // Resolve Gallery Images
                let resolvedGallery = data.galleryImages || [];
                resolvedGallery = resolvedGallery.map((img: string) => {
                    const exactPath = `/src/articles/${folderName}/${img}`;
                    if (imageModules[exactPath]) {
                        return (imageModules[exactPath] as any).default || imageModules[exactPath];
                    }
                    const relativeImageEntry = Object.entries(imageModules).find(([imgPath]) =>
                        imgPath.includes(`/${folderName}/`) && imgPath.endsWith(img)
                    );
                    return relativeImageEntry ? ((relativeImageEntry[1] as any).default || relativeImageEntry[1]) : img;
                });

                setArticle({
                    ...data,
                    heroImage,
                    slug
                });
                setGalleryImages(resolvedGallery);

            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        loadArticle();
    }, [slug, language]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        </div>
    );

    if (error || !article) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF7] text-red-600">
            <h2 className="text-2xl font-bold mb-4">Article not found</h2>
            <Link to="/hub" className="text-green-700 hover:underline">Return to Knowledge Hub</Link>
        </div>
    );

    const getContent = (content: LocalizedContent) => {
        return content[language.toLowerCase() as keyof LocalizedContent] || content.en;
    };

    // Correctly pathing to the flat schema: data.title and data.content
    const title = getContent(article.data.title);
    const fullContent = getContent(article.data.content);

    return (
        <article className="min-h-screen bg-[#FAFAF7] font-serif pb-20 overflow-y-auto relative">
            {/* Top Navigation Overlay */}
            <div className="absolute top-6 left-6 z-50">
                <Link
                    to="/hub"
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-[#E6E6E6] text-green-800 font-bold rounded-full hover:bg-white transition-all shadow-lg group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>{t.common.back}</span>
                </Link>
            </div>

            {/* Hero Image Section */}
            <div className="w-full h-[50vh] md:h-[60vh] relative">
                <img
                    src={article.heroImage}
                    alt={title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10" />

            </div>

            {/* Content Container - Keyed by language to force full re-render */}
            <div key={language} className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-24 z-10 mb-20">
                <div className="bg-white rounded-t-3xl shadow-xl p-8 md:p-12 min-h-screen overflow-visible">

                    {/* Header */}
                    <header className="mb-10 text-center">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 font-display leading-tight">
                            {title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center text-gray-500 text-sm gap-6">
                            {article.author && (
                                <div className="flex items-center">
                                    <User size={16} className="mr-2 text-deep-green" />
                                    <span>{article.author}</span>
                                </div>
                            )}
                            {article.date && (
                                <div className="flex items-center">
                                    <Calendar size={16} className="mr-2 text-deep-green" />
                                    <span>{article.date}</span>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Divider */}
                    <div className="flex items-center justify-center mb-10">
                        <div className="h-1 w-20 bg-deep-green/20 rounded-full"></div>
                    </div>

                    {/* Full Raw Markdown Content Rendering */}
                    <div className="prose prose-lg prose-green mx-auto font-serif text-gray-800 leading-loose max-w-none text-justify">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                img: () => null, // Never render inline images
                                h2: ({ node, ...props }) => (
                                    <h2 {...props} className="text-3xl font-bold text-deep-green mt-12 mb-6 font-display" />
                                ),
                                h3: ({ node, ...props }) => (
                                    <h3 {...props} className="text-2xl font-semibold text-deep-green/90 mt-8 mb-4 font-display" />
                                ),
                                p: ({ node, ...props }) => (
                                    <p {...props} className="mb-6 text-gray-700 text-lg leading-8" />
                                ),
                                ul: ({ node, ...props }) => (
                                    <ul {...props} className="list-disc list-outside ml-6 mb-6 space-y-2 text-gray-700" />
                                ),
                                strong: ({ node, ...props }) => (
                                    <strong {...props} className="font-bold text-deep-green" />
                                )
                            }}
                        >
                            {fullContent}
                        </ReactMarkdown>
                    </div>

                    {/* Image Gallery Section (Bottom) */}
                    {galleryImages.length > 0 && (
                        <div className="mt-16 border-t border-gray-100 pt-16">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {galleryImages.map((src, idx) => (
                                    <div key={idx} className="relative rounded-2xl overflow-hidden shadow-md transition-shadow hover:shadow-lg h-72 md:h-80">
                                        <img
                                            src={src}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </article>
    );
};


export default ArticleDetail;
