export interface GitHubRepositoryStats {
  owner: string;
  repo: string;
  url: string;
  stars: number;
  forks: number;
}

interface GitHubRepositoryResponse {
  html_url?: string;
  stargazers_count?: number;
  forks_count?: number;
}

interface CachedStats {
  expiresAt: number;
  stats: GitHubRepositoryStats | null;
}

const cache = new Map<string, CachedStats>();
const cacheTtlMs = 1000 * 60 * 30;

export async function resolveGitHubStats(...links: Array<string | null | undefined>): Promise<GitHubRepositoryStats | null> {
  const repository = links
    .map((link) => parseGitHubRepositoryUrl(link))
    .find((item): item is { owner: string; repo: string } => item !== null);

  if (!repository) {
    return null;
  }

  const cacheKey = `${repository.owner}/${repository.repo}`.toLowerCase();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.stats;
  }

  const stats = await fetchGitHubRepositoryStats(repository.owner, repository.repo);
  cache.set(cacheKey, {
    expiresAt: Date.now() + cacheTtlMs,
    stats,
  });

  return stats;
}

function parseGitHubRepositoryUrl(rawUrl: string | null | undefined): { owner: string; repo: string } | null {
  if (!rawUrl) {
    return null;
  }

  const url = parseUrl(rawUrl);
  if (!url) {
    return null;
  }

  if (/^[^.]+\.github\.io$/iu.test(url.hostname)) {
    const owner = url.hostname.replace(/\.github\.io$/iu, '');
    const [rawRepo] = url.pathname.replace(/^\/+/u, '').split('/').filter(Boolean);
    const repo = rawRepo || `${owner}.github.io`;
    return { owner, repo };
  }

  if (!/(^|\.)github\.com$/iu.test(url.hostname)) {
    return null;
  }

  const [owner, rawRepo] = url.pathname
    .replace(/^\/+/u, '')
    .split('/')
    .filter(Boolean);

  if (!owner || !rawRepo) {
    return null;
  }

  const repo = rawRepo.replace(/\.git$/iu, '');
  if (!repo) {
    return null;
  }

  return { owner, repo };
}

function parseUrl(rawUrl: string) {
  try {
    return new URL(rawUrl);
  } catch {
    try {
      return new URL(`https://${rawUrl}`);
    } catch {
      return null;
    }
  }
}

async function fetchGitHubRepositoryStats(owner: string, repo: string): Promise<GitHubRepositoryStats | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'portfolio-dynamic-api',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as GitHubRepositoryResponse;
    return {
      owner,
      repo,
      url: data.html_url ?? `https://github.com/${owner}/${repo}`,
      stars: Number(data.stargazers_count ?? 0),
      forks: Number(data.forks_count ?? 0),
    };
  } catch {
    return null;
  }
}
