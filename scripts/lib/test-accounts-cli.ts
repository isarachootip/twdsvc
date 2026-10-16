/** Pure helpers for scripts/test-accounts.ts (argument parsing + DB target display). */

export type CliMode = 'dry-run' | 'apply' | 'rollback'

export interface CliArgs {
  mode: CliMode
  confirmDb?: string
  snapshotPath?: string
}

export interface DbTarget {
  host: string
  database: string
}

export function parseCliArgs(argv: string[]): CliArgs {
  let apply = false
  let snapshotPath: string | undefined
  let confirmDb: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--apply') apply = true
    else if (arg === '--rollback') snapshotPath = argv[++i]
    else if (arg === '--confirm-db') confirmDb = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }

  if (apply && snapshotPath !== undefined) throw new Error('Use either --apply or --rollback, not both.')
  const mode: CliMode = apply ? 'apply' : snapshotPath !== undefined ? 'rollback' : 'dry-run'
  return { mode, confirmDb, snapshotPath }
}

/** Host and database name only — credentials are never returned or printed. */
export function parseDbTarget(databaseUrl: string | undefined): DbTarget {
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.')
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL.')
  }
  const database = url.pathname.replace(/^\//, '')
  if (!database) throw new Error('DATABASE_URL has no database name.')
  return { host: url.host, database }
}
