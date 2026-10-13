const STATUS_TEXT = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
}

const STATUS_STYLE = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
}

export default function TaskList({ tasks }) {
  if (tasks.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">今天还没有学习任务，后续可在“学习计划”中添加。</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="font-medium text-slate-800">{task.title}</p>
            <p className="mt-1 text-sm text-slate-500">
              {task.module}
              {task.target_count ? ` · ${task.target_count} 题` : ''}
              {task.target_duration_minutes ? ` · ${task.target_duration_minutes} 分钟` : ''}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[task.status]}`}>
            {STATUS_TEXT[task.status]}
          </span>
        </li>
      ))}
    </ul>
  )
}
