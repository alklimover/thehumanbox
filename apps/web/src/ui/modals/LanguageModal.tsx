import { useMemo, useState } from 'react'
import type { OrganismState } from '../../shared/types'
import { lineageColor } from '../../shared/constants'
import { useFrozenSnapshot } from '../../shared/hooks/useFrozenSnapshot'
import { Modal } from './Modal'
import { t, tn } from '../../i18n'
import { simLabel } from '../../i18n/sim'
import { displayName } from '../../i18n/names'

const CONCEPT_SECTIONS: { label: string; concepts: string[] }[] = [
  {
    label: t('lang.section.coreSurvival'),
    concepts: [
      'food',
      'water',
      'fire',
      'danger',
      'friend',
      'foe',
      'shelter',
      'hunt',
      'night',
      'day',
      'sick',
      'home',
      'group',
      'alone',
    ],
  },
  {
    label: t('lang.section.skyWeather'),
    concepts: ['sun', 'moon', 'star', 'sky', 'rain', 'storm', 'wind', 'snow', 'ice', 'cloud'],
  },
  {
    label: t('lang.section.landWater'),
    concepts: [
      'river',
      'lake',
      'sea',
      'mountain',
      'forest',
      'tree',
      'grass',
      'stone',
      'sand',
      'earth',
      'cave',
      'path',
      'world',
    ],
  },
  {
    label: t('lang.section.bodyStates'),
    concepts: [
      'hunger',
      'thirst',
      'pain',
      'tired',
      'strong',
      'weak',
      'hurt',
      'heal',
      'rest',
      'sleep',
      'breath',
      'blood',
      'old',
      'young',
      'born',
      'death',
      'life',
    ],
  },
  {
    label: t('lang.section.emotions'),
    concepts: [
      'fear',
      'joy',
      'anger',
      'sad',
      'love',
      'hate',
      'calm',
      'brave',
      'lonely',
      'hope',
      'trust',
      'grief',
      'pride',
      'shame',
      'curious',
    ],
  },
  {
    label: t('lang.section.kinRoles'),
    concepts: ['kin', 'child', 'mother', 'father', 'elder', 'mate', 'stranger', 'leader', 'tribe', 'ally'],
  },
  {
    label: t('lang.section.socialActs'),
    concepts: [
      'gift',
      'share',
      'help',
      'teach',
      'learn',
      'story',
      'song',
      'dance',
      'play',
      'talk',
      'listen',
      'greet',
      'fight',
      'war',
      'peace',
      'trade',
    ],
  },
  {
    label: t('lang.section.motion'),
    concepts: [
      'go',
      'come',
      'stay',
      'run',
      'climb',
      'swim',
      'dig',
      'build',
      'break',
      'carry',
      'give',
      'find',
      'see',
      'hear',
      'hide',
      'watch',
      'follow',
      'lead',
      'gather',
      'plant',
      'make',
    ],
  },
  {
    label: t('lang.section.qualities'),
    concepts: [
      'cold',
      'warm',
      'dark',
      'light',
      'big',
      'small',
      'near',
      'far',
      'many',
      'good',
      'bad',
      'new',
      'here',
      'there',
    ],
  },
  {
    label: t('lang.section.tools'),
    concepts: [
      'meat',
      'berry',
      'root',
      'wood',
      'tool',
      'trap',
      'spear',
      'basket',
      'medicine',
      'farm',
      'nest',
      'name',
      'time',
      'season',
    ],
  },
  {
    label: t('lang.section.bodySenses'),
    concepts: ['eye', 'ear', 'hand', 'foot', 'mouth', 'skin', 'heart', 'voice', 'scent', 'bone'],
  },
  {
    label: t('lang.section.family'),
    concepts: [
      'birth',
      'wedding',
      'funeral',
      'ancestor',
      'twin',
      'orphan',
      'widow',
      'sibling',
      'blood-kin',
      'lineage',
    ],
  },
  {
    label: t('lang.section.animals'),
    concepts: [
      'wolf',
      'bird',
      'deer',
      'bear',
      'snake',
      'insect',
      'beast',
      'prey',
      'predator',
      'flock',
      'pack',
      'swarm',
    ],
  },
  {
    label: t('lang.section.terrain'),
    concepts: [
      'cliff',
      'ridge',
      'plain',
      'marsh',
      'swamp',
      'oasis',
      'dune',
      'glacier',
      'shore',
      'island',
      'crater',
      'gorge',
      'meadow',
      'grove',
      'thicket',
      'clearing',
      'valley',
      'hill',
      'spring',
    ],
  },
  {
    label: t('lang.section.skyEvents'),
    concepts: [
      'dawn',
      'dusk',
      'twilight',
      'fog',
      'frost',
      'hail',
      'thunder',
      'lightning',
      'rainbow',
      'drought',
      'flood',
      'heat',
      'eclipse',
    ],
  },
  {
    label: t('lang.section.materials'),
    concepts: [
      'clay',
      'mud',
      'hide',
      'fur',
      'feather',
      'shell',
      'salt',
      'charcoal',
      'ore',
      'metal',
      'gem',
      'flint',
      'thread',
    ],
  },
  {
    label: t('lang.section.abstract'),
    concepts: [
      'truth',
      'lie',
      'secret',
      'promise',
      'oath',
      'law',
      'custom',
      'tradition',
      'memory',
      'dream',
      'idea',
      'plan',
      'choice',
      'fate',
      'luck',
      'omen',
      'sign',
      'mystery',
      'wisdom',
      'honor',
      'duty',
      'freedom',
      'power',
      'change',
      'beginning',
      'ending',
      'journey',
      'return',
      'loss',
      'gain',
      'debt',
      'balance',
    ],
  },
  {
    label: t('lang.section.moreActs'),
    concepts: [
      'bless',
      'curse',
      'forgive',
      'betray',
      'protect',
      'abandon',
      'rescue',
      'sacrifice',
      'scatter',
      'destroy',
      'create',
      'mend',
      'sharpen',
      'carve',
      'weave',
      'guard',
      'chase',
      'flee',
      'attack',
      'defend',
    ],
  },
  {
    label: t('lang.section.quantity'),
    concepts: [
      'one',
      'two',
      'three',
      'half',
      'whole',
      'none',
      'all',
      'more',
      'less',
      'enough',
      'empty',
      'full',
    ],
  },
  {
    label: t('lang.section.colours'),
    concepts: ['red', 'blue', 'green', 'yellow', 'white', 'black', 'brown', 'grey'],
  },
  {
    label: t('lang.section.plants'),
    concepts: [
      'flower',
      'leaf',
      'seed',
      'vine',
      'moss',
      'fern',
      'reed',
      'bark',
      'branch',
      'thorn',
      'fruit',
      'nut',
      'herb',
      'sprout',
      'blossom',
    ],
  },
  {
    label: t('lang.section.finerTime'),
    concepts: [
      'morning',
      'noon',
      'evening',
      'midnight',
      'year',
      'moment',
      'forever',
      'soon',
      'early',
      'late',
    ],
  },
  {
    label: t('lang.section.directions'),
    concepts: [
      'north',
      'south',
      'east',
      'west',
      'up',
      'down',
      'forward',
      'back',
      'between',
      'above',
      'below',
      'inside',
      'outside',
      'around',
    ],
  },
  {
    label: t('lang.section.sounds'),
    concepts: [
      'cry',
      'shout',
      'whisper',
      'laugh',
      'roar',
      'howl',
      'call',
      'echo',
      'silence',
      'noise',
      'growl',
      'hum',
    ],
  },
  {
    label: t('lang.section.finerFeelings'),
    concepts: [
      'worry',
      'relief',
      'longing',
      'envy',
      'gratitude',
      'regret',
      'awe',
      'disgust',
      'surprise',
      'sorrow',
      'delight',
      'dread',
      'yearning',
      'serenity',
    ],
  },
  {
    label: t('lang.section.socialStructures'),
    concepts: [
      'council',
      'clan',
      'family',
      'band',
      'gathering',
      'market',
      'border',
      'neighbor',
      'kinship',
      'guest',
    ],
  },
  {
    label: t('lang.section.bodyActions'),
    concepts: [
      'jump',
      'crawl',
      'crouch',
      'reach',
      'grab',
      'throw',
      'push',
      'pull',
      'kick',
      'bite',
      'sniff',
      'blink',
      'nod',
      'point',
      'wave',
      'kneel',
    ],
  },
  {
    label: t('lang.section.meaning'),
    concepts: [
      'question',
      'answer',
      'word',
      'language',
      'speech',
      'skill',
      'craft',
      'work',
      'effort',
      'ease',
      'meaning',
      'purpose',
      'reason',
      'cause',
    ],
  },
  {
    label: t('lang.section.physical'),
    concepts: [
      'heavy',
      'hard',
      'soft',
      'sharp',
      'dull',
      'smooth',
      'rough',
      'wet',
      'dry',
      'hot',
      'fast',
      'slow',
      'loud',
      'quiet',
      'bright',
      'deep',
      'shallow',
      'high',
      'low',
      'wide',
    ],
  },
]

const ALL_CONCEPTS = CONCEPT_SECTIONS.flatMap((s) => s.concepts)

interface Props {
  organisms: OrganismState[]
  lineageWords?: Record<string, Record<string, string>>
  sexWords?: [string, string]
  onClose: () => void
  lineageNames?: Record<string, string>
}

interface LineageVocab {
  lineageId: string
  words: Record<string, string>
  count: number
}

function buildLineageVocabs(
  organisms: OrganismState[],
  lineageWords?: Record<string, Record<string, string>>,
): LineageVocab[] {
  const byLineage: Record<string, OrganismState[]> = {}
  for (const org of organisms) {
    if (!byLineage[org.lineage_id]) byLineage[org.lineage_id] = []
    byLineage[org.lineage_id].push(org)
  }

  return Object.entries(byLineage)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([lid, orgs]) => {
      const words =
        lineageWords?.[lid] ??
        (() => {
          const legacyWords: Record<string, string> = {}
          for (const concept of ALL_CONCEPTS) {
            const counts: Record<string, number> = {}
            for (const org of orgs) {
              const w = org.vocabulary?.[concept]
              if (w) counts[w] = (counts[w] ?? 0) + 1
            }
            const entries = Object.entries(counts)
            if (entries.length) {
              legacyWords[concept] = entries.sort((a, b) => b[1] - a[1])[0][0]
            }
          }
          return legacyWords
        })()
      return { lineageId: lid, words, count: orgs.length }
    })
}

export function LanguageModal({ organisms, lineageWords, sexWords, onClose, lineageNames }: Props) {
  const { frozen, reload } = useFrozenSnapshot(() => ({ organisms, lineageWords }))
  const lineages = buildLineageVocabs(frozen.organisms, frozen.lineageWords)
  const tribeName = (lid: string) => displayName(lineageNames?.[lid]) || (lid ?? '').slice(0, 6)

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filteredSections = useMemo(() => {
    if (!q) return CONCEPT_SECTIONS
    return CONCEPT_SECTIONS.map((s) => ({
      label: s.label,
      concepts: s.concepts.filter((c) => {
        // The concept matches by its id (English) or by its name in the player's language.
        if (c.toLowerCase().includes(q) || simLabel('concept', c).toLowerCase().includes(q)) return true
        return lineages.some((l) => l.words[c]?.toLowerCase().includes(q))
      }),
    })).filter((s) => s.concepts.length > 0)
  }, [q, lineages])

  const totalMatches = filteredSections.reduce((n, s) => n + s.concepts.length, 0)

  return (
    <Modal open onClose={onClose} className="lang-modal" title={t('lang.title')} hideTitle>
      <div className="lang-modal-header">
        <span className="lang-modal-title">{t('lang.heading')}</span>
        <div className="modal-header-actions">
          <button className="reload-btn" onClick={reload} title={t('modals.reload')}>
            ⟳
          </button>
          <button aria-label={t('common.close')} className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      <div className="lang-modal-body">
        <p className="lang-modal-sub">{t('lang.sub')}</p>

        {sexWords && (
          <div className="lang-sex-words">
            <span className="lang-sex-label">{t('lang.sexWords')}</span>
            <span className="lang-sex-word lang-sex-word-0">{displayName(sexWords[0])}</span>
            <span className="lang-sex-divider">·</span>
            <span className="lang-sex-word lang-sex-word-1">{displayName(sexWords[1])}</span>
            <span className="lang-sex-note">{t('lang.sexNote')}</span>
          </div>
        )}

        <div className="lang-search-row">
          <input
            className="lang-search"
            type="text"
            placeholder={t('lang.search', { n: ALL_CONCEPTS.length })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {q && (
            <span className="lang-search-count">
              {tn('lang.matches', totalMatches)}
              <button className="lang-search-clear" onClick={() => setQuery('')}>
                ✕
              </button>
            </span>
          )}
        </div>

        <div className="lang-table-wrap">
          {filteredSections.map((section) => (
            <div key={section.label} className="lang-section">
              <div className="lang-section-header">{section.label}</div>
              <div
                className="lang-table"
                style={{ gridTemplateColumns: `120px repeat(${lineages.length}, 1fr)` }}
              >
                <div className="lang-th lang-concept-col">{t('lang.concept')}</div>
                {lineages.map((l) => (
                  <div key={l.lineageId} className="lang-th lang-lineage-col">
                    <span className="lang-lineage-dot" style={{ background: lineageColor(l.lineageId) }} />
                    {tribeName(l.lineageId)}
                    <span className="lang-lineage-count">×{l.count}</span>
                  </div>
                ))}

                {section.concepts.map((concept) => (
                  <div key={concept} className="lang-row-wrapper" style={{ display: 'contents' }}>
                    <div className="lang-td lang-concept-col lang-english">
                      {simLabel('concept', concept)}
                    </div>
                    {lineages.map((l) => {
                      const word = l.words[concept]
                      const isMatch = q && word?.toLowerCase().includes(q)
                      return (
                        <div
                          key={`${l.lineageId}-${concept}`}
                          className={`lang-td lang-lineage-col lang-word ${isMatch ? 'lang-word-match' : ''}`}
                        >
                          {word ? displayName(word) : <span className="lang-unknown">-</span>}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredSections.length === 0 && <div className="lang-empty">{t('lang.noMatch', { query })}</div>}
        </div>
      </div>
    </Modal>
  )
}
