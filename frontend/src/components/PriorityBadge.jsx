export default function PriorityBadge({ priority }) {
  const map = {
    LOW: { label: 'Low', cls: 'badge-low' },
    MEDIUM: { label: 'Medium', cls: 'badge-medium' },
    HIGH: { label: 'High', cls: 'badge-high' },
  };
  const { label, cls } = map[priority] || map.MEDIUM;
  return <span className={`badge ${cls}`}>{label}</span>;
}
