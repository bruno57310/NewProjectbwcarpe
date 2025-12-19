import { createClient } from '@supabase/supabase-js';

// Debug: Log environment variables
console.log('🔗 Environment Variables Check:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING',
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

// Debug: Check if .env file is loaded
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing environment variables!');
  console.error('Make sure your .env file exists and contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const httpBasicUser = import.meta.env.VITE_HTTP_BASIC_USER;
const httpBasicPassword = import.meta.env.VITE_HTTP_BASIC_PASSWORD;

console.log('🔗 Supabase Configuration:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  source: 'self-hosted instance',
  isSelfHosted: true,
  fullUrl: supabaseUrl,
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
  hasHttpBasicAuth: !!(httpBasicUser && httpBasicPassword)
});

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    actualUrl: import.meta.env.VITE_SUPABASE_URL,
    actualKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the dev server.');
}

// Test connectivity using a valid endpoint
console.log('🧪 Testing self-hosted Supabase accessibility:', supabaseUrl);

// Alternative test with more detailed error handling
const testDetailedConnectivity = async () => {
  try {
    console.log('🔍 Detailed connectivity test starting...');

    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    };

    // Add HTTP Basic Auth for REST API endpoints (use a separate header if needed)
    if (httpBasicUser && httpBasicPassword) {
      const credentials = btoa(`${httpBasicUser}:${httpBasicPassword}`);
      // For REST API test, we can use Basic Auth
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers
    });
    
    console.info('📊 Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });
    
    if (response.ok || response.status === 401) {
      // 401 is expected for unauthenticated requests to PostgREST
      const text = await response.text();
      console.info(`✅ Self-hosted Supabase connectivity successful: HTTP ${response.status}: ${response.statusText}`);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Detailed connectivity test failed:', error);
    return false;
  }
};

// Validate URL format
try {
  new URL(supabaseUrl);
  console.info(`🔗 Connecting to: ${supabaseUrl}`);
  console.info(`🔑 API key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET'}`);
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

setTimeout(testDetailedConnectivity, 2000);

// Validate URL format
try {
  new URL(supabaseUrl);
  console.info(`🔗 Connecting to: ${supabaseUrl}`);
  console.info(`🔑 API key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET'}`);
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

// Custom fetch function with HTTP Basic Authentication
// IMPORTANT: Only apply HTTP Basic Auth to REST API endpoints, NOT auth endpoints
const customFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  const headers = new Headers(init?.headers);

  // Only add HTTP Basic Auth to REST API endpoints (/rest/v1/)
  // NEVER apply it to auth endpoints (/auth/v1/) as it breaks authentication
  //if (httpBasicUser && httpBasicPassword && url.includes('/rest/v1/')) {
  //  const credentials = btoa(`${httpBasicUser}:${httpBasicPassword}`);
  //  headers.set('Authorization', `Basic ${credentials}`);
  //  console.log('🔐 Adding HTTP Basic Auth to REST API request');
  //}

  if (httpBasicUser && httpBasicPassword && url.includes('/rest/v1/') && !headers.has('Authorization')) {
    const credentials = btoa(`${httpBasicUser}:${httpBasicPassword}`);
    headers.set('Authorization', `Basic ${credentials}`);
		console.log('🔐 Adding HTTP Basic Auth to REST API request');
  }

  return fetch(input, {
    ...init,
    headers
  });
};

// Create client with enhanced session persistence configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true, // Enable debug mode for self-hosted
    storage: window?.localStorage ? {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch {
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      }
    } : undefined
  },
  global: {
    headers: {
      'X-Client-Info': 'carpbait-pro-web'
    },
    fetch: customFetch
  }
});

// Test auth configuration
console.log('🔐 Auth Configuration:', {
  flowType: 'implicit',
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  hasStorage: !!window?.localStorage
});

// Enhanced error handling for auth operations
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth State Change:', {
    event,
    hasSession: !!session,
    userEmail: session?.user?.email,
    timestamp: new Date().toISOString()
  });
  
  if (event === 'SIGNED_IN' && session?.user) {
    console.log('✅ User signed in successfully:', session.user.email);
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token refreshed for user:', session?.user?.email);
  } else if (event === 'USER_UPDATED') {
    console.log('👤 User updated:', session?.user?.email);
  }
});

// Test basic connectivity on initialization
const testBasicAuth = async () => {
  try {
    console.log('🧪 Testing basic auth connectivity...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth connectivity test failed:', error);
    } else {
      console.log('✅ Auth connectivity test passed');
    }
  } catch (err) {
    console.error('❌ Auth connectivity test error:', err);
  }
};

// Run connectivity test after a short delay
setTimeout(testBasicAuth, 1000);

// Create client with enhanced session persistence configuration (keeping original for compatibility)
export const supabaseOriginal = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', 
    debug: true, // Enable debug mode for self-hosted
    storage: {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch {
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      }
    }
  }
});

// Enhanced connection test function with detailed error handling
export const testSupabaseConnection = async () => {
  // First check if we have network connectivity
  if (!navigator.onLine) {
    throw new Error('No internet connection available. Please check your network connection.');
  }

  try {
    console.log('🧪 Testing Supabase connection to:', supabaseUrl);
    
    // Test a simple query that should always work if the connection is valid
    const { data, error } = await supabase
      .from('flour_categories')
      .select('count')
      .limit(1);

    if (error) {
      // Log detailed error information
      console.error('Supabase connection test failed:', {
        error,
        url: supabaseUrl,
        hasKey: !!supabaseAnonKey,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    // Enhanced error logging
    console.error('Supabase connection test failed:', {
      error,
      timestamp: new Date().toISOString(),
      navigator: {
        onLine: navigator.onLine,
        userAgent: navigator.userAgent
      }
    });

    // Throw a more specific error based on the type of failure
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to reach Supabase server. Please check your internet connection and try again.');
    }

    throw error;
  }
};
