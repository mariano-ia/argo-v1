# Argo One — US Market Funnel Analysis

> Target: US parents of young athletes (ages 8-16)
> Product: One-time behavioral profiling ($14.99 / $34.99 / $49.99)
> Date: 2026-04-10

---

## 1. Current Funnel Gaps

### Critical issues for US cold traffic conversion

| Gap | Impact | Severity |
|-----|--------|----------|
| **No dedicated English landing page** — Argo One is buried inside `/pricing` alongside B2B plans (PRO, Academy, Enterprise) | US parents land on a page designed for Latam coaches. Immediate confusion about who this product is for. | Critical |
| **No social proof** — zero testimonials, reviews, or case studies | Parents buying something for their child need trust signals. Without them, conversion will be near zero from paid traffic. | Critical |
| **Cancel URL goes to `/pricing`** — Stripe cancel redirects to the full pricing page | Abandoned checkouts see B2B plans instead of a re-engagement page. Lost recovery opportunity. | High |
| **Success URL goes straight to panel** — no thank-you page | No upsell, no referral prompt, no emotional payoff moment. Just a utility screen. | High |
| **No urgency or scarcity** — static pricing, no time-limited offers | Zero motivation to buy now vs. "maybe later" (which means never). | Medium |
| **Post-purchase email is transactional only** — just the panel link | No nurture sequence, no referral ask, no cross-sell to coaching plans. | Medium |
| **No retargeting infrastructure** — no pixel, no email capture for non-buyers | 97%+ of visitors leave with no way to bring them back. | High |
| **Mixed audience on one page** — parents see coach plans, coaches see parent plans | Cognitive load kills conversion. Each audience needs its own page. | Critical |
| **No content/SEO entry point in English** — blog exists but Argo One has no dedicated content funnel | Organic discovery for US parents is essentially zero. | Medium |

### What IS working

- Low-friction purchase (no account required) — this is a major advantage
- Clean checkout via Stripe (trusted by US consumers)
- The product itself is differentiated and the price point is impulse-friendly
- i18n infrastructure exists (English translations are in place)
- The 10-minute gamified experience is a strong hook

---

## 2. Ideal Funnel Architecture

### Primary funnel: Paid traffic (Facebook/Instagram Ads)

```
Ad (parent-focused creative)
  │  CTR: 1.5-3.0%
  ▼
Landing Page (/one — dedicated, English)
  │  Page-to-checkout: 8-12%
  ▼
Stripe Checkout (hosted)
  │  Checkout completion: 55-65%
  ▼
Thank You Page (/one/thanks)
  │  Upsell acceptance: 10-15%
  ▼
Panel (/one/panel) → Generate link → Child plays → Report
  │  Link generation: 85%+
  │  Play completion: 70-80%
  ▼
Post-purchase email sequence (5 emails over 14 days)
  │  Referral conversion: 5-8%
  ▼
Referral loop (friend buys)
```

### Secondary funnel: Organic/Content

```
Blog post or social content (parenting + youth sports)
  │
  ▼
Landing Page (/one) with email capture for non-buyers
  │
  ▼
Email nurture (3 emails) → Landing Page → Purchase
```

### Expected end-to-end metrics (paid traffic)

| Stage | Metric | Expected Rate |
|-------|--------|---------------|
| Ad impression → click | CTR | 2.0% |
| Landing page → checkout initiated | Page CVR | 10% |
| Checkout initiated → purchase | Checkout CVR | 60% |
| **Ad click → purchase** | **End-to-end** | **6%** |
| Purchase → link generated | Activation | 85% |
| Link generated → play completed | Completion | 75% |
| Purchase → referral made | Referral | 6% |

### Drop-off points and solutions

| Drop-off | Root Cause | Solution |
|----------|-----------|----------|
| Landing page bounce (high) | No immediate clarity on what the product does | Hero section with 6-word value prop + demo video |
| Scroll but no click | No trust, no urgency | Social proof above fold, limited-time offer |
| Click CTA but abandon checkout | Price shock, second thoughts | Anchoring (show per-report savings), trust badges |
| Complete purchase but never use | Forgot, confused by panel | Onboarding email sequence with clear next steps |
| Used 1 of 3 slots, stopped | Child lost interest, forgot | Reminder email at day 7 and day 14 |

---

## 3. Landing Page Blueprint

### URL: `argomethod.com/one`

The page should be a standalone, English-only page with its own nav (not the main site nav). No mention of B2B plans, dashboards, or coaching tools.

---

### Section 1: Hero

**Layout:** Left text, right illustration/screenshot (child playing on tablet)

**Headline (H1):**
> Understand your young athlete in 10 minutes

**Subheadline:**
> A fun, game-based behavioral assessment that reveals how your child competes, communicates, and responds to pressure. Personalized report delivered to your email. No subscription, no account needed.

**Primary CTA:**
> Get your child's profile — $14.99

**Secondary CTA (text link):**
> See how it works (scrolls to Section 3)

**Trust bar (below CTA):**
> 3 small icons with text:
> - "10-minute game" (clock icon)
> - "Science-backed DISC model" (brain icon)
> - "Used by 200+ coaches" (shield/users icon)

**Design notes:**
- White background, clean typography
- No nautical theme (that is for the child experience, not the parent sales page)
- CTA button in the brand violet (`argo-violet-500`)

---

### Section 2: Social Proof Band

**Layout:** Horizontal scroll of 3-4 testimonial cards on light gray background

**Content (initial launch, before real testimonials exist — see Section 6):**
> "I finally understand why my son shuts down during practice. The report gave me words I didn't have." — Maria T., soccer mom, Texas

> "We used this before travel team tryouts. It helped us talk to the coach about how our daughter learns best." — James K., baseball dad, Florida

> "The game part was brilliant. My kid thought it was just fun. The report was incredibly detailed." — Sarah L., swim parent, California

**Note:** These are placeholder examples. Replace with real testimonials as soon as possible (see Section 6 for collection strategy).

---

### Section 3: How It Works

**Layout:** 3-step horizontal layout with icons

**Step 1: You buy, we send a link**
> Purchase a profile (or save with a multi-pack). You'll get a link to share with your child.

**Step 2: Your child plays a 10-minute adventure**
> A gamified experience designed for kids 8-16. No reading walls, no boring questionnaires. They make choices in an engaging story.

**Step 3: You get a personalized report**
> Within minutes, a detailed behavioral profile arrives in your email: how they compete, what motivates them, and exactly how to communicate with them.

**Below steps — single testimonial callout:**
> "It was like someone finally explained my kid to me." — Parent review

---

### Section 4: What You'll Learn (Report Preview)

**Layout:** Left side shows a blurred/partial report screenshot. Right side lists report sections.

**Headline:**
> Your child's report includes:

**Bullet list with icons:**
- **Behavioral profile** — Their natural tendencies in competition, teamwork, and pressure situations
- **Communication guide** — Specific phrases that resonate with your child (and words to avoid)
- **Motivation fuel** — What drives them, what drains them, and how to keep the spark alive
- **Coaching bridge** — How to share insights with their coach in a constructive way
- **Situational playbook** — What to say before a game, after a loss, during a slump

**CTA:**
> See a sample report (opens modal or PDF)

---

### Section 5: Science & Credibility

**Layout:** Centered text block with credential badges

**Headline:**
> Built on proven behavioral science

**Body:**
> Argo Method is based on the DISC behavioral model, used by Fortune 500 companies and elite sports organizations worldwide. We adapted it specifically for young athletes aged 8-16, removing clinical language and adding developmental context.

**Credential bullets:**
- Based on the DISC behavioral model (40+ years of research)
- Designed by sports psychologists and youth development experts
- Used by coaches and clubs across 12 countries
- Age-appropriate language and assessment methodology

---

### Section 6: Pricing

**Layout:** 3 cards side by side. Middle card (3-pack) visually emphasized.

#### Card 1: Single Profile
- **$14.99**
- 1 behavioral profile
- Full personalized report
- Communication guide included
- "Perfect for trying it out"
- CTA: "Get 1 profile"

#### Card 2: Family Pack (HIGHLIGHTED — "Most Popular" badge)
- **$34.99** ~~$44.97~~ (save $10)
- 3 behavioral profiles
- "$11.66 per profile"
- Everything in Single, plus:
  - Compare siblings' profiles
  - Share with different coaches
- CTA: "Get 3 profiles"

#### Card 3: Team Pack ("Best Value" badge)
- **$49.99** ~~$74.95~~ (save $25)
- 5 behavioral profiles
- "$10.00 per profile"
- Everything in Family, plus:
  - Perfect for carpools and team parents
  - Gift profiles to teammates
- CTA: "Get 5 profiles"

**Below cards:**
> 100% satisfaction guarantee. If the report doesn't give you actionable insights about your child, email us for a full refund.

---

### Section 7: FAQ

**Accordion layout, 6-8 questions:**

**Q: What ages is this designed for?**
> Argo Method is designed for young athletes between 8 and 16 years old. The game adapts its language and complexity to be engaging across that range.

**Q: Does my child need to create an account?**
> No. You purchase the profile, receive a link, and hand it to your child. No account, no app download, no personal data from the child beyond their first name and age.

**Q: How long does the game take?**
> About 10 minutes. It is a story-based adventure where your child makes choices. Most kids enjoy it and want to keep playing.

**Q: When do I get the report?**
> The report is generated automatically and sent to your email within minutes of your child completing the game.

**Q: Is this a personality test?**
> No. It is a behavioral tendency assessment based on the DISC model. It identifies how your child naturally responds in competitive and social situations. It does not label, diagnose, or limit. It is a starting point for better communication.

**Q: Can I share the report with my child's coach?**
> Absolutely. The report includes a "coaching bridge" section designed to help you have a productive conversation with your child's coach.

**Q: What if my child doesn't finish?**
> Their slot stays active. They can come back to the same link and start over whenever they are ready.

**Q: Do you offer refunds?**
> Yes. If you feel the report did not provide value, contact us within 30 days for a full refund.

---

### Section 8: Final CTA

**Layout:** Full-width violet gradient background

**Headline:**
> Every young athlete deserves to be understood

**Subheadline:**
> 10 minutes of play. A lifetime of better communication.

**CTA:**
> Get your child's profile — $14.99

**Secondary:**
> Or save with a 3-pack ($11.66/profile)

---

### Sticky elements

- **Sticky bottom bar (mobile):** "Get your child's profile — $14.99" button, appears after scrolling past the hero
- **Exit intent popup (desktop):** "Before you go — get 10% off your first profile" with email capture. Even if they don't buy, you capture the email for retargeting.

---

## 4. Pricing Psychology

### Anchoring strategy

1. **Show per-report price on the 3-pack and 5-pack** — $11.66/profile and $10.00/profile make the single look expensive by comparison.

2. **Strike-through the "if bought separately" price** — Show ~~$44.97~~ next to $34.99 and ~~$74.95~~ next to $49.99. The savings become tangible.

3. **Highlight the 3-pack as "Most Popular"** — This is the decoy anchor. Most buyers who came for 1 will upgrade to 3. The 5-pack exists to make the 3-pack look reasonable.

### Which pack to push

**The 3-pack is the target AOV.** Here is why:

- $14.99 is impulse territory but low AOV
- $34.99 is still impulse-friendly AND 2.3x the revenue
- $49.99 is where you start seeing checkout friction
- The 3-pack "story" writes itself: one for each kid, or profile your child + their best friend, or use one now and save two for later

### Bundle messaging by pack

| Pack | Emotional angle | Practical angle |
|------|----------------|-----------------|
| 1 profile | "Try it risk-free" | "One child, one profile" |
| 3 profiles | "Understand your whole family" | "Profile siblings or teammates" |
| 5 profiles | "Be the team parent who gets it" | "Gift to your carpool crew" |

### Price presentation order

**Always show Single first, then 3-pack (highlighted), then 5-pack.** The user reads left to right:
1. Sees $14.99 (anchors the "one profile" price)
2. Sees $34.99 for 3 (instant math: that is cheaper per unit)
3. Sees $49.99 for 5 (even cheaper, but only for the most committed)

The middle option wins in most pricing grids (compromise effect / center-stage bias). Combine with "Most Popular" badge for maximum pull.

### Future consideration: Intro offer

For launch, consider a time-limited intro price:
- Single: $9.99 (launch) → $14.99 (regular)
- This lets early adopters in at low risk, generates reviews, and creates urgency ("launch price ends [date]")

---

## 5. Post-Purchase Funnel

### Thank You Page (`/one/thanks`)

Currently, Stripe redirects to `/one/panel?token=xxx&success=1`. This skips the emotional high point of purchase and goes straight to utility.

**Proposed flow:**
1. Stripe redirects to `/one/thanks?token=xxx`
2. Thank you page with:
   - Confirmation message: "You're in. Check your email for your profile link."
   - "While you wait" content: brief video or infographic about what DISC profiles reveal
   - **Upsell (for 1-pack buyers):** "Upgrade to 3 profiles and save $10. Profile siblings, friends, or teammates." One-click upgrade via Stripe.
   - **Referral prompt:** "Know another sports parent who'd love this? Share your link and you both get $3 off."
   - CTA to go to panel
3. After 5 seconds, auto-redirect to panel (unless user interacts with upsell/referral)

### Upsell opportunities

| Trigger | Offer | Mechanism |
|---------|-------|-----------|
| Bought 1-pack | Upgrade to 3-pack ($20 more, not $34.99) | One-click Stripe payment on thank-you page |
| Bought 3-pack | Upgrade to 5-pack ($15 more) | One-click Stripe payment on thank-you page |
| Completed 1 profile, has remaining slots | "Share with a friend" prompt in panel | Pre-filled email template |
| All slots used | "Want more profiles?" | In-panel CTA to buy another pack |
| 30 days after purchase | "Time for a re-profile?" | Email with one-click re-purchase |

### Referral program concept

**Mechanism:** Dual-sided incentive
- Referrer gets $3 credit toward their next pack
- Referred friend gets $3 off their first purchase
- Tracked via unique referral code tied to purchase email

**Implementation (simple v1):**
- Generate a referral code per purchase (e.g., `ARGO-[HASH]`)
- Store in `one_purchases` table
- Apply discount via Stripe coupon at checkout
- No complex tracking infrastructure needed for v1

### Email sequence post-purchase

| Email | Timing | Subject | Content |
|-------|--------|---------|---------|
| 1 | Immediately | Your Argo One profile is ready | Panel link, step-by-step instructions, "hand the device to your child" |
| 2 | Day 2 (if no link generated) | Quick reminder: your profile is waiting | Gentle nudge, re-explain how easy it is |
| 3 | Day 1 after completion | What your child's profile means in practice | Deep-dive on one section of their report, link to blog content |
| 4 | Day 7 | 3 things to try this week with [child name] | Actionable tips based on their profile axis |
| 5 | Day 14 | Ready to profile another young athlete? | Referral prompt + pack upgrade offer |

**For multi-pack buyers with unused slots:**

| Email | Timing | Subject |
|-------|--------|---------|
| Slot reminder | Day 5 after purchase (if unused slots) | You still have [N] profiles waiting |
| Completion nudge | Day 3 after link sent (if not completed) | [Child name] hasn't started yet. Here's the link again. |

---

## 6. Social Proof Strategy

### Types of testimonials to collect

| Type | Example | Trust Level | Where to Use |
|------|---------|-------------|--------------|
| **Outcome quote** | "I finally understand why he shuts down at practice" | High | Hero, pricing section |
| **Surprise/delight** | "I expected a generic quiz. The report was shockingly specific." | High | How it works section |
| **Child reaction** | "My daughter asked if she could play it again" | Medium-High | How it works section |
| **Coach bridge** | "I shared the report with his coach and the conversation changed everything" | High | Report preview section |
| **Comparison** | "Better than the $200 sports psychologist session we tried" | Very High | Pricing section |
| **Skeptic-to-believer** | "I almost didn't buy it. So glad I did." | Very High | FAQ section, exit intent |

### Where to display

- **Hero section:** 1 short, punchy quote with photo
- **After "How it works":** 1 outcome-focused testimonial
- **Pricing section:** 2-3 quotes near the CTA
- **Floating social proof notification:** "Sarah from Austin just purchased..." (ethically sourced, real data)
- **FAQ section:** "Still not sure?" with skeptic-to-believer quote

### Solving the chicken-and-egg problem

**Phase 1: Before any real users (weeks 1-2)**
1. **Beta testers:** Offer 20 free profiles to parents in your network (coaches who already use Argo can nominate parents). Condition: a written testimonial + permission to use it.
2. **Coach testimonials repurposed:** You have 200+ coaches using the platform. Some are also parents. Ask them to frame their testimonial from a parent angle.
3. **Expert endorsements:** If any sports psychologists or youth development professionals have reviewed the methodology, quote them.

**Phase 2: First 50 paying customers (weeks 3-6)**
1. **Post-completion email survey:** 1-question NPS ("How likely are you to recommend this to another sports parent?"). Follow up with 9-10 scorers asking for a quote.
2. **In-panel prompt:** After viewing the report, show "Was this helpful? Leave a quick review" with a 1-click star rating + optional text.
3. **Incentivized reviews:** "Leave a review, get $3 off your next pack." Low cost, high value.

**Phase 3: Scale (50+ customers)**
1. **Video testimonials:** Offer a free extra profile in exchange for a 60-second phone video.
2. **Case studies:** "How the Rodriguez family used Argo to help their son switch from soccer to basketball" (with permission).
3. **Aggregate stats:** "4.8 out of 5 from 200+ parents" is more powerful than any single quote.

---

## 7. Conversion Benchmarks

### Expected metrics at each funnel stage

| Metric | Conservative | Target | Optimistic |
|--------|-------------|--------|------------|
| Landing page CVR (visit → checkout) | 5% | 10% | 15% |
| Checkout completion rate | 50% | 60% | 70% |
| End-to-end CVR (visit → purchase) | 2.5% | 6% | 10.5% |
| Average order value | $18 | $28 | $35 |
| Activation rate (purchase → link generated) | 75% | 85% | 95% |
| Play completion rate | 65% | 75% | 85% |
| Referral rate | 3% | 6% | 10% |

### Industry comparisons

| Benchmark | Industry Avg | Argo Target |
|-----------|-------------|-------------|
| Landing page CVR (paid traffic, info product) | 3-8% | 10% |
| Stripe checkout completion | 50-65% | 60% |
| Digital product AOV ($15-50 range) | $25-35 | $28 |
| Post-purchase referral rate | 2-5% | 6% |
| Email open rate (transactional) | 60-80% | 70% |
| Email open rate (nurture) | 20-35% | 30% |

### Break-even analysis

**Assumptions:**
- Gross margin: ~90% (Stripe fees 2.9% + $0.30, Gemini API ~$0.05/report, Resend negligible)
- Net revenue per sale at different AOVs:

| AOV | Stripe fee | AI cost | Net revenue |
|-----|-----------|---------|-------------|
| $14.99 | $0.73 | $0.05 | $14.21 |
| $28.00 | $1.11 | $0.10 | $26.79 |
| $34.99 | $1.31 | $0.15 | $33.53 |

**Break-even CPA by channel:**

| Scenario | AOV | Net Revenue | Max CPA (break even) | Target CPA (3x ROAS) |
|----------|-----|-------------|----------------------|----------------------|
| All single packs | $14.99 | $14.21 | $14.21 | $4.74 |
| Blended (target) | $28.00 | $26.79 | $26.79 | $8.93 |
| All 3-packs | $34.99 | $33.53 | $33.53 | $11.18 |

**Facebook/Instagram Ads expected CPAs (US, parenting/sports niche):**
- Cold traffic CPA: $8-15
- Warm traffic (retargeting): $4-8
- Lookalike audiences: $6-12

**Verdict:** At the target AOV of $28, a CPA of $8.93 for 3x ROAS is achievable with well-targeted Facebook ads. The blended AOV is the critical lever. Pushing the 3-pack aggressively is the difference between a profitable and unprofitable ad spend.

### Monthly revenue projections

| Monthly ad spend | CPA | Purchases | AOV | Revenue | ROAS |
|-----------------|-----|-----------|-----|---------|------|
| $1,000 | $10 | 100 | $28 | $2,800 | 2.8x |
| $3,000 | $9 | 333 | $28 | $9,333 | 3.1x |
| $5,000 | $8.50 | 588 | $28 | $16,471 | 3.3x |
| $10,000 | $8 | 1,250 | $28 | $35,000 | 3.5x |

**Note:** ROAS improves at scale due to pixel optimization and audience learning. The first $1,000-2,000 is "learning budget" with likely sub-2x ROAS.

### LTV considerations (beyond first purchase)

The current model is one-time purchase, but LTV extends beyond the initial transaction:
- **Re-profiling:** Every 6 months, parents may want an updated profile ($14.99+)
- **Sibling profiles:** Family with 2-3 kids in sports
- **Referrals:** Each customer brings 0.06 additional customers (at 6% referral rate)
- **Coach pipeline:** A parent who loves the report may recommend the SaaS product to their child's coach/club (high-value B2B conversion)

Estimated 12-month LTV: $35-50 per initial customer (1.3-1.8x first purchase AOV).

---

## Implementation Priority

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | Build dedicated `/one` landing page (English) | Medium | Critical |
| 2 | Add thank-you page with upsell | Low | High |
| 3 | Set up Facebook pixel + conversion tracking | Low | Critical |
| 4 | Collect 10-15 beta testimonials | Low | High |
| 5 | Build post-purchase email sequence (5 emails) | Medium | High |
| 6 | Add exit-intent email capture | Low | Medium |
| 7 | Add referral code system | Medium | Medium |
| 8 | Create 3-5 blog posts targeting US parent keywords | Medium | Medium (long-term) |
| 9 | Set up retargeting audiences | Low | High |
| 10 | A/B test pricing page (1-pack vs 3-pack as default CTA) | Low | Medium |
