/**
 * Прогноз прохождения квалификации UEFA Champions League 2026/27.
 * Источник: NK_Celje_2026_UCL_Analysis.pdf (редакция 2), таблица Executive Summary.
 *
 * Пять чисел — ровно те, что в отчёте:
 *   1-й раунд  75%
 *   2-й раунд  48%
 *   3-й раунд  18%
 *   Плей-офф   6%
 *   Группа     2%
 *
 * Числа самостоятельны и НЕ нормализуются здесь. Круговая диаграмма сама
 * поделит окружность пропорционально значениям.
 */

export type UclStageId = 'r1' | 'r2' | 'r3' | 'playoff' | 'group';

export interface UclStage {
  id: UclStageId;
  /** Вероятность, указанная в отчёте для этого этапа, %. */
  chance: number;
}

export const UCL_STAGES: readonly UclStage[] = [
  { id: 'r1',      chance: 75 },
  { id: 'r2',      chance: 48 },
  { id: 'r3',      chance: 18 },
  { id: 'playoff', chance: 6  },
  { id: 'group',   chance: 2  },
] as const;
