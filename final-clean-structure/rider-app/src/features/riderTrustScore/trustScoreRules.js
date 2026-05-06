export function getRiderTrustStatus(score=100){if(score>=85)return 'Excellent';if(score>=70)return 'Good';if(score>=50)return 'Risk';return 'Critical'}
