import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Calendar, 
  Tag, 
  Image as ImageIcon, 
  FileText, 
  Check, 
  AlertCircle,
  RefreshCw,
  Home,
  ThumbsUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  published: boolean;
  featured: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
  published_at: string | null;
  category_id: string | null;
  tags: string[];
  access_level: 'public' | 'pro' | 'enterprise';
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image_url: '',
    published: false,
    featured: false,
    category_id: '',
    tags: '',
    access_level: 'public' as 'public' | 'pro' | 'enterprise'
  });

  // Category form state
  const [categoryFormData, setcategoryFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const isAdmin = user?.email === 'bruno_wendling@orange.fr';

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: '/blog-admin' } });
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    fetchCategories();
    fetchPosts();
  }, [user, isAdmin, navigate]);

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
      setError('Error loading categories');
    }
  };

  const fetchPosts = async (attempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Error loading blog posts');
      
      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      if (!formData.title || !formData.content) {
        setError('Title and content are required');
        return;
      }
      
      const slug = formData.slug || formData.title.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      const tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      const postData = {
        title: formData.title,
        slug,
        content: formData.content,
        excerpt: formData.excerpt || null,
        image_url: formData.image_url || null,
        published: formData.published,
        featured: formData.featured,
        category_id: formData.category_id || null,
        tags,
        access_level: formData.access_level,
        author_id: user?.id,
        published_at: formData.published ? new Date().toISOString() : null
      };
      
      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);
        
        if (error) throw error;
        setSuccess('Post updated successfully');
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);
        
        if (error) throw error;
        setSuccess('Post created successfully');
      }
      
      resetForm();
      fetchPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      setError('Error saving post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      image_url: post.image_url || '',
      published: post.published,
      featured: post.featured,
      category_id: post.category_id || '',
      tags: post.tags ? post.tags.join(', ') : '',
      access_level: post.access_level || 'public'
    });
    setIsEditing(true);
    setShowCategoryManager(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPosts(posts.filter(post => post.id !== id));
      setSuccess('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Error deleting post');
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      image_url: '',
      published: false,
      featured: false,
      category_id: '',
      tags: '',
      access_level: 'public'
    });
    setIsEditing(false);
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchPosts(0);
  };

  const generateSlug = () => {
    if (!formData.title) return;
    
    const slug = formData.title.toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    setFormData({
      ...formData,
      slug
    });
  };

  // Category management functions
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      if (!categoryFormData.name) {
        setError('Category name is required');
        return;
      }
      
      const slug = categoryFormData.slug || categoryFormData.name.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      const categoryData = {
        name: categoryFormData.name,
        slug,
        description: categoryFormData.description || null
      };
      
      if (editingCategory) {
        const { error } = await supabase
          .from('blog_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        setSuccess('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('blog_categories')
          .insert([categoryData]);
        
        if (error) throw error;
        setSuccess('Category created successfully');
      }
      
      resetCategoryForm();
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Error saving category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setcategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Posts in this category will become uncategorized.')) return;
    
    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(categories.filter(category => category.id !== id));
      setSuccess('Category deleted successfully');
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Error deleting category');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setcategoryFormData({
      name: '',
      slug: '',
      description: ''
    });
  };

  const generateCategorySlug = () => {
    if (!categoryFormData.name) return;
    
    const slug = categoryFormData.name.toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    setcategoryFormData({
      ...categoryFormData,
      slug
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="mb-4">You don't have permission to access this page.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/blog"
            className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
            title="Back to Blog"
          >
            <Home className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-green-800">Blog Administration</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setIsEditing(true);
              setShowCategoryManager(false);
            }}
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
          <button
            onClick={() => {
              setShowCategoryManager(!showCategoryManager);
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showCategoryManager 
                ? "bg-blue-700 text-white hover:bg-blue-600" 
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            <Tag className="w-4 h-4" />
            {showCategoryManager ? "Hide Categories" : "Manage Categories"}
          </button>
        </div>
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

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {showCategoryManager ? (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-blue-800">
              Category Management
            </h2>
            <button
              onClick={() => setShowCategoryManager(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category Form */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setcategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={categoryFormData.slug}
                      onChange={(e) => setcategoryFormData({ ...categoryFormData, slug: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="auto-generated-if-empty"
                    />
                    <button
                      type="button"
                      onClick={generateCategorySlug}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      title="Generate from name"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setcategoryFormData({ ...categoryFormData, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingCategory ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>

            {/* Categories List */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-4">
                Existing Categories
              </h3>
              <div className="overflow-y-auto max-h-[400px] pr-2">
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No categories found. Create your first category.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map(category => (
                      <div 
                        key={category.id} 
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-800">{category.name}</h4>
                            <p className="text-sm text-gray-500">Slug: {category.slug}</p>
                            {category.description && (
                              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : isEditing ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-green-800">
              {editingPost ? 'Edit Article' : 'New Article'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="auto-generated-if-empty"
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    title="Generate from title"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="Brief summary of the article (optional)"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg font-mono"
                rows={12}
                required
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                HTML is supported for formatting. Use {'<'}p{'>'}, {'<'}h2{'>'}, {'<'}ul{'>'}, etc. for rich content.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate tags with commas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level
                </label>
                <select
                  value={formData.access_level}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    access_level: e.target.value as 'public' | 'pro' | 'enterprise' 
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="public">Public (All users)</option>
                  <option value="pro">Pro (Pro & Enterprise subscribers)</option>
                  <option value="enterprise">Enterprise (Enterprise subscribers only)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>Published</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>Featured</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingPost ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Access Level</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Stats</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No articles found. Create your first article by clicking the "New Article" button.
                    </td>
                  </tr>
                ) : (
                  posts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{post.title}</td>
                      <td className="px-4 py-3">{post.blog_categories?.name || '-'}</td>
                      <td className="px-4 py-3">
                        {post.access_level === 'pro' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Pro
                          </span>
                        ) : post.access_level === 'enterprise' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Enterprise
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Public
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {post.published ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Draft
                          </span>
                        )}
                        {post.featured && (
                          <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Eye className="w-4 h-4" />
                            {post.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(post)}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/blog/${post.slug}`}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogAdmin;
