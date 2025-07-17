# Kiro Settings

## MCP Configuration

To set up MCP (Model Context Protocol) servers:

1. Copy `mcp.json.template` to `mcp.json`
2. Replace the placeholder values with your actual API keys:
   - `YOUR_PROJECT_REF`: Your Supabase project reference
   - `YOUR_SUPABASE_ACCESS_TOKEN`: Your Supabase access token
   - `YOUR_STRIPE_SECRET_KEY`: Your Stripe secret key (test key for development)

**Important**: Never commit the actual `mcp.json` file with real API keys. It's already in `.gitignore` to prevent accidental commits.

## Security Note

The `mcp.json` file contains sensitive API keys and should never be committed to version control. Always use environment variables or secure configuration management in production.
