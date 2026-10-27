// Fork: "How do you want to play?", shown for a world without a role. It
// stands where the upstream welcome card stood and keeps its frame classes, so
// the prayer hint waits for it the same way (ui/panels/PrayerHint.tsx).
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ft, type ForkMessageKey } from '../i18n'
import { ToolSprite } from '../../ui/toolbar/ToolSprite'
import { ROLE_ICONS, ROLES, type Role } from './role'

const CARDS: Record<
  Role,
  {
    icon: string
    name: ForkMessageKey
    promise: ForkMessageKey
    points: ForkMessageKey[]
    go: ForkMessageKey
  }
> = {
  observer: {
    icon: ROLE_ICONS.observer,
    name: 'modes.observer.name',
    promise: 'modes.observer.promise',
    points: ['modes.observer.point1', 'modes.observer.point2', 'modes.observer.point3'],
    go: 'modes.choice.goObserver',
  },
  god: {
    icon: ROLE_ICONS.god,
    name: 'modes.god.name',
    promise: 'modes.god.promise',
    points: ['modes.god.point1', 'modes.god.point2', 'modes.god.point3'],
    go: 'modes.choice.goGod',
  },
}

export function ModeChoice({ onChoose }: { onChoose: (role: Role) => void }) {
  const [picked, setPicked] = useState<Role>('observer')
  const cardRef = useRef<HTMLDivElement>(null)

  // A modal: Tab stays inside, the arrows move between the two cards. There is
  // nothing to skip to, so Escape does nothing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const card = cardRef.current
      if (!card) return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const next: Role = e.key === 'ArrowLeft' ? 'observer' : 'god'
        setPicked(next)
        card.querySelector<HTMLButtonElement>(`[data-role="${next}"]`)?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const buttons = [...card.querySelectorAll<HTMLButtonElement>('button')]
      const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
      e.preventDefault()
      const next = at < 0 ? 0 : (at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length
      buttons[next]?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="welcome-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fork-mode-choice-title"
    >
      <div className="welcome-modal fork-mode-choice" ref={cardRef}>
        <h2 id="fork-mode-choice-title" className="welcome-title">
          {ft('modes.choice.title')}
        </h2>
        <p className="fork-mode-choice-sub">{ft('modes.choice.sub')}</p>
        <div className="fork-mode-cards" role="radiogroup" aria-labelledby="fork-mode-choice-title">
          {ROLES.map((role) => {
            const card = CARDS[role]
            return (
              <button
                key={role}
                type="button"
                role="radio"
                data-role={role}
                aria-checked={picked === role}
                className={clsx('fork-mode-card', picked === role && 'picked')}
                onClick={() => setPicked(role)}
                onDoubleClick={() => onChoose(role)}
              >
                <ToolSprite icon={card.icon} size={32} />
                <span className="fork-mode-card-name">{ft(card.name)}</span>
                <span className="fork-mode-card-promise">{ft(card.promise)}</span>
                <span className="fork-mode-card-points">
                  {card.points.map((point) => (
                    <span key={point}>{ft(point)}</span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        <div className="fork-mode-choice-foot">
          <span>{ft('modes.choice.note')}</span>
          <button
            type="button"
            className="welcome-btn welcome-btn--primary"
            onClick={() => onChoose(picked)}
            autoFocus
          >
            {ft(CARDS[picked].go)}
          </button>
        </div>
      </div>
    </div>
  )
}
