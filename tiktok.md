# TikTok Integration Plan for ClipCast

This document explains how ClipCast enables users to connect their TikTok accounts and upload videos directly, following TikTok's official API and best practices for Next.js apps.

---

## 1. OAuth Authentication Flow

### a. **User Initiates Login**
- User clicks **Connect with TikTok** in the UI.
- The app redirects to `/api/auth/tiktok` (Next.js API route).
- The backend generates a CSRF state, sets it as a cookie, and redirects the user to TikTok's OAuth page with:
  - `client_key` (from .env)
  - `redirect_uri` (must match TikTok Developer Portal)
  - `scope`: `user.info.basic,video.publish` (**Note:** `video.publish` is required for direct posting)
  - `state` (CSRF)

### b. **TikTok Redirects Back**
- TikTok redirects to `/api/auth/tiktok/callback` with `code` and `state`.
- The backend validates the CSRF state.
- The backend exchanges the code for an `access_token`, `refresh_token`, and `open_id` via TikTok's `/oauth/token` endpoint.
- These tokens are stored in the user's account context (or DB/session).

---

## 2. Video Upload Flow

### a. **Query Creator Info (Required)**
- **Before any video upload**, call `/api/tiktok/creator-info` which calls TikTok's `/v2/post/publish/creator_info/query/` endpoint.
- This returns the user's available `privacy_level_options` and other creator settings.
- **This step is mandatory** for direct posting to work properly.

### b. **Initialize Video Upload**
- The frontend calls `/api/tiktok/upload-init` with:
  - `access_token` (from context)
  - `title`, `privacy_level`, `video_size`, `chunk_size`, `total_chunk_count`
- The backend POSTs to TikTok's `/v2/post/publish/video/init/` endpoint (**Note:** NOT the inbox endpoint):
  - Headers: `Authorization: Bearer <access_token>`, `Content-Type: application/json; charset=UTF-8`
  - Body:
    ```json
    {
      "post_info": {
        "title": "...",
        "privacy_level": "PUBLIC_TO_EVERYONE", // Required - must match creator's options
        "disable_duet": false,
        "disable_comment": false,
        "disable_stitch": false
      },
      "source_info": {
        "source": "FILE_UPLOAD",
        "video_size": ..., 
        "chunk_size": ..., 
        "total_chunk_count": ...
      }
    }
    ```
- TikTok responds with an `upload_url` and `publish_id`.

### c. **Upload Video File (Chunked or Single)**
- The frontend sends the video file (or chunk) to `/api/tiktok/upload-chunk`.
- The backend streams the file to TikTok's `upload_url` using a PUT request:
  - Headers:
    - `Content-Type: video/mp4` (or video/quicktime, video/webm)
    - `Content-Range: bytes <start>-<end>/<total>`
    - `Content-Length: <chunk size>`
  - Body: binary video data
- Repeat for all chunks if chunked upload.

### d. **Check Upload Status (Optional)**
- To check if the video is processed, call TikTok's `/v2/post/publish/status/fetch/` with the `publish_id`.
- This endpoint requires `video.upload` OR `video.publish` scope.

---

## 3. Token Refresh
- If the `access_token` expires, the frontend calls `/api/auth/tiktok/refresh` with the `refresh_token`.
- The backend exchanges it for a new `access_token` and `refresh_token`.

---

## 4. Important Requirements & Limitations

### **Client Auditing**
- **Unaudited clients** can only post to private accounts (`SELF_ONLY` privacy level).
- For public posting, your TikTok app must be audited and approved by TikTok.
- During development, test with `privacy_level: "SELF_ONLY"`.

### **Rate Limits**
- Each `access_token` is limited to **6 requests per minute** for upload init.
- Plan accordingly for multiple users.

### **Domain Verification**
- For `PULL_FROM_URL` uploads, your domain must be verified with TikTok.
- For MVP, use `FILE_UPLOAD` method instead.

---

## 5. Security & Best Practices
- All secrets are stored in `.env` and never exposed to the client.
- Only the backend communicates with TikTok's API using user tokens.
- CSRF state is used to prevent forgery in OAuth.
- All API endpoints validate input and handle errors gracefully.
- Store tokens securely and implement proper token refresh logic.

---

## 6. Environment Variables Required
```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=https://yourdomain.com/api/auth/tiktok/callback
```

---

## 7. API Endpoints to Implement

### **Authentication**
- `GET /api/auth/tiktok` - Redirect to TikTok OAuth
- `GET /api/auth/tiktok/callback` - Handle OAuth callback
- `POST /api/auth/tiktok/refresh` - Refresh access token

### **Video Upload**
- `POST /api/tiktok/creator-info` - Query creator info (required first step)
- `POST /api/tiktok/upload-init` - Initialize video upload
- `PUT /api/tiktok/upload-chunk` - Upload video file/chunk
- `POST /api/tiktok/upload-status` - Check upload status

---

## 8. References
- [TikTok Content Posting API - Direct Post](https://developers.tiktok.com/doc/overview/doc/content-posting-api-reference-direct-post)
- [TikTok OAuth Docs](https://developers.tiktok.com/doc/login-kit-web)
- [TikTok Video Upload API](https://developers.tiktok.com/doc/overview/doc/content-posting-api-reference-upload-video)
- [TikTok Creator Info Query](https://developers.tiktok.com/doc/overview/doc/content-posting-api-get-started)

---

**This updated plan ensures a secure, robust, and compliant TikTok integration for ClipCast, following the latest official documentation and API requirements.** 