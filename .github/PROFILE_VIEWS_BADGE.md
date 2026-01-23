# Profile Views Badge

## Implementation

This repository uses a **self-hosted, privacy-preserving profile views badge** powered by GitHub Actions.

### How It Works

1. **Data Source**: GitHub Traffic API (unique visitors from last 14 days)
2. **Update Frequency**: Every 6 hours via scheduled workflow
3. **Badge Format**: SVG badge matching the style of the previous komarev badge
4. **Storage**: Badge stored at `.github/profile-views.svg`

### Workflow

- **File**: `.github/workflows/profile-views.yml`
- **Schedule**: Every 6 hours (`0 */6 * * *`)
- **Manual trigger**: Available via workflow_dispatch

### Privacy & Accuracy

**Advantages over third-party badges (komarev, etc.):**

✅ **Privacy**: No third-party tracking - all data from GitHub's official API
✅ **Accuracy**: Uses GitHub's actual traffic data (unique visitors)
✅ **Control**: Full ownership and transparency
✅ **Reliability**: No external service dependencies

**Trade-offs:**

⚠️ **Update frequency**: Updates every 6 hours (not real-time)
⚠️ **Commit noise**: Creates small commits when count changes (marked with `[skip ci]`)
⚠️ **Data window**: Shows unique visitors from last 14 days (GitHub API limitation)

### Badge Usage

The badge is displayed in the README:

```markdown
<img src="https://raw.githubusercontent.com/camilo-cf/camilo-cf/main/.github/profile-views.svg" alt="Profile views" />
```

### Manual Update

To manually trigger an update:

1. Go to **Actions** tab
2. Select **Update Profile Views Badge** workflow
3. Click **Run workflow**

### Technical Details

**Workflow steps:**
1. Fetch unique visitor count from GitHub Traffic API
2. Generate SVG badge with current count
3. Commit badge to `.github/profile-views.svg` (if changed)
4. Badge updates appear in README automatically (via raw.githubusercontent.com)

**Permissions required:**
- `contents: write` - To commit the updated badge

**GitHub API used:**
```bash
gh api repos/{owner}/{repo}/traffic/views --jq '.uniques'
```

### Customization

To customize the badge appearance, edit the SVG template in `.github/workflows/profile-views.yml`:

- **Color**: Change the `fill` color in line: `<rect x="130" width="50" height="28" fill="#00C7B7"/>`
- **Width**: Adjust `width` attributes
- **Font**: Modify `font-family` in the text elements

### Rationale

**Why migrate from komarev?**

The previous implementation used komarev.com/ghpvc, which had several concerns:
- Privacy: Third-party service tracks every image request (IP, User-Agent, Referrer)
- Accuracy: Unknown bot filtering mechanisms
- Control: Dependency on external service availability
- Transparency: Closed-source implementation

This self-hosted solution addresses all these concerns while maintaining the same visual appearance.

---

**Note**: The badge shows unique visitors from the last 14 days, which is the data window provided by GitHub's Traffic API. This is more accurate than simple hit counters as it represents actual unique human visitors to the repository.
