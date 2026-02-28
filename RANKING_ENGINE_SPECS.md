# 🧠 Campusly Adaptive Ranking Engine — Technical Specification

## 1. Contextual Ranking Logic (Pseudocode)

The ranking engine implements a weighted multi-factor scoring algorithm. The final score $S$ for any content item $C$ presented to user $U$ is:

$$S = \sum (W_i \times F_i) \times M_{mode}$$

Where:
- $W_i$: Predefined weight for feature $i$
- $F_i$: Calculated score for feature $i$
- $M_{mode}$: Multiplier based on active user context (Exam Mode, etc.)

### Core Factors:
1. **Relevance (0.25)**: Peer identity matching (Campus, Branch, Semester) + Interest match.
2. **Relationship (0.15)**: Interaction history, DM frequency, and mutual groups.
3. **Engagement (0.20)**: $V_{engagement} \times e^{-\lambda t}$ (Momentum).
4. **Urgency (0.15)**: Time to deadline or event proximity.
5. **Trust (0.15)**: Author XP, Verification status, and Reputation.
6. **Freshness (0.10)**: Linear decay based on age.

---

## 2. SQL Precomputation Strategy

To maintain scalability for 100k+ users, scoring is semi-precomputed:

### Materialized Views
- **`profile_interaction_matrix`**: Pre-calculates interaction pairs $(U1, U2)$ nightly for the Relationship Score.
- **`campus_engagement_velocity`**: Tracks real-time velocity of upvotes/comments per category.

### Ranking Query
```sql
SELECT p.*, 
  ((p.upvotes * 3 + p.comment_count * 5) * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600)) as momentum,
  (CASE WHEN p.author_id IN (SELECT user_id_2 FROM friendships WHERE user_id_1 = :uid) THEN 50 ELSE 0 END) as rel_score
FROM posts p
WHERE p.campus_id = :campus_id
ORDER BY (momentum + rel_score) DESC
LIMIT 100;
```

---

## 3. Caching Architecture

1. **L1 (Local)**: The browser/app scores the top 50-100 items locally based on immediate context (e.g. current scroll position, active tab).
2. **L2 (Edge Cache)**: Redis stores the "Candidate Set" for each campus/branch combination, refreshed every 5 minutes.
3. **L3 (Database)**: Cold storage for historical data.

---

## 4. Abuse Mitigation & Content Integrity

- **Velocity Limiting**: Detect rapid upvote bursts from same IP/subnet.
- **Shadow Ranking**: Posts identified as spam by the `ModerationService` receive a $0.1x$ multiplier instead of deletion, reducing reach while preventing "trial-and-error" by spammers.
- **Reputation Decay**: Trust scores decrease if content is frequently reported by verified users.

---

## 5. Cold Start Strategy

- **New User**: Default to Campus-wide Trending $+ (Semester_Match \times 2)$. Use onboarding interests as initial boost.
- **New Post**: Inherit a "Trust Credit" based on author's reputation to ensure initial visibility (Top of Feed) for 30 minutes.

---

## 6. A/B Testing & Monitoring

- **Weight Tuning**: Weights are fetched via `feature_flags` from the `Campus` table, allowing per-college tuning of the algorithm.
- **Metrics**:
    - **CTR (Click Through Rate)** on ranked feeds.
    - **Engagement Lift**: Delta in likes/comments compared to chronological sort.
    - **Session Duration**: Does the user spend more time on ranked vs. naive feed?

---

## 7. Rollout Plan

1. **Phased Release**: Internal team (Stage 1) -> 10% users (Stage 2) -> 100% (Final).
2. **Fallback**: If RankingEngine triggers a JS error or performance bottleneck, UI defaults back to `created_at DESC` sort.
