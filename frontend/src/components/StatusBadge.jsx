export default function StatusBadge({ status }) {
  const map = {
    TODO: { label: 'To Do', cls: 'badge-todo' },
    IN_PROGRESS: { label: 'In Progress', cls: 'badge-inprogress' },
    DONE: { label: 'Done', cls: 'badge-done' },
  };
  const { label, cls } = map[status] || map.TODO;
  return <span className={`badge ${cls}`}>{label}</span>;
}
