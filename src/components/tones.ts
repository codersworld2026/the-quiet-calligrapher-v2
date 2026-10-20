// The two section colours. Green sections use cream text and the lighter golds; cream sections use ink and the deeper golds.
export type Tone = 'green' | 'cream';

export const tones = {
  green: {
    section: 'bg-forest-900 text-cream-50',
    body: 'text-cream-100/85',
    strong: 'text-cream-50',
    label: 'text-gold-300',
    rule: 'bg-gold-400',
    button:
      'border-gold-400 text-gold-200 hover:bg-gold-400 hover:text-forest-950 focus-visible:outline-gold-300'
  },
  cream: {
    section: 'bg-cream-100 text-ink',
    body: 'text-ink/80',
    strong: 'text-ink',
    label: 'text-gold-700',
    rule: 'bg-gold-500',
    button:
      'border-gold-500 text-gold-700 hover:border-gold-700 hover:bg-gold-700 hover:text-cream-50 focus-visible:outline-gold-500'
  }
} satisfies Record<Tone, Record<string, string>>;
