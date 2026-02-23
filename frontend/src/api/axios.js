import axios from 'axios';

// Normalize VITE_API_URL to prevent malformed values like ":5000/api"
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBase.startsWith(':') ? `http://localhost${rawBase}` : rawBase;
console.log('🔗 API baseURL:', rawBase, '->', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Authorization header set with token');
      } else {
        console.warn('⚠️ No token found in userInfo');
      }
    } else {
      console.warn('⚠️ No userInfo found in localStorage');
    }
    // show full request URL including baseURL for easier debugging
    try {
      const fullUrl = config.baseURL ? new URL(config.url, config.baseURL).toString() : config.url;
      console.log('📤 API Request:', config.method.toUpperCase(), fullUrl);
    } catch (e) {
      console.log('📤 API Request (fallback):', config.method.toUpperCase(), config.baseURL, config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error Response:', error.response?.status, error.response?.data?.message);
    return Promise.reject(error);
  }
);

// Organization helpers
export const getMyOrganization = async () => {
  try {
    const response = await api.get('/organizations/my-org');
    return response.data;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
};

export const createOrganization = async (orgData) => {
  const response = await api.post('/organizations', orgData);
  return response.data;
};

// Add a member to an organization (only org creator can call this)
export const addOrgMember = async (orgId, email) => {
  const response = await api.post(`/organizations/${orgId}/members`, { email });
  return response.data;
};

// Activity helpers
export const getActivities = async () => {
  const response = await api.get('/activity');
  return response.data;
};

export const getUnreadActivityCount = async () => {
  const response = await api.get('/activity/unread');
  // response.data: { count: number }
  return response.data?.count ?? 0;
};

export const clearUnreadActivityCount = async () => {
  const response = await api.post('/activity/clear');
  return response.data;
};

// Posts helpers
export const searchPosts = async (query = '', tags = [], contentType = '', sortBy = 'latest') => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (tags.length) params.append('tags', tags.join(','));
  if (contentType) params.append('contentType', contentType);
  if (sortBy) params.append('sortBy', sortBy);
  const response = await api.get(`/search?${params.toString()}`);
  return response.data;
};

export const getTags = async () => {
  const response = await api.get('/search/tags');
  return response.data.tags;
};

export const getPostsByTag = async (tagName) => {
  const response = await api.get(`/search/tag/${tagName}`);
  return response.data;
};

// Toggle like/unlike for a post
export const toggleLike = async (postId) => {
  const response = await api.post(`/posts/${postId}/like`);
  return response.data;
};

// Vote API: upvote | downvote | remove
export const voteOnPost = async (postId, voteType) => {
  const response = await api.post(`/posts/${postId}/vote`, { voteType });
  return response.data;
};

// Regenerate / persist AI feedback for a post
export const refreshAiFeedback = async (postId) => {
  const response = await api.post(`/posts/${postId}/ai`);
  return response.data;
};

// Comments helpers
export const fetchComments = async (postId) => {
  const response = await api.get(`/comments/${postId}`);
  return response.data;
};

export const createComment = async (postId, content) => {
  const response = await api.post('/comments', { postId, content });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
};

// React to a comment: like | dislike | remove
export const reactToComment = async (commentId, reactionType) => {
  const response = await api.post(`/comments/${commentId}/reaction`, { reactionType });
  return response.data;
};

// Podcasts helpers
export const uploadPodcast = async (formData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  const response = await api.post('/podcasts', formData, config);
  return response.data;
};

export const getPodcasts = async () => {
  const response = await api.get('/podcasts');
  return response.data;
};

export const getPodcast = async (podcastId) => {
  const response = await api.get(`/podcasts/${podcastId}`);
  return response.data;
};

export const updatePodcast = async (podcastId, data) => {
  const response = await api.put(`/podcasts/${podcastId}`, data);
  return response.data;
};

export const deletePodcast = async (podcastId) => {
  const response = await api.delete(`/podcasts/${podcastId}`);
  return response.data;
};

export const searchPodcasts = async (query = '', tags = []) => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (tags.length) params.append('tags', tags.join(','));
  const response = await api.get(`/podcasts/search/query?${params.toString()}`);
  return response.data;
};

// Advanced AI features
export const getPerspectives = async (postId) => {
  const response = await api.get(`/posts/${postId}/perspectives`);
  return response.data;
};

// Trending posts
export const getTrendingPosts = async (limit = 5, timeRange = '10days') => {
  const response = await api.get(`/posts/trending?limit=${limit}&timeRange=${timeRange}`);
  return response.data;
};

// Chat / Direct Messaging helpers
export const getMyConversations = async () => {
  const response = await api.get('/conversations');
  return response.data;
};

export const createOrGetConversation = async (recipientId) => {
  const response = await api.post(`/conversations`, { recipientId });
  return response.data;
};

export const getConversationMessages = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendChatMessage = async ({ conversationId, recipientId, content }) => {
  const response = await api.post(`/messages`, { conversationId, recipientId, content });
  return response.data;
};

// User profile
export const getUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}/profile`);
  return response.data;
};

export const getUserPosts = async (userId) => {
  const response = await api.get(`/posts/user/${userId}`);
  return response.data;
};

export const getUserPodcasts = async (userId) => {
  const response = await api.get(`/podcasts/user/${userId}`);
  return response.data;
};

export const getSentiment = async (postId) => {
  const response = await api.get(`/posts/${postId}/sentiment`);
  return response.data;
};

export const getRelatedPosts = async (postId) => {
  const response = await api.get(`/posts/${postId}/related`);
  return response.data;
};

export const transcribePodcast = async (podcastId) => {
  const response = await api.post(`/podcasts/${podcastId}/transcribe`);
  return response.data;
};

export default api;
