import { MiniBar } from './bars'
import type { OrganismState } from '../../../shared/types'
import { t, tn } from '../../../i18n'

export function MentalState({ org }: { org: OrganismState }) {
  return (
    <>
      {(org.loneliness !== undefined || org.comfort !== undefined) && (
        <>
          <div className="org-detail-section">{t('person.mental.title')}</div>
          <div className="trait-full-grid">
            {org.comfort !== undefined && (
              <MiniBar
                label={t('person.mental.comfort')}
                value={org.comfort}
                color="#88ddbb"
                tip={t('person.mental.comfortTip')}
              />
            )}
            {org.loneliness !== undefined && (
              <MiniBar
                label={t('person.mental.loneliness')}
                value={org.loneliness}
                color="#aa88ff"
                invert
                tip={t('person.mental.lonelinessTip')}
              />
            )}
            {org.fear_level !== undefined && (
              <MiniBar
                label={t('person.mental.fear')}
                value={org.fear_level}
                color="#ff8844"
                invert
                tip={t('person.mental.fearTip')}
              />
            )}
            {org.boredom !== undefined && (
              <MiniBar
                label={t('person.mental.boredom')}
                value={org.boredom}
                color="#ffcc44"
                invert
                tip={t('person.mental.boredomTip')}
              />
            )}
            {org.sleep_debt !== undefined && org.sleep_debt > 0.05 && (
              <MiniBar
                label={t('person.mental.fatigue')}
                value={org.sleep_debt}
                color="#8899bb"
                invert
                tip={t('person.mental.fatigueTip')}
              />
            )}
            {org.grief_ticks !== undefined && org.grief_ticks > 0 && (
              <div className="trait-full-row">
                <span className="trait-full-label">{t('person.mental.grieving')}</span>
                <span className="bar-pct" style={{ color: '#9988bb' }}>
                  {tn('person.mental.ticks', org.grief_ticks)}
                </span>
              </div>
            )}
            {org.joy_ticks !== undefined && org.joy_ticks > 0 && (
              <div className="trait-full-row">
                <span className="trait-full-label">{t('person.mental.joyful')}</span>
                <span className="bar-pct" style={{ color: '#f6c46a' }}>
                  {tn('person.mental.ticks', org.joy_ticks)}
                </span>
              </div>
            )}
            {org.hope !== undefined && (
              <MiniBar
                label={t('person.mental.hope')}
                value={org.hope}
                color="#a8e0ff"
                tip={t('person.mental.hopeTip')}
              />
            )}
            {org.awe !== undefined && org.awe > 0.05 && (
              <MiniBar
                label={t('person.mental.awe')}
                value={org.awe}
                color="#d8c8ff"
                tip={t('person.mental.aweTip')}
              />
            )}
            {org.gratitude !== undefined && org.gratitude > 0.05 && (
              <MiniBar
                label={t('person.mental.gratitude')}
                value={org.gratitude}
                color="#ffd890"
                tip={t('person.mental.gratitudeTip')}
              />
            )}
            {org.jealousy !== undefined && org.jealousy > 0.05 && (
              <MiniBar
                label={t('person.mental.jealousy')}
                value={org.jealousy}
                color="#90a050"
                invert
                tip={t('person.mental.jealousyTip')}
              />
            )}
            {org.anger !== undefined && org.anger > 0.05 && (
              <MiniBar
                label={t('person.mental.anger')}
                value={org.anger}
                color="#ff5028"
                invert
                tip={t('person.mental.angerTip')}
              />
            )}
            {org.regret !== undefined && org.regret > 0.05 && (
              <MiniBar
                label={t('person.mental.regret')}
                value={org.regret}
                color="#7080a8"
                invert
                tip={t('person.mental.regretTip')}
              />
            )}
            {org.curiosity_drive !== undefined && org.curiosity_drive > 0.05 && (
              <MiniBar
                label={t('person.mental.curiosity')}
                value={org.curiosity_drive}
                color="#80d0a8"
                tip={t('person.mental.curiosityTip')}
              />
            )}
            {org.spiritual !== undefined && org.spiritual > 0.05 && (
              <MiniBar
                label={t('person.mental.spiritual')}
                value={org.spiritual}
                color="#e0c068"
                tip={t('person.mental.spiritualTip')}
              />
            )}
          </div>
        </>
      )}
    </>
  )
}
