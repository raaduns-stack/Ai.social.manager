import React, { useState, useEffect } from 'react'
import {
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  CreditCard,
  Activity,
  UserCheck,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  getDesignerDashboardSummary,
  getDesignerTasks,
  getDesignerSubmissions,
  getDesignerPayments,
  getDesignerActivities,
  getDesigners,
  getDesignerProfile
} from '../../features/admin/designer-api'

function StatCard({ title, value, icon: Icon, isLoading, error }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">{title}</span>
        <Icon className="text-tertiary-container w-5 h-5 shrink-0" />
      </div>
      <div className="flex items-end gap-2 mt-2">
        <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
          {isLoading ? '...' : error ? 'Error' : value ?? 0}
        </span>
      </div>
    </div>
  )
}

function DashboardOverview({ period }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDesignerDashboardSummary(period).then(setData).finally(() => setLoading(false))
  }, [period])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Designers" value={data?.totalDesigners} icon={Users} isLoading={loading} />
      <StatCard title="Active Designers" value={data?.activeDesigners} icon={UserCheck} isLoading={loading} />
      <StatCard title="Total Tasks" value={data?.totalAssignedTasks} icon={Briefcase} isLoading={loading} />
      <StatCard title="Pending Tasks" value={data?.pendingTasks} icon={Clock} isLoading={loading} />
      <StatCard title="Completed Tasks" value={data?.completedTasks} icon={CheckCircle} isLoading={loading} />
      <StatCard title="Pending Submissions" value={data?.pendingSubmissions} icon={FileText} isLoading={loading} />
      <StatCard title="Approved Designs" value={data?.approvedDesigns} icon={CheckCircle} isLoading={loading} />
      <StatCard title="Total Earnings" value={`₦${data?.totalEarnings?.toLocaleString('en-NG') || 0}`} icon={DollarSign} isLoading={loading} />
    </div>
  )
}

function TaskOverview({ period }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDesignerTasks(period).then(setTasks).finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="p-8 text-center">Loading tasks...</div>

  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-bright border-b border-surface-variant text-sm font-semibold text-on-surface-variant">
            <th className="p-4">Task</th>
            <th className="p-4">Designer</th>
            <th className="p-4">Status</th>
            <th className="p-4">Priority</th>
            <th className="p-4">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant">
          {tasks.map(t => (
            <tr key={t.id} className="hover:bg-surface-container-low">
              <td className="p-4 text-sm font-medium">{t.title}</td>
              <td className="p-4 text-sm">{t.assignedTo}</td>
              <td className="p-4 text-sm capitalize">{t.status}</td>
              <td className="p-4 text-sm capitalize">{t.priority}</td>
              <td className="p-4 text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr><td colSpan="5" className="p-8 text-center text-sm text-on-surface-variant">No tasks found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function SubmissionOverview({ period }) {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDesignerSubmissions(period).then(setSubs).finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="p-8 text-center">Loading submissions...</div>

  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-bright border-b border-surface-variant text-sm font-semibold text-on-surface-variant">
            <th className="p-4">Submission</th>
            <th className="p-4">Task</th>
            <th className="p-4">Designer</th>
            <th className="p-4">Status</th>
            <th className="p-4">Submitted At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant">
          {subs.map(s => (
            <tr key={s.id} className="hover:bg-surface-container-low">
              <td className="p-4 text-sm font-medium">{s.title}</td>
              <td className="p-4 text-sm">{s.taskTitle}</td>
              <td className="p-4 text-sm">{s.designerName}</td>
              <td className="p-4 text-sm capitalize">{s.status.replace('_', ' ')}</td>
              <td className="p-4 text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {subs.length === 0 && (
            <tr><td colSpan="5" className="p-8 text-center text-sm text-on-surface-variant">No submissions found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function PaymentOverview({ period }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDesignerPayments(period).then(setPayments).finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="p-8 text-center">Loading payments...</div>

  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-bright border-b border-surface-variant text-sm font-semibold text-on-surface-variant">
            <th className="p-4">Designer</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
            <th className="p-4">Created At</th>
            <th className="p-4">Paid At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant">
          {payments.map(p => (
            <tr key={p.id} className="hover:bg-surface-container-low">
              <td className="p-4 text-sm font-medium">{p.designerName}</td>
              <td className="p-4 text-sm">₦{p.amount.toLocaleString()}</td>
              <td className="p-4 text-sm capitalize">{p.status}</td>
              <td className="p-4 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
              <td className="p-4 text-sm">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr><td colSpan="5" className="p-8 text-center text-sm text-on-surface-variant">No payments found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function ActivityOverview({ period }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDesignerActivities(period).then(setActivities).finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="p-8 text-center">Loading activities...</div>

  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
      <div className="divide-y divide-surface-variant">
        {activities.map(a => (
          <div key={a.id} className="p-4 flex items-center justify-between hover:bg-surface-container-low">
            <div>
              <p className="text-sm text-on-surface font-semibold">{a.action.replace(/_/g, ' ')}</p>
              <p className="text-sm text-on-surface-variant">{a.description}</p>
            </div>
            <div className="text-xs text-on-surface-variant whitespace-nowrap ml-4">
              {new Date(a.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="p-8 text-center text-sm text-on-surface-variant">No recent activities found.</div>
        )}
      </div>
    </div>
  )
}

function DesignerList({ onViewProfile }) {
  const [designers, setDesigners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDesigners().then(setDesigners).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center">Loading designers...</div>

  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-bright border-b border-surface-variant text-sm font-semibold text-on-surface-variant">
            <th className="p-4">Designer</th>
            <th className="p-4">Status</th>
            <th className="p-4">Workload (Pending)</th>
            <th className="p-4">Approval Rate</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant">
          {designers.map(d => (
            <tr key={d.id} className="hover:bg-surface-container-low">
              <td className="p-4 text-sm">
                <p className="font-semibold">{d.name}</p>
                <p className="text-xs text-on-surface-variant">{d.email}</p>
              </td>
              <td className="p-4 text-sm capitalize">{d.accountStatus}</td>
              <td className="p-4 text-sm font-semibold">{d.workload} tasks</td>
              <td className="p-4 text-sm font-semibold text-primary">{d.approvalRate}%</td>
              <td className="p-4 text-sm">
                <button
                  onClick={() => onViewProfile(d.id)}
                  className="text-primary hover:underline font-semibold"
                >
                  View Profile & History
                </button>
              </td>
            </tr>
          ))}
          {designers.length === 0 && (
            <tr><td colSpan="5" className="p-8 text-center text-sm text-on-surface-variant">No designers found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function DesignerProfile({ id, onBack }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDesignerProfile(id).then(setProfile).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center">Loading profile...</div>
  if (!profile) return <div className="p-8 text-center text-error">Profile not found.</div>

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-semibold text-primary hover:underline mb-2">
        &larr; Back to Designers
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6">
          <h3 className="font-headline-sm mb-4">Personal Info</h3>
          <p className="text-sm"><strong>Name:</strong> {profile.personalInfo.fullName}</p>
          <p className="text-sm"><strong>Email:</strong> {profile.personalInfo.email}</p>
          <p className="text-sm"><strong>Status:</strong> {profile.personalInfo.accountStatus}</p>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6">
          <h3 className="font-headline-sm mb-4">Performance & Workload</h3>
          <p className="text-sm"><strong>Active Assignments:</strong> {profile.workInfo.activeAssignments}</p>
          <p className="text-sm"><strong>Completed Assignments:</strong> {profile.workInfo.completedAssignments}</p>
          <p className="text-sm"><strong>Approval Rate:</strong> {profile.workInfo.approvalRate}%</p>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 md:col-span-2">
          <h3 className="font-headline-sm mb-4">Payment Summary</h3>
          <p className="text-sm"><strong>Total Earnings:</strong> ₦{profile.paymentInfo.totalEarnings.toLocaleString()}</p>
          <p className="text-sm"><strong>Pending Payments:</strong> ₦{profile.paymentInfo.pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6">
        <h3 className="font-headline-sm mb-4">Task History</h3>
        <div className="max-h-64 overflow-y-auto border border-surface-variant rounded">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-bright border-b border-surface-variant">
              <tr><th className="p-2">Task</th><th className="p-2">Status</th><th className="p-2">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {profile.history.tasks.map(t => (
                <tr key={t.id}>
                  <td className="p-2">{t.title}</td>
                  <td className="p-2 capitalize">{t.status}</td>
                  <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                </tr>
              ))}
              {profile.history.tasks.length === 0 && <tr><td colSpan="3" className="p-4 text-center">No tasks found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6">
        <h3 className="font-headline-sm mb-4">Payment History</h3>
        <div className="max-h-64 overflow-y-auto border border-surface-variant rounded">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-bright border-b border-surface-variant">
              <tr><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {profile.history.payments.map(p => (
                <tr key={p.id}>
                  <td className="p-2">₦{p.amount.toLocaleString()}</td>
                  <td className="p-2 capitalize">{p.status}</td>
                  <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                </tr>
              ))}
              {profile.history.payments.length === 0 && <tr><td colSpan="3" className="p-4 text-center">No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function DesignerManagement() {
  const [view, setView] = useState('dashboard') // dashboard | tasks | submissions | payments | activities | designers | profile
  const [selectedDesignerId, setSelectedDesignerId] = useState(null)
  const [period, setPeriod] = useState('weekly')

  const tabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'payments', label: 'Payments' },
    { id: 'activities', label: 'Activities' },
    { id: 'designers', label: 'Designer Accounts' },
  ]

  const showPeriodSelector = ['dashboard', 'tasks', 'submissions', 'payments', 'activities'].includes(view)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-surface-variant w-full sm:w-auto hide-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setView(t.id); setSelectedDesignerId(null); }}
              className={cn(
                "px-3 py-1.5 text-sm font-semibold rounded whitespace-nowrap transition-colors",
                view === t.id ? "bg-surface-variant text-on-surface" : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showPeriodSelector && (
          <div className="flex gap-1 border border-surface-variant bg-surface rounded-lg p-1 shadow-soft shrink-0">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-all font-ui-mono uppercase",
                  period === p
                    ? 'bg-primary text-on-primary font-bold shadow-soft'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {view === 'dashboard' && <DashboardOverview period={period} />}
        {view === 'tasks' && <TaskOverview period={period} />}
        {view === 'submissions' && <SubmissionOverview period={period} />}
        {view === 'payments' && <PaymentOverview period={period} />}
        {view === 'activities' && <ActivityOverview period={period} />}
        {view === 'designers' && (
          <DesignerList
            onViewProfile={(id) => {
              setSelectedDesignerId(id)
              setView('profile')
            }}
          />
        )}
        {view === 'profile' && selectedDesignerId && (
          <DesignerProfile
            id={selectedDesignerId}
            onBack={() => setView('designers')}
          />
        )}
      </div>
    </div>
  )
}
