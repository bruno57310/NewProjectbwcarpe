import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  Eye, 
  ThumbsUp, 
  ChevronRight, 
  Home, 
  RefreshCw, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  published: boolean;
  featured: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
  published_at: string;
  category_id: string;
  tags: string[];
  access_level: 'public' | 'pro' | 'enterprise';
  category: {
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [subscription, setSubscription] = useState<{ tier: string } | null>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    fetchCategories();
    if (user) {
      fetchSubscription();
    } else {
      setSubscriptionLoaded(true);
      fetchPosts();
    }
  }, [user, selectedCategory]);

  // Only fetch posts after subscription is loaded
  useEffect(() => {
    if (subscriptionLoaded) {
      fetchPosts();
    }
  }, [subscriptionLoaded, searchTerm, selectedCategory, subscription]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('login_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setSubscriptionLoaded(true);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPosts = async (attempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name,
            slug
          )
        `)
        .eq('published', true)
        .order('published_at', { ascending: false });
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter posts based on user's subscription level
      let filteredPosts = data || [];
      
      if (!user) {
        // Public users can only see public posts
        filteredPosts = filteredPosts.filter(post => 
          !post.access_level || post.access_level === 'public'
        );
      } else if (subscription) {
        if (subscription.tier === 'free') {
          // Free users can only see public posts
          filteredPosts = filteredPosts.filter(post => 
            !post.access_level || 
            post.access_level === 'public'
          );
        } else if (subscription.tier === 'pro') {
          // Pro users can see public and pro posts
          filteredPosts = filteredPosts.filter(post => 
            !post.access_level || 
            post.access_level === 'public' || 
            post.access_level === 'pro'
          );
        }
        // Enterprise users can see all posts (no filtering needed)
      } else {
        // Default to public only if subscription status is unknown
        filteredPosts = filteredPosts.filter(post => 
          !post.access_level || post.access_level === 'public'
        );
      }
      
      setPosts(filteredPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Error loading blog posts');
      
      // Implement retry logic with exponential backoff
      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, ...
        console.log(`Retrying in ${backoffTime}ms...`);
        setTimeout(() => {
          setRetryCount(attempt + 1);
          fetchPosts(attempt + 1);
        }, backoffTime);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchPosts(0);
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'pro':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Pro
          </span>
        );
      case 'enterprise':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Enterprise
          </span>
        );
      default:
        return null;
    }
  };

  const canAccessPost = (post: BlogPost): boolean => {
    if (!post.access_level || post.access_level === 'public') {
      return true;
    }
    
    if (!user || !subscription) {
      return false;
    }
    
    if (post.access_level === 'pro') {
      return subscription.tier === 'pro' || subscription.tier === 'enterprise';
    }
    
    if (post.access_level === 'enterprise') {
      return subscription.tier === 'enterprise';
    }
    
    return false;
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/"
          className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
          title={t('common.back')}
        >
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-green-800">Blog</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p>{error}</p>
            <button 
              onClick={handleRetry}
              className="mt-2 text-sm flex items-center gap-1 text-red-600 hover:text-red-800"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Search
              </button>
            </form>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2">Filter by Category</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === null
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategory === category.id
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Featured Post */}
          {posts.filter(post => post.featured).length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-green-800 mb-4">Featured Article</h2>
              {posts.filter(post => post.featured).slice(0, 1).map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative h-64 bg-gray-200">
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-100">
                        <span className="text-green-500 text-lg">No image available</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {getAccessLevelBadge(post.access_level)}
                      {post.featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                      {post.blog_categories && (
                        <>
                          <span>•</span>
                          <span>{post.blog_categories.name}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4">{post.excerpt || post.content.substring(0, 150) + '...'}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {post.likes_count}
                        </span>
                      </div>
                      {canAccessPost(post) ? (
                        <Link 
                          to={`/blog/${post.slug}`}
                          className="flex items-center gap-1 text-green-700 hover:text-green-600"
                        >
                          Read more
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Lock className="w-4 h-4" />
                          <Link to="/pricing" className="hover:underline">
                            Upgrade to access
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Posts */}
          <div>
            <h2 className="text-2xl font-bold text-green-800 mb-4">Latest Articles</h2>
            {posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No articles found. Please try a different search or check back later.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {posts.map(post => (
                  <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-gray-200">
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-100">
                          <span className="text-green-500 text-lg">No image available</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {getAccessLevelBadge(post.access_level)}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                        {post.blog_categories && (
                          <>
                            <span>•</span>
                            <span>{post.blog_categories.name}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-green-800 mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-gray-600 mb-4 text-sm line-clamp-3">{post.excerpt || post.content.substring(0, 120) + '...'}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-gray-500 text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {post.likes_count}
                          </span>
                        </div>
                        {canAccessPost(post) ? (
                          <Link 
                            to={`/blog/${post.slug}`}
                            className="text-sm flex items-center gap-1 text-green-700 hover:text-green-600"
                          >
                            Read more
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600 text-xs">
                            <Lock className="w-3 h-3" />
                            <Link to="/pricing" className="hover:underline">
                              Upgrade
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          {/* Categories */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold text-green-800 mb-3 pb-2 border-b border-gray-200">Categories</h3>
            <ul className="space-y-2">
              {categories.map(category => (
                <li key={category.id}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-green-100 text-green-800'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Tags */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-bold text-green-800 mb-3 pb-2 border-b border-gray-200">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(posts.flatMap(post => post.tags || []))).slice(0, 10).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {Array.from(new Set(posts.flatMap(post => post.tags || []))).length === 0 && (
                <p className="text-gray-500 text-sm">No tags available</p>
              )}
            </div>
          </div>

          {/* Access Levels Info */}
          <div className="bg-green-50 rounded-lg shadow-md p-4">
            <h3 className="font-bold text-green-800 mb-3 pb-2 border-b border-green-100">Access Levels</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 mt-0.5"></div>
                <div>
                  <p className="font-medium">Public Articles</p>
                  <p className="text-sm text-gray-600">Available to all users</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-200 flex-shrink-0 mt-0.5"></div>
                <div>
                  <p className="font-medium">Pro Articles</p>
                  <p className="text-sm text-gray-600">Available to Pro and Enterprise subscribers</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-200 flex-shrink-0 mt-0.5"></div>
                <div>
                  <p className="font-medium">Enterprise Articles</p>
                  <p className="text-sm text-gray-600">Exclusive to Enterprise subscribers</p>
                </div>
              </div>
              {(!user || subscription?.tier === 'free') && (
                <div className="mt-4 pt-4 border-t border-green-100">
                  <Link
                    to="/pricing"
                    className="block w-full text-center py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Upgrade for Full Access
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogList;
