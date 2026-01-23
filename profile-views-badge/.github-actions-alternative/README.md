# GitHub Actions Profile Views Counter

A completely self-contained profile views counter using GitHub Actions.
No external services, complete privacy, but creates periodic commits.

## How It Works

1. A scheduled GitHub Action runs every 6 hours
2. Fetches view count from GitHub Traffic API
3. Generates an SVG badge file
4. Commits the badge to the repository
5. README displays the committed badge

## Pros & Cons

### Pros
- ✅ **100% Privacy**: No external services, no tracking
- ✅ **No Cost**: Uses GitHub infrastructure only
- ✅ **Accurate**: Uses GitHub's official traffic data
- ✅ **Simple**: No deployment needed

### Cons
- ❌ **Commit Noise**: Creates commits every update cycle
- ❌ **Not Real-Time**: Updates only when Action runs
- ❌ **Limited Data**: GitHub only provides 14 days of traffic data
- ❌ **Requires PAT**: Needs Personal Access Token with `repo` scope

## Setup Instructions

### Step 1: Create Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token (you'll need it in step 3)

### Step 2: Add Workflow File
Copy `.github/workflows/update-views.yml` to your profile repository.

### Step 3: Configure Repository Secret
1. Go to your repository Settings → Secrets and variables → Actions
2. Create new secret named `PROFILE_TOKEN`
3. Paste your PAT from step 1

### Step 4: Update README
Add this to your README:
```markdown
![Profile Views](https://raw.githubusercontent.com/USERNAME/USERNAME/main/.github/profile-views.svg)
```

### Step 5: Run Manually (Optional)
1. Go to Actions tab
2. Select "Update Profile Views"
3. Click "Run workflow"

The badge will be generated and committed to your repository.

## Configuration

Edit `.github/workflows/update-views.yml` to customize:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours (change as needed)
```

Options:
- `0 */6 * * *` - Every 6 hours (recommended)
- `0 */12 * * *` - Every 12 hours (less commit noise)
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sundays

## How GitHub Traffic API Works

GitHub provides traffic statistics for the last 14 days:
- **Unique visitors**: Count of unique users who viewed the profile
- **Total views**: Total number of views (including repeats)

The counter uses **unique visitors** as it's more accurate.

## Privacy

This implementation:
- ✅ Uses only GitHub's built-in analytics
- ✅ No third-party tracking
- ✅ No external API calls
- ✅ All data stays in GitHub

GitHub's traffic data already excludes:
- GitHub's own bots and crawlers
- Your own views (when logged in)
- Most automated traffic

## Limitations

1. **14-day window**: GitHub only keeps 14 days of traffic data, so if the Action doesn't run for >14 days, some views may be missed.

2. **Requires PAT**: Personal Access Token is needed, which has security implications if leaked.

3. **Commit history**: Each update creates a commit. Use `[skip ci]` in commit message to prevent triggering other workflows.

4. **Rate limits**: GitHub API has rate limits, but unlikely to hit them with infrequent updates.

## Reducing Commit Noise

### Option 1: Use `[skip ci]` (already included)
This prevents the commit from triggering other workflows.

### Option 2: Update less frequently
Change cron schedule to daily or weekly.

### Option 3: Squash commits periodically
Manually squash badge commits to keep history clean.

### Option 4: Use separate branch
Modify workflow to commit to a separate branch like `badges`, then reference:
```markdown
![Profile Views](https://raw.githubusercontent.com/USERNAME/USERNAME/badges/.github/profile-views.svg)
```

## Comparison to Self-Hosted Serverless

| Feature | GitHub Actions | Serverless (Vercel) |
|---------|----------------|---------------------|
| Privacy | ✅ Complete | ✅ High |
| Real-time | ❌ No | ✅ Yes |
| Commit noise | ❌ Yes | ✅ No |
| External deps | ✅ None | ⚠️ Upstash |
| Accuracy | ✅ High | ✅ High |
| Cost | ✅ Free | ✅ Free* |
| Setup | ⚠️ Medium | ⚠️ Medium |
| Maintenance | ✅ Low | ✅ Low |

## Troubleshooting

### Badge not updating
- Check Action logs in the Actions tab
- Verify `PROFILE_TOKEN` secret is set correctly
- Ensure PAT has `repo` scope

### Badge shows 0 views
- GitHub traffic data may not be available yet (takes 24-48h)
- Check if repository is public
- Verify Action has write permissions

### Permission denied errors
- PAT may have expired
- PAT may not have `repo` scope
- Repository may have restricted Actions permissions

## Migration

If switching from komarev or other service:
1. Note the current count
2. Can't directly migrate count (GitHub API only shows recent data)
3. Consider adding a note: "Counter reset on [date] - switched to GitHub Actions"

Or continue running both badges during a transition period.
