import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import ImageExtension from '@tiptap/extension-image'
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react'
import {
  Send,
  CheckCircle,
  Search,
  Loader2,
  Eye,
  Edit3,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
  Image as ImageIcon,
  Paperclip,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
  X,
  ChevronDown,
  Users,
  FileText,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ErrorBanner from '../../components/error-banner'
import { getAdminUsers } from '../../features/admin/admin-api'
import {
  sendSystemAnnouncement,
  getNotificationHistory,
} from '../../features/admin/notifications-api'

const ANNOUNCEMENT_TYPE_TO_DB = {
  'System Announcement': 'SYSTEM_ANNOUNCEMENT',
  'Task Notification': 'TICKET_ASSIGNED',
  'Submission Notification': 'CONTENT_APPROVAL',
  'Payment Notification': 'SUBSCRIPTION_PAYMENT_SUCCESS',
  'Subscription Reminder': 'SUBSCRIPTION_RENEWAL_REMINDER',
  Publishing: 'CONTENT_PUBLISHED',
  Maintenance: 'MAINTENANCE',
}

const TYPE_LABEL_FROM_DB = {
  SYSTEM_ANNOUNCEMENT: 'System',
  MAINTENANCE: 'Maintenance',
  CONTENT_APPROVAL: 'Submission',
  CONTENT_PUBLISHED: 'Publishing',
  CONTENT_PUBLISH_FAILED: 'Publishing',
  SUBSCRIPTION_RENEWAL_REMINDER: 'Reminder',
  SUBSCRIPTION_EXPIRED: 'Reminder',
  SUBSCRIPTION_PAYMENT_SUCCESS: 'Payment',
  SUBSCRIPTION_PAYMENT_FAILED: 'Payment',
  SUBSCRIPTION_PAYMENT_PENDING: 'Payment',
  SUBSCRIPTION_INVOICE_AVAILABLE: 'Payment',
  ACCOUNT_CONNECTION_DISCONNECTED: 'Account',
  ACCOUNT_CONNECTION_REAUTHORIZATION_REQUIRED: 'Account',
  ACCOUNT_CONNECTION_RECONNECTED: 'Account',
  CALENDAR_UPLOADED: 'Submission',
  TICKET_RECEIVED: 'Submission',
  TICKET_ASSIGNED: 'Task',
  TICKET_RESPONDED: 'Task',
  TICKET_RESOLVED: 'Task',
  TICKET_CLOSED: 'Task',
  SECURITY_NOTICE: 'Security',
  FEATURE_UPDATE: 'Feature Update',
  SERVICE_UPDATE: 'Service Update',
}

const TYPE_TONE = {
  System: 'primary',
  Reminder: 'warning',
  Submission: 'success',
  Task: 'primary',
  Payment: 'success',
  Publishing: 'primary',
  Maintenance: 'danger',
  Account: 'warning',
  Security: 'danger',
  'Feature Update': 'success',
  'Service Update': 'warning',
}

function generateId() {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim()
}

function cleanTitle(title) {
  if (!title) return ''
  const cleaned = title
    .replace(/\[\s*admin\s*copy\s*\]/gi, '')
    .replace(/\s*-\s*admin\s*copy/gi, '')
    .replace(/admin\s*copy/gi, '')
    .trim()
  return cleaned || 'Approval'
}

function formatSenderString(sender) {
  if (!sender) return ''
  let name = typeof sender === 'string' ? sender : (sender.fullName || sender.name || '')
  if (!name) return ''
  name = name.replace(/\s*\([^)]*\)/g, '')
  name = name.replace(/SUPER ADMIN|ACCOUNT MANAGER|SUPPORT STAFF|REVIEWER|DESIGNER|CLIENT|ADMIN/gi, '')
  name = name.trim()
  return name ? `FROM ${name.toUpperCase()}` : ''
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}



function RichTextEditor({ value, onChange, onImageSelect, onFileSelect }) {
  const [showEmoji, setShowEmoji] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const emojiRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      ImageExtension,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder:
          'Write your message here. You can format text, add emojis, images, and files...',
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false)
      }
    }
    if (showEmoji) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmoji])

  if (!editor) {
    return <div className="h-32 rounded-control border border-border bg-canvas animate-pulse" />
  }

  const ToolButton = ({ onClick, active, disabled, children, title }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-control text-ink hover:bg-canvas transition-colors ${
        active ? 'bg-primary/10 text-primary' : ''
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )

  const handleLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const handleEmoji = (emojiData, event) => {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation()
    }
    const emojiChar = emojiData?.emoji || emojiData?.native
    if (emojiChar && editor) {
      editor.chain().focus().insertContent(emojiChar).run()
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result
        if (dataUrl && editor) {
          editor.chain().focus().setImage({ src: dataUrl }).run()
        }
        onImageSelect(file)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    e.target.value = ''
  }

  return (
    <div className="w-full rounded-control border border-border bg-surface overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-canvas/40">
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bulleted list"
        >
          <List size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code block"
        >
          <Code size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus size={16} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align left"
        >
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align center"
        >
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align right"
        >
          <AlignRight size={16} />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton
          onClick={() => {
            const previous = editor.getAttributes('link').href
            setLinkUrl(previous || 'https://')
            setShowLinkInput((prev) => !prev)
          }}
          active={editor.isActive('link')}
          title="Insert link"
        >
          <LinkIcon size={16} />
        </ToolButton>

        <div className="relative" ref={emojiRef}>
          <ToolButton
            onClick={() => setShowEmoji((prev) => !prev)}
            active={showEmoji}
            title="Insert emoji"
          >
            <Smile size={16} />
          </ToolButton>
          {showEmoji && (
            <div className="absolute top-full left-0 mt-1 z-50 shadow-hover rounded-card overflow-hidden">
              <EmojiPicker
                onEmojiClick={handleEmoji}
                theme={Theme.LIGHT}
                lazyLoadEmojis={false}
                searchPlaceholder="Search emoji..."
                width={320}
                height={380}
              />
            </div>
          )}
        </div>

        <ToolButton
          onClick={() => imageInputRef.current?.click()}
          title="Insert image"
        >
          <ImageIcon size={16} />
        </ToolButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <ToolButton
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip size={16} />
        </ToolButton>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={16} />
        </ToolButton>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-canvas/20">
          <LinkIcon size={14} className="text-ink-muted" />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleLink()
              }
            }}
            placeholder="https://example.com"
            className="flex-1 px-2 py-1 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <Button type="button" size="sm" onClick={handleLink}>
            Apply
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false)
              setLinkUrl('')
            }}
            className="p-1 text-ink-muted hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="p-3 min-h-[160px]">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none text-ink focus:outline-none [&_p]:my-1 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ink-muted [&_code]:bg-canvas [&_code]:px-1 [&_code]:rounded [&_a]:text-primary [&_a]:underline [&_img]:rounded-control [&_img]:max-w-full [&_hr]:my-2 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:text-ink-muted [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:pointer-events-none"
        />
      </div>
    </div>
  )
}

function ClientSelector({
  selectedMode,
  onModeChange,
  selectedClientId,
  onClientChange,
  clients,
  loading,
  error,
  onSearch,
  searchQuery,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const formatRoleLabel = (role) => {
    if (!role) return 'Client'
    const r = role.toLowerCase()
    if (r === 'designer') return 'Graphic Designer'
    if (r === 'support_staff') return 'Support Staff'
    if (r === 'account_manager') return 'Account Manager'
    if (r === 'reviewer') return 'Reviewer'
    if (r === 'super_admin') return 'Super Admin'
    return 'Client'
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink flex items-center gap-2">
        <Users size={14} className="text-primary" />
        Recipients
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onModeChange('all')}
          className={`h-10 px-3 rounded-control border text-xs sm:text-sm font-medium transition-colors ${
            selectedMode === 'all'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-ink border-border hover:bg-canvas'
          }`}
        >
          All Clients
        </button>
        <button
          type="button"
          onClick={() => onModeChange('staff')}
          className={`h-10 px-3 rounded-control border text-xs sm:text-sm font-medium transition-colors ${
            selectedMode === 'staff'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-ink border-border hover:bg-canvas'
          }`}
        >
          Staff & Designers
        </button>
        <button
          type="button"
          onClick={() => onModeChange('all_users')}
          className={`h-10 px-3 rounded-control border text-xs sm:text-sm font-medium transition-colors ${
            selectedMode === 'all_users'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-ink border-border hover:bg-canvas'
          }`}
        >
          All Users
        </button>
        <button
          type="button"
          onClick={() => onModeChange('specific')}
          className={`h-10 px-3 rounded-control border text-xs sm:text-sm font-medium transition-colors ${
            selectedMode === 'specific'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-ink border-border hover:bg-canvas'
          }`}
        >
          Specific Recipient
        </button>
      </div>

      {selectedMode === 'specific' && (
        <div className="relative mt-1" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="w-full h-10 px-3 rounded-control border border-border bg-surface text-sm text-ink flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className={selectedClient ? 'text-ink font-medium' : 'text-ink-muted'}>
              {selectedClient
                ? `${selectedClient.fullName} (${selectedClient.email}) — ${formatRoleLabel(selectedClient.role)}`
                : 'Select a recipient...'}
            </span>
            <ChevronDown size={16} className="text-ink-muted" />
          </button>

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 z-40 rounded-control border border-border bg-surface shadow-hover">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search by name, email, role..."
                    className="w-full h-8 pl-8 pr-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loading && (
                  <div className="px-3 py-3 text-xs text-ink-muted flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> Loading recipients...
                  </div>
                )}
                {error && !loading && (
                  <div className="px-3 py-3 text-xs text-danger">{error}</div>
                )}
                {!loading && !error && clients.length === 0 && (
                  <div className="px-3 py-3 text-xs text-ink-muted">No recipients found.</div>
                )}
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onClientChange(c.id)
                      setOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-canvas transition-colors flex items-center justify-between ${
                      c.id === selectedClientId ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-ink">{c.fullName}</div>
                      <div className="text-xs text-ink-muted">{c.email}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {formatRoleLabel(c.role)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedMode === 'specific' && selectedClient && (
        <div className="mt-1 px-2.5 py-1.5 rounded-control bg-canvas border border-border text-xs text-ink-muted flex items-center justify-between">
          <span>
            Sending to:{' '}
            <span className="font-semibold text-ink">{selectedClient.fullName}</span> (
            {selectedClient.email})
          </span>
          <span className="font-semibold text-primary">{formatRoleLabel(selectedClient.role)}</span>
        </div>
      )}
    </div>
  )
}

function AttachmentPreview({ attachments, onRemove }) {
  if (attachments.length === 0) return null

  const images = attachments.filter((a) => a.kind === 'image')
  const files = attachments.filter((a) => a.kind === 'file')

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-control border border-border overflow-hidden bg-canvas"
            >
              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-full h-28 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-ink/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink"
                title="Remove image"
              >
                <X size={12} />
              </button>
              <div className="px-2 py-1 text-[10px] text-ink-muted truncate">{img.name}</div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-control border border-border bg-canvas"
            >
              <FileText size={14} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-ink truncate">{f.name}</div>
                <div className="text-[10px] text-ink-muted">
                  {formatBytes(f.size)} · {f.mimeType || 'file'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="p-1 text-ink-muted hover:text-danger"
                title="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Notifications() {
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types')

  const [formState, setFormState] = useState({
    type: 'System Announcement',
    title: '',
    message: '',
  })

  const [recipientMode, setRecipientMode] = useState('all')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState(null)

  const [attachments, setAttachments] = useState([])
  const [sendButtonState, setSendButtonState] = useState('idle')
  const [sendError, setSendError] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const res = await getNotificationHistory({ limit: 100 })
      setHistory(res.data || [])
    } catch (err) {
      setHistoryError(err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const loadClients = useCallback(async (search) => {
    setClientsLoading(true)
    setClientsError(null)
    try {
      const list = await getAdminUsers({ search: search || undefined, tab: 'active' })
      setClients(
        list.filter(
          (u) => u.accountStatus === 'ACTIVE' || u.accountStatus === 'active' || u.isActive,
        ),
      )
    } catch (err) {
      setClientsError(err?.message || 'Failed to load recipients')
      setClients([])
    } finally {
      setClientsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (recipientMode === 'specific') {
      loadClients(clientSearch)
    }
  }, [recipientMode, clientSearch, loadClients])

  const handleAddImage = (file) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      setSendError({ message: 'Image exceeds 5MB limit' })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setAttachments((prev) => [
        ...prev,
        {
          id: generateId(),
          kind: 'image',
          name: file.name,
          mimeType: file.type,
          dataUrl: e.target?.result,
          size: file.size,
        },
      ])
    }
    reader.readAsDataURL(file)
  }

  const handleAddFile = (file) => {
    if (file.size > 10 * 1024 * 1024) {
      setSendError({ message: 'File exceeds 10MB limit' })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setAttachments((prev) => [
        ...prev,
        {
          id: generateId(),
          kind: 'file',
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: e.target?.result,
          size: file.size,
        },
      ])
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const buildFinalMessage = () => {
    let html = formState.message || ''
    if (attachments.length > 0) {
      const imageAttachments = attachments.filter((a) => a.kind === 'image' && !html.includes(a.dataUrl))
      const fileAttachments = attachments.filter((a) => a.kind === 'file')
      if (imageAttachments.length > 0) {
        const imageHtml = imageAttachments
          .map((a) => `<p><img src="${a.dataUrl}" alt="${a.name}" /></p>`)
          .join('')
        html = `${html}${imageHtml}`
      }
      if (fileAttachments.length > 0) {
        const fileHtml = fileAttachments
          .map(
            (a) =>
              `<p><a href="${a.dataUrl}" target="_blank" rel="noopener noreferrer">📎 ${a.name}</a> <span style="color:#666;font-size:12px">(${formatBytes(a.size)})</span></p>`,
          )
          .join('')
        html = `${html}${fileHtml}`
      }
    }
    return html
  }

  const handleSendNotification = async (e) => {
    e.preventDefault()

    const plainMessage = stripHtml(formState.message)
    if (!plainMessage || sendButtonState === 'sending') return

    if (recipientMode === 'specific' && !selectedClientId) {
      setSendError({ message: 'Please select a specific recipient.' })
      return
    }

    setSendError(null)
    setSendButtonState('sending')

    try {
      const finalMessage = buildFinalMessage()
      let targetAudience = 'CLIENTS'
      if (recipientMode === 'staff') targetAudience = 'STAFF_DESIGNERS'
      if (recipientMode === 'all_users') targetAudience = 'ALL'

      await sendSystemAnnouncement({
        title: cleanTitle(formState.title) || ANNOUNCEMENT_TYPE_TO_DB[formState.type] || 'Notification',
        message: finalMessage,
        channel: 'BOTH',
        priority: 'NORMAL',
        targetUserIds:
          recipientMode === 'specific' && selectedClientId ? [selectedClientId] : undefined,
        metadata: {
          announcementType: ANNOUNCEMENT_TYPE_TO_DB[formState.type] || 'SYSTEM_ANNOUNCEMENT',
          targetAudience: recipientMode === 'specific' ? undefined : targetAudience,
          attachmentsCount: attachments.length,
        },
      })

      setSendButtonState('sent')
      setAttachments([])
      setFormState((prev) => ({ ...prev, message: '', title: '' }))

      await loadHistory()

      setTimeout(() => setSendButtonState('idle'), 2200)
    } catch (err) {
      setSendError(err)
      setSendButtonState('error')
      setTimeout(() => setSendButtonState('idle'), 2500)
    }
  }

  const filteredHistory = useMemo(() => {
    return history.filter((n) => {
      const plainMessage = stripHtml(n.message)
      const cleanedNotiTitle = cleanTitle(n.title)
      const matchSearch =
        !searchQuery ||
        plainMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cleanedNotiTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())

      const typeLabel = TYPE_LABEL_FROM_DB[n.type] || n.type
      const matchType =
        selectedTypeFilter === 'All Types' ||
        typeLabel.toLowerCase() === selectedTypeFilter.toLowerCase()

      return matchSearch && matchType
    })
  }, [history, searchQuery, selectedTypeFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Management"
        description="Configure and broadcast system-wide alerts or targeted messages."
      />

      {sendError && <ErrorBanner error={sendError} onDismiss={() => setSendError(null)} />}

      <Card className="p-0 overflow-hidden shadow-soft">
        <div className="p-5 border-b border-border bg-canvas/30">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <Send size={16} className="text-primary" />
            Send New Notification
          </h3>
        </div>

        <form onSubmit={handleSendNotification} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Type</label>
              <select
                value={formState.type}
                onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value }))}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value="System Announcement">System Announcement</option>
                <option value="Task Notification">Task Notification</option>
                <option value="Submission Notification">Submission Notification</option>
                <option value="Payment Notification">Payment Notification</option>
                <option value="Subscription Reminder">Subscription Reminder</option>
                <option value="Publishing">Publishing</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Title</label>
              <input
                type="text"
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title (e.g. Approval)"
                maxLength={255}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <ClientSelector
            selectedMode={recipientMode}
            onModeChange={(m) => {
              setRecipientMode(m)
              if (m !== 'specific') setSelectedClientId('')
            }}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
            clients={clients}
            loading={clientsLoading}
            error={clientsError}
            onSearch={setClientSearch}
            searchQuery={clientSearch}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Message</label>
            <RichTextEditor
              value={formState.message}
              onChange={(html) => setFormState((prev) => ({ ...prev, message: html }))}
              onImageSelect={handleAddImage}
              onFileSelect={handleAddFile}
            />
          </div>

          <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} />

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-ink-muted">
              {attachments.length > 0
                ? `${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`
                : 'No attachments'}
            </div>
            <Button
              type="submit"
              variant={sendButtonState === 'sent' ? 'success' : 'primary'}
              disabled={
                sendButtonState === 'sending' ||
                !stripHtml(formState.message) ||
                (recipientMode === 'specific' && !selectedClientId)
              }
              className="gap-2 font-semibold text-sm"
            >
              {sendButtonState === 'sending' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : sendButtonState === 'sent' ? (
                <>
                  <CheckCircle size={16} />
                  Sent!
                </>
              ) : sendButtonState === 'error' ? (
                <>
                  <X size={16} />
                  Failed
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden shadow-soft">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base font-semibold text-ink">Notification History</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-control py-1.5 pl-3 pr-8 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="All Types">All Types</option>
                <option value="System">System</option>
                <option value="Task">Task</option>
                <option value="Submission">Submission</option>
                <option value="Payment">Payment</option>
                <option value="Reminder">Reminder</option>
                <option value="Publishing">Publishing</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Account">Account</option>
              </select>
            </div>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-40 pl-8 pr-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {historyError && !historyLoading && (
          <ErrorBanner error={historyError} onDismiss={() => setHistoryError(null)} />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-canvas/10 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Sent</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-ink bg-surface">
              {historyLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-muted text-xs font-medium">
                    <Loader2
                      size={20}
                      className="animate-spin text-primary inline-block mr-2"
                    />
                    Loading notification history...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-ink-muted text-xs font-medium"
                  >
                    No notifications recorded in history.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((noti) => {
                  const typeLabel = TYPE_LABEL_FROM_DB[noti.type] || noti.type
                  const toneVal = TYPE_TONE[typeLabel] || 'primary'
                  const sentDate = noti.sentAt || noti.createdAt
                  const dateLabel = new Date(sentDate).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const cleanedNotiTitle = cleanTitle(noti.title)
                  const senderStr = formatSenderString(noti.sender)

                  return (
                    <tr key={noti.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-5 py-4">
                        <Badge tone={toneVal}>{typeLabel}</Badge>
                      </td>
                      <td className="px-5 py-4 text-ink-muted text-xs">
                        <div className="font-semibold text-ink">
                          {noti.user?.fullName || '—'}
                        </div>
                        <div>{noti.user?.email || ''}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink max-w-[200px] truncate">
                        {cleanedNotiTitle}
                      </td>
                      <td className="px-5 py-4 text-ink-muted max-w-xs truncate">
                        <div>{stripHtml(noti.message)}</div>
                        {senderStr && (
                          <div className="text-[10px] text-ink-muted font-bold tracking-wide mt-0.5">
                            {senderStr}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-muted whitespace-nowrap">
                        {dateLabel}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-accent font-semibold text-xs">
                          <CheckCircle size={14} className="fill-accent-50 text-accent" />
                          {noti.status}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-border flex justify-between items-center text-xs text-ink-muted bg-surface">
          <span>
            Showing {filteredHistory.length} of {history.length} notifications
          </span>
        </div>
      </Card>
    </div>
  )
}
