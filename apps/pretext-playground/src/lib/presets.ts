export type PresetId = 'latin' | 'cjk' | 'arabic' | 'emoji'

export type Preset = {
  id: PresetId
  label: string
  text: string
  /** Paint direction for Canvas; the DOM uses dir="auto". */
  rtl?: boolean
}

export const PRESETS: Preset[] = [
  {
    id: 'latin',
    label: 'Latin',
    text:
      'Typography is the craft of endowing human language with a durable visual form. Every paragraph on a page is a small negotiation between the measure, the font and the words themselves: where a line breaks decides how the text reads. Pretext predicts those breaks without asking the browser to lay anything out — no getBoundingClientRect, no reflow, just arithmetic over cached glyph widths. Supercalifragilisticexpialidocious words still wrap.',
  },
  {
    id: 'cjk',
    label: 'CJK',
    text:
      '排版引擎需要知道每一行在哪里断开。中文没有空格，所以几乎每个字之间都可以换行，但句号、逗号这样的标点不能出现在行首。Pretext 先用 canvas 测量每个片段的宽度，之后的布局只是纯粹的算术运算。日本語の文章も同じように、ひらがなとカタカナと漢字が混ざっていても、禁則処理を守って正しく折り返されます。',
  },
  {
    id: 'arabic',
    label: 'Arabic',
    rtl: true,
    text:
      'النص العربي يتدفق من اليمين إلى اليسار، وتتصل الحروف ببعضها بحسب موقعها في الكلمة. يقيس Pretext عرض كل مقطع مرة واحدة ثم يحسب فواصل الأسطر بعمليات حسابية فقط، دون أن يلمس شجرة الصفحة أو يطلب من المتصفح إعادة التخطيط. جرّب تغيير العرض لترى كيف تنتقل الكلمات بين الأسطر.',
  },
  {
    id: 'emoji',
    label: 'Emoji mix',
    text:
      'Shipping day 🚀 the team 👩‍💻👨🏽‍💻 pushed 12 fixes ✅, the build is green 🟢 and the coffee ☕ is long gone. Flags for the offsite: 🇬🇧 🇯🇵 🇫🇷 🇧🇷. Family photo: 👨‍👩‍👧‍👦 — mood: 🫠🤌🏼🎉. Mixed scripts too: 春天到了 🌸 and مرحبا 👋 in one line.',
  },
]

export const presetById = (id: PresetId): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0]
