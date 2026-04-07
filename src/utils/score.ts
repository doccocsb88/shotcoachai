export function getScoreLabel(score: number): string {
  if (score >= 8.5) return 'Strong';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Needs work';
  return 'Weak';
}

export function formatScore(score: number): string {
  return Number.isFinite(score) ? score.toFixed(1) : '0.0';
}

export function formatScoreName(name: string): string {
  return name
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
