# StatStory Backend API

A Express.js API backend for the StatStory application, providing authentication, data storage, and image generation services.

## Technology Stack

- **Server Framework**: Node.js + Express.js
- **Language**: TypeScript
- **Database & Authentication**: Firebase Admin SDK
- **External APIs**: OpenAI for image generation
- **Deployment**: Fly.io

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/baileylatimer/statstory-backend.git
   cd statstory-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual Firebase and OpenAI credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The server will start at http://localhost:3000

## API Endpoints

- **/api/auth** - Authentication operations
- **/api/saves** - Game saves management
- **/api/saves/:saveId/events** - Events for a specific save
- **/api/saves/:saveId/posts** - Posts for a specific save
- **/api/images** - AI image generation and processing
- **/api/health** - Server health check
- **/api/test** - Connectivity testing

## Deployment

### Deploying to Fly.io

1. **Install the Fly.io CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**
   ```bash
   flyctl auth login
   ```

3. **Launch the app (first-time deployment)**
   ```bash
   fly launch
   # Choose "N" when asked if you want to use an existing configuration
   # Enter "glorygen-backend" as the app name
   # Select "Sea (Seattle, WA (US))" as the region
   # Choose "N" for Postgres DB and Redis
   # Choose "N" for now when asked to deploy now
   ```

4. **Set environment variables for Firebase and OpenAI**
   ```bash
   fly secrets set FIREBASE_PROJECT_ID="your-project-id" \
                  FIREBASE_CLIENT_EMAIL="your-service-account-email@example.com" \
                  FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com" \
                  OPENAI_API_KEY="your-openai-api-key"
   ```

5. **Set the Firebase private key (handles newlines properly)**
   ```bash
   fly secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key content with \n for newlines\n-----END PRIVATE KEY-----\n"
   ```

6. **Deploy the application**
   ```bash
   fly deploy
   ```

7. **Check the deployment status**
   ```bash
   fly status
   ```

### GitHub Actions Deployment

This repository includes a GitHub Actions workflow that automatically deploys to Fly.io when changes are pushed to the main branch.

To enable this:

1. Create a Fly.io API token:
   ```bash
   flyctl auth token
   ```

2. Add this token as a GitHub secret named `FLY_API_TOKEN` in your repository settings

## Memory and Performance Considerations

The application is configured with 1GB of RAM to handle OpenAI image generation processes, which can be memory-intensive. If you experience out-of-memory issues, you can adjust the VM size in the `fly.toml` file:

```toml
[vm]
  memory = 1024  # Increase this value if needed
```

## Health Monitoring

The application includes a `/api/health` endpoint that returns the server status, uptime, and environment. This endpoint is used by Fly.io for health checks.

## Updating the Frontend

After deploying the backend, update the frontend's production environment configuration to use the new backend URL:

```
# In StatStory/.env.production
API_URL=https://glorygen-backend.fly.dev/api
ENV=production
```
