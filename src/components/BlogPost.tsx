import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Tag, 
  User, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  ArrowLeft, 
  Send, 
  Lock, 
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  published_at: string;
  created_at: string;
  views_count: number;
  likes_count: number;
  tags: string[];
  access_level: 'public' | 'pro' | 'enterprise';
  author_id: string;
  category_id: string;
  author: {
    email: string;
    display_name: string;
  };
  category: {
    name: string;
    slug: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    email: string;
    display_name: string;
  };
}

function BlogPost() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [postUuid, setPostUuid] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [subscription, setSubscription] = useState<{ tier: string } | null>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // First, fetch subscription whenever user changes
  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscriptionLoaded(true);
    }
  }, [user]);

  // Then, fetch post when postId, user, or subscription changes
  useEffect(() => {
    if (postId && subscriptionLoaded) {
      fetchPost();
    }
  }, [postId, subscriptionLoaded]);

  // Finally, fetch comments and check likes when postUuid is available
  useEffect(() => {
    if (postUuid) {
      fetchComments();
      if (user) {
        checkIfLiked();
      }
    }
  }, [postUuid, user]);

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

  const hasAccessToPost = (accessLevel: string): boolean => {
    if (!accessLevel || accessLevel === 'public') return true;
    
    if (!user || !subscription) return false;
    
    if (accessLevel === 'pro') {
      return subscription.tier === 'pro' || subscription.tier === 'enterprise';
    }
    
    if (accessLevel === 'enterprise') {
      return subscription.tier === 'enterprise';
    }
    
    return false;
  };

  const fetchPost = async (attempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      setAccessError(null);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles!blog_posts_author_id_fkey (
            email,
            display_name
          ),
          blog_categories (
            name,
            slug
          )
        `)
        .eq('slug', postId)
        .single();

      // Handle the case where no post is found
      if (error) {
        if (error.code === '406') {
          setPost(null);
          setError(null);
          setLoading(false);
          return;
        }
        
        // If the error is 403 (Forbidden), it means the user doesn't have access
        if (error.code === '403') {
          setAccessError('You do not have permission to view this post');
          return;
        }
        
        throw error;
      }
      
      // Check if the user has access to this post based on access_level
      if (data.access_level && !hasAccessToPost(data.access_level)) {
        setAccessError(`This article is only available to ${data.access_level} subscribers`);
        setPost(data); // Still set the post to show partial information
        setPostUuid(data.id); // Set the UUID for other operations
        return;
      }
      
      // Format the post data
      const formattedPost = {
        ...data,
        author: data.profiles,
        category: data.blog_categories
      };
      
      setPost(formattedPost);
      setPostUuid(data.id);
      
      // Increment view count
      if (data) {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);
        
        if (updateError) {
          console.error('Error updating view count:', updateError);
        }
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Error loading blog post');
      
      // Implement retry logic with exponential backoff
      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, ...
        console.log(`Retrying in ${backoffTime}ms...`);
        setTimeout(() => {
          setRetryCount(attempt + 1);
          fetchPost(attempt + 1);
        }, backoffTime);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postUuid) return;

    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          profiles!blog_comments_user_id_fkey (
            email,
            display_name
          )
        `)
        .eq('post_id', postUuid)
        .eq('approved', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Format the comments data
      const formattedComments = data.map(comment => ({
        ...comment,
        user: comment.profiles
      }));
      
      setComments(formattedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !postUuid) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('post_id', postUuid)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setLiked(!!data);
    } catch (err) {
      console.error('Error checking like status:', err);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/blog/${postId}` } });
      return;
    }
    
    if (!post || !postUuid) return;
    
    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('blog_likes')
          .delete()
          .eq('post_id', postUuid)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Update post likes count
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ likes_count: Math.max(0, (post.likes_count || 0) - 1) })
          .eq('id', postUuid);
        
        if (updateError) throw updateError;
        
        setLiked(false);
        setPost({
          ...post,
          likes_count: Math.max(0, (post.likes_count || 0) - 1)
        });
      } else {
        // Like
        const { error } = await supabase
          .from('blog_likes')
          .insert([{ post_id: postUuid, user_id: user.id }]);
        
        if (error) throw error;
        
        // Update post likes count
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ likes_count: (post.likes_count || 0) + 1 })
          .eq('id', postUuid);
        
        if (updateError) throw updateError;
        
        setLiked(true);
        setPost({
          ...post,
          likes_count: (post.likes_count || 0) + 1
        });
      }
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth', { state: { from: `/blog/${postId}` } });
      return;
    }
    
    if (!post || !postUuid || !newComment.trim()) return;
    
    try {
      setCommentLoading(true);
      
      const { data, error } = await supabase
        .from('blog_comments')
        .insert([{
          post_id: postUuid,
          user_id: user.id,
          content: newComment.trim()
        }])
        .select(`
          *,
          profiles!blog_comments_user_id_fkey (
            email,
            display_name
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Format the new comment
      const formattedComment = {
        ...data,
        user: data.profiles
      };
      
      setComments([...comments, formattedComment]);
      setNewComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'Blog Post',
        text: post?.excerpt || 'Check out this blog post',
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Error copying to clipboard:', err));
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchPost(0);
  };

  const getAccessLevelBadge = (level?: string) => {
    if (!level || level === 'public') return null;
    
    switch (level) {
      case 'pro':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Pro Content
          </span>
        );
      case 'enterprise':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            Enterprise Content
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex flex-col items-center">
          <AlertCircle className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Article</h2>
          <p className="mb-4">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <Link
              to="/blog"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Post Not Found</h2>
          <p className="mb-4">The article you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/blog"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/blog"
          className="inline-flex items-center text-green-700 hover:text-green-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Articles
        </Link>
      </div>

      {/* Access Error */}
      {accessError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6" />
            <h2 className="text-xl font-bold">Access Restricted</h2>
          </div>
          <p className="mb-4">{accessError}</p>
          <Link
            to="/pricing"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Upgrade Subscription
          </Link>
        </div>
      )}

      {/* Article Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        {/* Article Image */}
        <div className="relative h-64 md:h-96 bg-gray-200">
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
          <div className="absolute top-4 right-4">
            {getAccessLevelBadge(post.access_level)}
          </div>
        </div>

        {/* Article Meta */}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at || post.created_at).toLocaleDateString()}
            </span>
            {post.category && (
              <span className="flex items-center gap-1">
                <span>•</span>
                {post.category.name}
              </span>
            )}
            {post.author && (
              <span className="flex items-center gap-1">
                <span>•</span>
                <User className="w-4 h-4" />
                {post.author.display_name || post.author.email || 'Unknown Author'}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-6">{post.title}</h1>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Article Stats and Actions */}
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  liked 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                disabled={!user || accessError !== null}
              >
                <ThumbsUp className="w-4 h-4" />
                {post.likes_count || 0}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{post.views_count || 0} views</span>
            </div>
          </div>

          {/* Article Content */}
          {!accessError ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="prose max-w-none opacity-50 blur-sm pointer-events-none">
              <div dangerouslySetInnerHTML={{ __html: post.content.substring(0, 500) + '...' }} />
              <div className="mt-8 text-center">
                <p className="text-lg font-bold">Content restricted</p>
                <p>Upgrade your subscription to access this article</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {!accessError && (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <div className="mb-4">
              <textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                disabled={!user}
              ></textarea>
              {!user && (
                <p className="mt-2 text-sm text-gray-500">
                  <Link to="/auth" className="text-green-700 hover:underline">Sign in</Link> to leave a comment
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!user || !newComment.trim() || commentLoading}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  !user || !newComment.trim() || commentLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-700 text-white hover:bg-green-600'
                }`}
              >
                {commentLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                        {comment.user?.display_name?.[0] || comment.user?.email?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{comment.user?.display_name || comment.user?.email || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogPost;
