import type { TFunction } from 'i18next'

export function stageLabel(
  code: string,
  name: string,
  language: string,
  t: TFunction<'queue'>,
) {
  if (!language.startsWith('ar')) return name

  switch (code) {
    case 'WAITING':
      return name === 'Waiting' ? t('stageWaiting') : name
    case 'WITH_DOCTOR':
      return name === 'With doctor' ? t('stageWithDoctor') : name
    case 'WAITING_DROPS':
      return name === 'Waiting for drops' ? t('stageWaitingDrops') : name
    case 'READY_RECHECK':
      return name === 'Ready for recheck' ? t('stageReadyRecheck') : name
    case 'EXIT':
      return name === 'Exited' ? t('stageExited') : name
    default:
      return name
  }
}
