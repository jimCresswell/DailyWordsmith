# Vocabulary Learning App Design Guidelines

## Design Approach
**System-Based Approach**: Using principles from Duolingo's learning-focused UI and Notion's clean information hierarchy. This is a utility-focused educational tool where clarity, readability, and distraction-free learning take priority over visual flair.

## Typography System

**Primary Font**: Inter or similar geometric sans-serif via Google Fonts
- Headings: Font weight 700, sizes ranging from text-4xl (daily word) to text-xl (section headers)
- Body text: Font weight 400, text-base to text-lg for optimal readability
- Etymology/technical text: Font weight 500, text-sm with increased letter-spacing
- Pronunciation: Italic, text-lg
- Example sentences: Font weight 400, text-base with relaxed line-height (leading-relaxed)

**Hierarchy**: Large, bold word presentation (text-5xl to text-6xl) → definitions (text-lg) → etymology details (text-base) → supporting content (text-sm)

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, and 12 consistently
- Component padding: p-6 to p-8
- Section spacing: space-y-8 to space-y-12
- Card margins: m-4 to m-6

**Container Strategy**:
- Main content: max-w-3xl mx-auto (optimal reading width for educational content)
- Single-column layout throughout for focused learning
- Generous padding: px-6 py-8 on mobile, px-8 py-12 on desktop

## Core Layout Structure

**Daily Word Card** (Primary Focus):
- Prominent card design with elevated shadow (shadow-lg)
- Word of the day: Large, centered, bold typography
- Pronunciation guide directly below in lighter weight
- Part of speech badge (pill-shaped, subtle)
- Definition in clear, readable text with ample line-height
- Visual spacing between elements using space-y-6

**Etymology Section**:
- Collapsible/expandable panel design
- Timeline-style visualization showing word origin → evolution
- Connected dots or lines showing linguistic journey
- Each origin point as a card with: language source, time period, original form, meaning shift
- Use subtle background treatment to distinguish this section

**Example Sentences** (3-5 examples):
- Card-based layout with space-y-4
- Each sentence highlighted with the vocabulary word in bold
- Context indicator (formal/informal, field of use) as small badge
- Quotation mark visual treatment

**Progress Tracking Dashboard**:
- Horizontal stats bar showing: daily streak, total words learned, current level
- Minimalist counter design with large numbers (text-4xl) and small labels (text-sm)
- Icon accompaniment using Heroicons (fire for streak, book for words, trophy for achievements)

## Component Library

**Navigation**:
- Simple top bar with logo/title, daily word indicator, profile/settings icon
- Sticky positioning for persistent access
- Height: h-16, items centered with space-between

**Cards**:
- Rounded corners (rounded-xl)
- Padding: p-6 to p-8
- Shadow: shadow-md for standard, shadow-xl for primary word card
- Border: Optional subtle border (border border-gray-200)

**Buttons**:
- Primary CTA (e.g., "Mark as Learned"): Rounded (rounded-lg), bold text, px-6 py-3
- Secondary actions: Ghost/outline style
- Icon buttons for interactions (bookmark, audio pronunciation)

**Audio Pronunciation Button**:
- Icon-only button (speaker icon from Heroicons)
- Positioned next to word
- Circular design (rounded-full) with p-3

**Progress Indicators**:
- Linear progress bar for daily goal
- Circular badge for streak counter
- Simple checkmarks for completed words

## Interaction Patterns

**Daily Word Flow**:
1. Large word card appears first
2. Scroll reveals etymology timeline
3. Example sentences follow
4. Bottom CTA section with "Next Word" (disabled until tomorrow) and "Review Past Words"

**Etymology Timeline**:
- Vertical timeline on mobile
- Optional horizontal on desktop (space permitting)
- Hover states reveal additional detail tooltips

**Past Words Archive**:
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Each word as compact card with word, short definition, date learned
- Search/filter bar at top

## Special Considerations

**Reading Optimization**:
- Maximum line length for body text (max-w-prose)
- Generous line-height (leading-relaxed to leading-loose)
- Clear visual hierarchy prevents cognitive overload

**Minimal Distractions**:
- No animations except subtle fade-ins on load
- Focus on content, not decorative elements
- Clean whitespace usage

**Accessibility**:
- Large touch targets (min h-12 w-12)
- Clear focus states on interactive elements
- Semantic HTML structure

## Images
**No hero image needed** - this is a utility app, not marketing. If visual elements are needed:
- Small illustrative icons within etymology timeline (language family symbols, historical period indicators)
- Optional: Subtle background pattern in etymology section only
- Profile/achievement badges as SVG icons via Heroicons library