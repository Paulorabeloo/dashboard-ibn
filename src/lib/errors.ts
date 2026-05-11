/*
 * Modelo de erro estruturado consumido pela UI.
 * Cada `kind` tem renderer dedicado (Sprint 5 — T-502/T-503).
 */

export type DashboardError =
  | { kind: 'sheets_unavailable'; lastSuccessAt?: string }
  | { kind: 'schema_mismatch'; missingColumns: string[] }
  | { kind: 'auth_required' }
  | { kind: 'forbidden_email'; emailMasked: string };

export class DashboardException extends Error {
  constructor(public override readonly cause: DashboardError) {
    super(cause.kind);
    this.name = 'DashboardException';
  }
}
