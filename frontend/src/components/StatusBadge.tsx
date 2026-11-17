import type { LibroStatus } from '../types';
import { statusLabel } from '../utils/format';

export function StatusBadge({ status }: { status: LibroStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{statusLabel(status)}</span>;
}
