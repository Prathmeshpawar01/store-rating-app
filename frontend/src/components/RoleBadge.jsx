import { ROLE_LABELS } from '../utils/format';

export default function RoleBadge({ role }) {
  return <span className={`role-badge role-${role}`}>{ROLE_LABELS[role] || role}</span>;
}
