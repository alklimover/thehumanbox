import type { OrgDetail } from '../../../shared/types'
import { t } from '../../../i18n'
import { simLabel } from '../../../i18n/sim'
import { displayName } from '../../../i18n/names'

export function LanguageSection({ detail }: { detail: OrgDetail | null }) {
  return (
    <>
      {detail?.vocabulary && Object.keys(detail.vocabulary).length > 0 && (
        <>
          <div className="org-detail-section">{t('person.language.title')}</div>
          <div className="vocab-grid">
            {Object.entries(detail.vocabulary).map(([concept, word]) => (
              <div key={concept} className="vocab-row">
                <span className="vocab-word">{displayName(word)}</span>
                <span className="vocab-concept">{simLabel('concept', concept)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
