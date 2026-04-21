export type SearchSortOption = "relevance" | "recent" | "most_viewed";
export type SearchDateRange = "week" | "month" | "quarter" | "all";

export interface SearchableArticle {
  id?: string;
  title: string;
  body?: string | null;
  excerpt?: string | null;
  publishedAt?: string | Date | null;
  views?: number;
  categoryId?: string | null;
  contentType?: string | null;
  authorId?: string | null;
}

interface RankOptions {
  query: string;
  sortBy?: SearchSortOption;
  selectedCategoryId?: string;
  now?: Date;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "au",
  "aux",
  "avec",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "for",
  "in",
  "la",
  "le",
  "les",
  "of",
  "on",
  "or",
  "pour",
  "sur",
  "the",
  "to",
  "un",
  "une",
]);

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value?: string | null) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function countTermFrequency(tokens: string[], queryTokens: string[]) {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return queryTokens.reduce((sum, token) => sum + (counts.get(token) || 0), 0);
}

function parseDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRecencyBoost(value?: string | Date | null, now = new Date()) {
  const date = parseDate(value);
  if (!date) return 0;

  const ageInDays = Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (ageInDays <= 7) return 1.2;
  if (ageInDays <= 30) return 0.7;
  if (ageInDays <= 90) return 0.25;
  return 0;
}

function getPopularityBoost(views = 0) {
  if (!views || views <= 0) return 0;
  return Math.min(1.4, Math.log10(views + 1) / 2);
}

function computeBm25(tf: number, docLength: number, avgDocLength: number, idf: number) {
  if (!tf) return 0;
  const k1 = 1.5;
  const b = 0.75;
  const normalizedLength = avgDocLength > 0 ? docLength / avgDocLength : 1;
  return idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * normalizedLength)));
}

function getDocumentFrequency<T extends SearchableArticle>(documents: T[], queryTokens: string[]) {
  const documentFrequency = new Map<string, number>();

  for (const token of queryTokens) {
    let count = 0;
    for (const document of documents) {
      const haystack = new Set([
        ...tokenize(document.title),
        ...tokenize(document.excerpt),
        ...tokenize(document.body),
      ]);
      if (haystack.has(token)) count++;
    }
    documentFrequency.set(token, count);
  }

  return documentFrequency;
}

function getContainsMatchScore(article: SearchableArticle, queryTokens: string[]) {
  const title = normalizeText(article.title);
  const excerpt = normalizeText(article.excerpt);
  const body = normalizeText(article.body);

  return queryTokens.reduce((score, token) => {
    let next = score;
    if (title.includes(token)) next += 8;
    if (excerpt.includes(token)) next += 4;
    if (body.includes(token)) next += 2;
    return next;
  }, 0);
}

export function filterByDateRange<T extends SearchableArticle>(articles: T[], range: SearchDateRange) {
  if (range === "all") return articles;

  const now = new Date();
  const threshold = new Date(now);
  if (range === "week") threshold.setDate(now.getDate() - 7);
  if (range === "month") threshold.setMonth(now.getMonth() - 1);
  if (range === "quarter") threshold.setMonth(now.getMonth() - 3);

  return articles.filter((article) => {
    const publishedAt = parseDate(article.publishedAt);
    return publishedAt ? publishedAt >= threshold : false;
  });
}

export function sortSearchResults<T extends SearchableArticle>(
  articles: Array<T & { _score?: number }>,
  sortBy: SearchSortOption,
) {
  if (sortBy === "most_viewed") {
    return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  if (sortBy === "recent") {
    return [...articles].sort((a, b) => {
      const left = parseDate(a.publishedAt)?.getTime() || 0;
      const right = parseDate(b.publishedAt)?.getTime() || 0;
      return right - left;
    });
  }

  return [...articles].sort((a, b) => (b._score || 0) - (a._score || 0));
}

export function rankSearchResults<T extends SearchableArticle>(
  articles: T[],
  { query, sortBy = "relevance", selectedCategoryId, now = new Date() }: RankOptions,
): Array<T & { _score: number }> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return sortSearchResults(
      articles.map((article) => ({ ...article, _score: 0 })),
      sortBy,
    );
  }

  const documentFrequency = getDocumentFrequency(articles, queryTokens);
  const averageLength =
    articles.reduce(
      (sum, article) => sum + tokenize(`${article.title} ${article.excerpt || ""} ${article.body || ""}`).length,
      0,
    ) / Math.max(articles.length, 1);

  const scored = articles
    .map((article) => {
      const titleTokens = tokenize(article.title);
      const excerptTokens = tokenize(article.excerpt);
      const bodyTokens = tokenize(article.body);
      const documentLength = titleTokens.length + excerptTokens.length + bodyTokens.length;
      const fieldScore = queryTokens.reduce((score, token) => {
        const df = documentFrequency.get(token) || 0;
        const idf = Math.log(1 + (articles.length - df + 0.5) / (df + 0.5));
        const titleScore = computeBm25(
          countTermFrequency(titleTokens, [token]),
          Math.max(titleTokens.length, 1),
          Math.max(averageLength / 4, 1),
          idf,
        ) * 5;
        const excerptScore = computeBm25(
          countTermFrequency(excerptTokens, [token]),
          Math.max(excerptTokens.length, 1),
          Math.max(averageLength / 3, 1),
          idf,
        ) * 3;
        const bodyScore = computeBm25(
          countTermFrequency(bodyTokens, [token]),
          Math.max(documentLength, 1),
          Math.max(averageLength, 1),
          idf,
        ) * 1.5;
        return score + titleScore + excerptScore + bodyScore;
      }, 0);

      const containsMatch = getContainsMatchScore(article, queryTokens);
      const recencyBoost = getRecencyBoost(article.publishedAt, now);
      const popularityBoost = getPopularityBoost(article.views || 0);
      const categoryBoost = selectedCategoryId && article.categoryId === selectedCategoryId ? 1.5 : 0;
      const score = fieldScore + containsMatch + recencyBoost + popularityBoost + categoryBoost;

      return {
        ...article,
        _score: Number(score.toFixed(4)),
      };
    })
    .filter((article) => article._score > 0.2);

  return sortSearchResults(scored, sortBy);
}

function levenshtein(a: string, b: string) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = 0; i <= left.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

export function findDidYouMean(query: string, candidates: string[]) {
  const normalizedQuery = normalizeText(query).trim();
  if (normalizedQuery.length < 3) return null;

  const uniqueCandidates = [...new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))];
  let best: { value: string; distance: number } | null = null;

  for (const candidate of uniqueCandidates) {
    const distance = levenshtein(normalizedQuery, candidate);
    const threshold = Math.max(2, Math.floor(candidate.length * 0.35));
    if (distance > threshold) continue;

    if (!best || distance < best.distance) {
      best = { value: candidate, distance };
    }
  }

  return best?.value || null;
}

export function matchesPrefix(value: string, query: string) {
  const normalizedValue = normalizeText(value);
  const normalizedQuery = normalizeText(query);
  return normalizedValue.startsWith(normalizedQuery) || normalizedValue.includes(normalizedQuery);
}
