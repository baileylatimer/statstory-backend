# Setting Up GitHub CI/CD with Fly.io

This guide explains how to set up GitHub Actions for continuous deployment to Fly.io.

## Adding Your Fly API Token to GitHub Secrets

You've already generated a Fly API token:

```
fm2_lJPECAAAAAAACLR7xBCok5odw2aoOv/22g67j/eYwrVodHRwczovL2FwaS5mbHkuaW8vdjGUAJLOABBh6R8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDxxfZuf8t1bNIVTgVEtGy6wsOhYVgeX8lfWdwHHKoRVrTRWiDFyQJpqgEhrh0tWDIJG6Yw3ZZ0a2OLoE+XETvQyKP5LdVLGioKcZ46kQeWTqpqLoE6gKKYvVHyam1C8jnAVn1udEmFVrOieKELFMScBc9LT3089M6FttapGnBRUVoVa4Ik+mHwq9WHxccQgynfPCiTF7WYfal8dUNOPrcDH7urIarfJL2enNlTlEaw=,fm2_lJPETvQyKP5LdVLGioKcZ46kQeWTqpqLoE6gKKYvVHyam1C8jnAVn1udEmFVrOieKELFMScBc9LT3089M6FttapGnBRUVoVa4Ik+mHwq9WHxccQQ1oqgM6foeZxdZGrgts2sTsO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZYEks5oFY/+zmgVknQXzgAPv9IKkc4AD7/SxCBlYeLSOE0WlpUvYYoJ2CY2qHpnTUK/0kMlVRESie+GuQ==,fo1_Df4yXNFElAcyeE1AK9wHGKLtlgrKAI-Ba9Xj2pAP8lw
```

Now you need to add this token as a secret in your GitHub repository. Follow these steps:

1. Go to your GitHub repository: https://github.com/baileylatimer/statstory-backend

2. Click on "Settings" in the top navigation bar (you need admin access to the repository)

3. In the left sidebar, click on "Secrets and variables" and then "Actions"

4. Click the "New repository secret" button

5. Enter the following information:
   - **Name**: `FLY_API_TOKEN` (must match exactly as it's used in the workflow file)
   - **Secret**: Paste the entire token shown above

6. Click "Add secret"

## How GitHub Actions Uses This Token

The GitHub Actions workflow is already configured in `.github/workflows/fly.yml`. It uses this token in the deployment step:

```yaml
- name: Deploy to Fly.io
  run: flyctl deploy --remote-only
  env:
    FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

When a new commit is pushed to the `master` (or `main`) branch, GitHub Actions will:

1. Check out the code
2. Set up Fly.io CLI
3. Deploy using your token
4. Verify the deployment

## Testing the CI/CD Pipeline

After adding the secret, you can test the CI/CD pipeline by:

1. Making a small change to any file in the repository
2. Committing and pushing to the `master` branch
3. Going to the "Actions" tab in your GitHub repository to watch the deployment progress

## Creating Additional Tokens

If you need to create additional tokens in the future, use:

```bash
~/.fly/bin/flyctl tokens create
```

You can also manage tokens in the Fly.io dashboard at https://fly.io/dashboard/personal/tokens
