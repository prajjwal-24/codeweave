export function extractKeywords(text) {
  if (!text) return [];
  
  // Simple keyword extraction
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have',
    'are', 'was', 'were', 'been', 'has', 'had', 'will', 'would',
    'could', 'should', 'can', 'may', 'might', 'must', 'shall'
  ]);
  
  const filtered = words.filter(w => !stopWords.has(w));
  
  // Get unique keywords, limit to 20
  return [...new Set(filtered)].slice(0, 20);
}

export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function truncateText(text, maxLength = 1000) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
