import type { SimTable } from './types'

/** Laws a government passes: `LawKind::name()` in crates/sim-core/src/sim/civ/society/government.rs. */
export const law: SimTable = {
  no_murder: { ru: 'запрет убийства' },
  no_theft: { ru: 'запрет воровства' },
  property_rights: { ru: 'право собственности' },
  inheritance: { ru: 'право наследования' },
  marriage: { ru: 'брачное право' },
  military_service: { ru: 'воинская повинность' },
  taxation: { ru: 'налоги' },
  compulsory_education: { ru: 'обязательное образование' },
  state_religion: { ru: 'государственная религия' },
  freedom_of_worship: { ru: 'свобода вероисповедания' },
  freedom_of_speech: { ru: 'свобода слова' },
  no_slavery: { ru: 'запрет рабства' },
  equal_rights: { ru: 'равноправие' },
  safety_net: { ru: 'социальная защита' },
  universal_healthcare: { ru: 'всеобщее здравоохранение' },
  child_labour_ban: { ru: 'запрет детского труда' },
  environmental_protection: { ru: 'охрана природы' },
  digital_rights: { ru: 'цифровые права' },
  universal_suffrage: { ru: 'всеобщее избирательное право' },
}
