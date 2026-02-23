# Tier 1 Backend API Reference

## Base URL
```
http://localhost:5000/api
```

All endpoints (except auth) require:
- Header: `Authorization: Bearer {token}`

---

## 1. ORGANIZATIONS

### Create Organization
```bash
POST /organizations
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Engineering Team",
  "description": "Our engineering org"
}

Response: { _id, name, description, members: [...], createdBy }
```

### Get My Organization
```bash
GET /organizations/my-org
Authorization: Bearer {token}

Response: { _id, name, members: [{ fullName, email, department }], ... }
```

### Get Organization by ID
```bash
GET /organizations/:orgId
Authorization: Bearer {token}

Response: { _id, name, members, createdBy, ... }
```

### Add Member to Organization
```bash
POST /organizations/:orgId/members
Content-Type: application/json
Authorization: Bearer {token}

{
  "email": "user@example.com"
}

Response: { updated org with new member }
```

---

## 2. POSTS

### Create Post
```bash
POST /posts
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Reflection on sprint delays",
  "content": "This week made me realize...",
  "tags": ["Reflection", "Engineering"],
  "anonymityLevel": 1
}

Response: {
  _id, title, content, summary, tags,
  author: { fullName, email, department },
  aiFeedback: {
    summary: "...",
    mentor: "...",
    critic: "...",
    strategist: "...",
    executionManager: "...",
    riskEvaluator: "...",
    innovator: "..."
  },
  createdAt, updatedAt
}
```

### Get All Posts (Org-scoped)
```bash
GET /posts
Authorization: Bearer {token}

Response: [
  { _id, title, content, author, aiFeedback, tags, summary, ... },
  ...
]
```

### Get Trending Posts (Org-scoped)
```bash
GET /posts/trending?limit=5
Authorization: Bearer {token}

Query Parameters:
- limit: number of top items to return (default 5, max 20)

Response: [
  { _id, title, summary, upvoteCount, downvoteCount, commentsCount, createdAt, score, votesScore },
  ...
]
```

### Vote on a Post
```bash
POST /posts/:postId/vote
Content-Type: application/json
Authorization: Bearer {token}

Body:
{ "voteType": "upvote" | "downvote" | "remove" }

Response:
{ "userVote": "upvote" | "downvote" | null, "upvoteCount": number, "downvoteCount": number, "score": number }
```


### Get Single Post
```bash
GET /posts/:postId
Authorization: Bearer {token}

Response: { post details + all AI feedback }
```

### Update Post
```bash
PUT /posts/:postId
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["NewTag"],
  "anonymityLevel": 2
}

Response: { updated post }
```

### Delete Post
```bash
DELETE /posts/:postId
Authorization: Bearer {token}

Response: { message: "Post deleted successfully" }
```

---

## 3. COMMENTS

### Create Comment
```bash
POST /comments
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "Great insight about sprint delays!",
  "postId": "post_id_here"
}

Response: {
  _id, content,
  author: { fullName, email, department },
  post, createdAt, updatedAt
}
```

### Get Comments for Post
```bash
GET /comments/:postId
Authorization: Bearer {token}

Response: [
  { _id, content, author, likeCount, dislikeCount, currentUserReaction, createdAt, ... },
  ...
]
```

### React to a Comment
```bash
POST /comments/:commentId/reaction
Content-Type: application/json
Authorization: Bearer {token}

Body:
{ "reactionType": "like" | "dislike" | "remove" }

Response:
{ "userReaction": "like" | "dislike" | null, "likeCount": number, "dislikeCount": number }
```

### Update Comment
```bash
PUT /comments/:commentId
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "Updated comment text"
}

Response: { updated comment }
```

### Delete Comment
```bash
DELETE /comments/:commentId
Authorization: Bearer {token}

Response: { message: "Comment deleted successfully" }
```

---

## 4. SEARCH & TAGS

### Search Posts
```bash
GET /search?query=sprint&tags=Reflection,Engineering&contentType=Reflection
Authorization: Bearer {token}

Query Parameters:
- query: text search (optional)
- tags: comma-separated tag filter (optional)
- contentType: filter by content type (optional)

Response: [ matching posts ]
```

### Get All Tags
```bash
GET /search/tags
Authorization: Bearer {token}

Response: {
  tags: ["Reflection", "Engineering", "Decision Log", ...]
}
```

### Get Posts by Tag
```bash
GET /search/tag/:tagName
Authorization: Bearer {token}

Response: [ posts with this tag ]
```

---

## 5. AUTH (Already Implemented)

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "department": "Engineering"
}

Response: { _id, fullName, email, department, token }
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: { _id, fullName, email, department, token }
```

### Get Current User
```bash
GET /auth/me
Authorization: Bearer {token}

Response: { _id, fullName, email, department, organization }
```

---

## 6. AI TEXT REFINEMENT

### Refine Text (Shadow Writing)
```bash
POST /refine
Content-Type: application/json

{
  "rant": "This sprint was a disaster! Nobody communicates..."
}

Response: {
  refinedText: "This sprint presented challenges with team communication..."
}
```

---

## Error Responses

```json
{
  "message": "Error description"
}
```

Common status codes:
- 400: Bad request (missing fields)
- 401: Unauthorized (no token/invalid token)
- 403: Forbidden (access denied)
- 404: Not found
- 500: Server error

---

## Frontend Integration Checklist

- [ ] Create organization on first login / let user join existing org
- [ ] Store `token` in localStorage after auth
- [ ] Include `Authorization: Bearer {token}` in all requests
- [ ] Fetch posts/comments for currently selected organization
- [ ] Display all 6 AI persona feedbacks (not just mentor + critic)
- [ ] Filter posts by tags in Knowledge Hub
- [ ] Search posts by keywords
- [ ] Show author info based on anonymity level (hide for level 3)
