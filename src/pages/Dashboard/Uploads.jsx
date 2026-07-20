import { useState, useEffect, useRef } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import {
  Upload,
  Image as ImageIcon,
  Film,
  FileText,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  PlayCircle,
  Plus,
  LayoutGrid,
  List as ListIcon,
  FolderOpen,
  Search,
  AlertCircle,
  X,
  RefreshCw,
  FileUp,
  MessageSquare,
} from 'lucide-react'

const CATEGORIES = [
  'Business Assets',
  'Staff Images',
  'Office View',
  'Products',
  'Events',
  'Business Documents',
]

export default function Uploads() {
  const fileInputRef = useRef(null)

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState('Business Assets')

  // Asset Library State
  const [assets, setAssets] = useState([
    {
      id: 1,
      name: 'Company_Logo_Primary.png',
      category: 'Business Assets',
      type: 'image',
      size: '1.2 MB',
      sizeBytes: 1240000,
      date: 'Oct 25',
      timestamp: 1698192000000,
      status: 'Approved',
      description: 'Main high-resolution logo mark for headers & press kits.',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 2,
      name: 'Executive_Team_Photo.jpg',
      category: 'Staff Images',
      type: 'image',
      size: '3.4 MB',
      sizeBytes: 3500000,
      date: 'Oct 24',
      timestamp: 1698105600000,
      status: 'Approved',
      description: 'Leadership team headshots for about page & media releases.',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1krZOfiC6QCAloGneiRc7-QX9-b2GDw_jJp4PPpYJs_58goOSnxRVa75QfDvZwx2JZUdtNuo3fxSKFyTaBNfrJ_cWUPIBaPiXD_Cr1NoU3nRDQFk80hmL--8tzLtcdwq9V7g-eZgMJtTK0yhskZWUetaQlC-IW5GvXOSYiBif-qTMjbIcY5-jhKGdZao7dfkgCyuplIfGiksE2DvY8MzsblqLGh5o9KPfoxuQPuZ41wmO-75vJ_CZjdQ7klTl0lDfxPFRjADYw2Ch',
    },
    {
      id: 3,
      name: 'SF_Headquarters_Lobby.jpg',
      category: 'Office View',
      type: 'image',
      size: '4.1 MB',
      sizeBytes: 4200000,
      date: 'Oct 23',
      timestamp: 1698019200000,
      status: 'Approved',
      description: 'Main lobby area shot with ambient natural daylight.',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 4,
      name: 'Product_Reveal_Draft.mp4',
      category: 'Products',
      type: 'video',
      size: '18.5 MB',
      sizeBytes: 19400000,
      date: 'Oct 21',
      timestamp: 1697846400000,
      status: 'Approved',
      description: 'Feature demonstration video for the v2.0 software release.',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3Jimuu-B4LWppBlMkDFBuoUyVtoA4p-ilkzJM6JTRQUbElC4T5hs8VRN8dJzHeXZfMSRpLJm3xNR17lWyCT-cvSfVyPYiuD6sEcOdaaHuITbxMo9VeOggj-EMjwY214lPqnDHptGeUqELk6lHZ5yBCRRSEuNm_K8HjIy1bTJh8RoAOWgebkylgR4CFuVOD_D7g0ql5u2BUcXfEvq-d4Gx1Ah8FBF0gpPVZ8g2gqx5_toU2Gsj5MQXi10Tyw9u_kTolEz-X3vQTRHT',
    },
    {
      id: 5,
      name: 'Annual_Tech_Summit_Keynote.mp4',
      category: 'Events',
      type: 'video',
      size: '42.8 MB',
      sizeBytes: 44800000,
      date: 'Oct 20',
      timestamp: 1697760000000,
      status: 'Approved',
      description: 'Keynote presentation recording from Tech Summit 2024.',
    },
    {
      id: 6,
      name: 'Corporate_Governance_2024.pdf',
      category: 'Business Documents',
      type: 'document',
      size: '1.8 MB',
      sizeBytes: 1880000,
      date: 'Oct 19',
      timestamp: 1697673600000,
      status: 'Approved',
      description: 'Official corporate compliance policy and ethics guide.',
    },
    {
      id: 7,
      name: 'Brand_Banner_Twitter.png',
      category: 'Business Assets',
      type: 'image',
      size: '2.5 MB',
      sizeBytes: 2600000,
      date: 'Oct 18',
      timestamp: 1697587200000,
      status: 'Approved',
      description: 'Social header graphics for X/Twitter brand page.',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAleUQStKWP_nrPLhcPgKO1wb_6LbpZM2WcZRJkvqSNyOd-4d16FY3P2EwbkP_FP3Wt33EZeXgjELG-2ONDt-4UJobjnV5my8HB9QsvMP3rQ2AVhomrZux2ECKmXz8SSap3un_SuaqzTlkCxSeJeYuA_e_an2mmozXi8MShxo5flHnQP1rRkQd1ygbWn21cg1wttdiGBBorf956x22nx9OgxLRR6xXSk08b9mBoJVweYkYugFLIoIcqlBDx0ynqSg_Ze5a6BKFYi37e',
    },
  ])

  // Staged Files Pending Upload
  const [pendingFiles, setPendingFiles] = useState([])

  // UI Interactive States
  const [sortOption, setSortOption] = useState('Newest') // 'Newest' | 'Largest' | 'Name'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewAsset, setPreviewAsset] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState(null)
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  // Auto-simulate upload progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      setAssets((prevAssets) =>
        prevAssets.map((asset) => {
          if (asset.status === 'Uploading' || asset.status === 'Processing') {
            const nextProgress = asset.progress + Math.floor(Math.random() * 12) + 5
            if (nextProgress >= 100) {
              return {
                ...asset,
                progress: 100,
                status: 'Approved',
              }
            }
            return { ...asset, progress: nextProgress }
          }
          return asset
        })
      )
    }, 1200)

    return () => clearInterval(timer)
  }, [])

  // Drag and Drop simulation handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFilesStaged(files)
    }
  }

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFilesStaged(files)
    }
  }

  const handleFilesStaged = (files) => {
    const newStaged = Array.from(files).map((file) => {
      let type = 'document'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'

      let previewUrl
      if (type === 'image') {
        previewUrl = URL.createObjectURL(file)
      }

      return {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        type,
        size:
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
        sizeBytes: file.size,
        description: '',
        previewUrl,
      }
    })

    setPendingFiles((prev) => [...prev, ...newStaged])
  }

  const updatePendingDescription = (id, description) => {
    setPendingFiles((prev) =>
      prev.map((pf) => (pf.id === id ? { ...pf, description } : pf))
    )
  }

  const removePendingFile = (id) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.id !== id))
  }

  const handleUploadSubmit = () => {
    if (pendingFiles.length === 0) return

    const newAssets = pendingFiles.map((pf) => ({
      id: Date.now() + Math.random(),
      name: pf.name,
      category: activeCategory,
      type: pf.type,
      size: pf.size,
      sizeBytes: pf.sizeBytes,
      date: 'Just now',
      timestamp: Date.now(),
      status: 'Uploading',
      progress: 10,
      description: pf.description,
      url: pf.previewUrl || (pf.type === 'image' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80' : undefined),
    }))

    setAssets((prev) => [...newAssets, ...prev])
    setPendingFiles([])
  }

  // Create new folder action
  const handleCreateFolder = (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    alert(`Mock folder "${newFolderName}" created under ${activeCategory}!`)
    setNewFolderName('')
    setIsFolderModalOpen(false)
  }

  // Delete file action
  const handleDeleteConfirm = () => {
    if (assetToDelete) {
      setAssets((prev) => prev.filter((a) => a.id !== assetToDelete.id))
      setAssetToDelete(null)
      setIsDeleteModalOpen(false)
    }
  }

  const triggerDelete = (asset) => {
    setAssetToDelete(asset)
    setIsDeleteModalOpen(true)
    setActiveDropdownId(null)
  }

  const triggerPreview = (asset) => {
    setPreviewAsset(asset)
    setIsPreviewModalOpen(true)
    setActiveDropdownId(null)
  }

  const handleDownloadSim = (asset) => {
    alert(`Downloading ${asset.name} (${asset.size})...`)
    setActiveDropdownId(null)
  }

  // Filter assets by Active Category Tab + Search Query + Sorting
  const categoryAssets = assets
    .filter((asset) => asset.category === activeCategory)
    .filter((asset) => asset.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'Newest') return b.timestamp - a.timestamp
      if (sortOption === 'Largest') return b.sizeBytes - a.sizeBytes
      if (sortOption === 'Name') return a.name.localeCompare(b.name)
      return 0
    })

  // Get asset badges / icon attributes
  const getAssetTypeIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="text-primary w-10 h-10" />
      case 'video':
        return <Film className="text-accent w-10 h-10" />
      default:
        return <FileText className="text-danger w-10 h-10" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <Badge tone="success" className="text-[10px] font-bold uppercase tracking-wider">
            Approved
          </Badge>
        )
      case 'Uploading':
      case 'Processing':
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold text-[10px] uppercase tracking-wider">
            {status}
          </span>
        )
      default:
        return <Badge tone="neutral">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept="image/*,video/*,.pdf,.docx,.doc"
      />

      {/* Page Header Component */}
      <PageHeader
        title="Media & Documents"
        description="Manage your categorized brand assets and document library"
      />

      {/* Horizontal Category Navigation Tabs */}
      <div className="border-b border-border bg-surface rounded-card p-1 shadow-soft overflow-x-auto">
        <nav className="flex whitespace-nowrap min-w-max gap-1">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category
            const count = assets.filter((a) => a.category === category).length

            return (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category)
                  setPendingFiles([])
                }}
                className={`px-4 py-2.5 text-sm font-medium rounded-control transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary text-white shadow-soft font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-canvas'
                }`}
              >
                <span>{category}</span>
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-canvas text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Upload Zone (Specific to Active Tab) */}
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold text-ink">
              Upload to <span className="text-primary">{activeCategory}</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Select or drop files to store under {activeCategory}
            </p>
          </div>
          <Badge tone="primary" className="text-xs">
            Category: {activeCategory}
          </Badge>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`border-2 border-dashed rounded-control p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary-50/50 scale-[1.01]'
              : 'border-border bg-canvas hover:border-primary hover:bg-surface'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary flex items-center justify-center">
            <Upload size={24} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">
              Drag &amp; drop files here, or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              Supports images, videos, and documents
            </p>
          </div>
        </div>

        {/* Pending Files Staging Box (Pre-Submit Descriptions) */}
        {pendingFiles.length > 0 && (
          <div className="bg-canvas border border-border rounded-control p-4 space-y-4 mt-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <FileUp size={14} className="text-primary" /> Staged Files ({pendingFiles.length})
              </span>
              <button
                onClick={() => setPendingFiles([])}
                className="text-xs text-ink-muted hover:text-danger"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {pendingFiles.map((pf) => (
                <div
                  key={pf.id}
                  className="bg-surface border border-border rounded-control p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-canvas flex items-center justify-center shrink-0 border border-border">
                      {pf.type === 'image' && pf.previewUrl ? (
                        <img
                          src={pf.previewUrl}
                          alt={pf.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : pf.type === 'video' ? (
                        <Film className="text-accent w-5 h-5" />
                      ) : (
                        <FileText className="text-danger w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate max-w-xs">{pf.name}</p>
                      <p className="text-[10px] text-ink-muted">{pf.size}</p>
                    </div>
                  </div>

                  {/* Pre-submit description input */}
                  <div className="w-full sm:w-1/2 flex items-center gap-2">
                    <Input
                      placeholder="Add description (optional)"
                      value={pf.description}
                      onChange={(e) => updatePendingDescription(pf.id, e.target.value)}
                      className="text-xs h-8"
                    />
                    <button
                      onClick={() => removePendingFile(pf.id)}
                      className="text-ink-muted hover:text-danger p-1"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setPendingFiles([])}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleUploadSubmit} className="gap-1.5">
                <Upload size={14} /> Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''} to {activeCategory}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Main Files Display Section */}
      <div className="space-y-4">
        {/* Search, Sort & View Mode Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <h3 className="text-base font-semibold text-ink">
            {activeCategory} Files ({categoryAssets.length})
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category..."
                className="w-full h-9 rounded-control border border-border bg-surface pl-9 pr-8 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-9 rounded-control border border-border bg-surface px-3 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Newest">Sort by: Newest</option>
              <option value="Largest">Sort by: Largest</option>
              <option value="Name">Sort by: Name</option>
            </select>

            {/* Grid vs List View Mode */}
            <div className="flex border border-border rounded-control overflow-hidden bg-surface">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-canvas text-primary' : 'text-ink-muted hover:text-ink'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-canvas text-primary' : 'text-ink-muted hover:text-ink'
                }`}
                title="List View"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Uploaded Files Grid / List */}
        {categoryAssets.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            <FolderOpen size={48} className="text-ink-muted mb-3 stroke-1" />
            <h4 className="text-base font-semibold text-ink">No files in {activeCategory}</h4>
            <p className="text-xs text-ink-muted mt-1 max-w-sm">
              Upload files above to store them in {activeCategory}.
            </p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoryAssets.map((asset) => (
              <Card
                key={asset.id}
                className="overflow-hidden group hover:shadow-hover border border-border flex flex-col justify-between"
              >
                {/* Media Thumbnail */}
                <div className="aspect-square bg-canvas flex items-center justify-center relative overflow-hidden">
                  {asset.status === 'Uploading' || asset.status === 'Processing' ? (
                    <div className="absolute inset-0 bg-ink/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-primary-700">{asset.progress}%</span>
                      </div>
                    </div>
                  ) : null}

                  {asset.type === 'image' && asset.url ? (
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url('${asset.url}')` }}
                    />
                  ) : asset.type === 'video' && asset.url ? (
                    <div
                      className="w-full h-full bg-cover bg-center flex items-center justify-center relative"
                      style={{ backgroundImage: `url('${asset.url}')` }}
                    >
                      <PlayCircle className="text-white drop-shadow-md w-12 h-12" />
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      {getAssetTypeIcon(asset.type)}
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mt-2">
                        {asset.type}
                      </p>
                    </div>
                  )}

                  {/* Lightbox / Actions Overlay */}
                  {asset.status !== 'Uploading' && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-surface/90 backdrop-blur-md p-1 rounded-control shadow-soft border border-border flex gap-1">
                        <button
                          onClick={() => triggerPreview(asset)}
                          className="p-1 rounded text-ink-muted hover:text-primary hover:bg-canvas"
                          title="Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadSim(asset)}
                          className="p-1 rounded text-ink-muted hover:text-primary hover:bg-canvas"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => triggerDelete(asset)}
                          className="p-1 rounded text-danger hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Details & Description */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2 relative">
                    <h3
                      className="text-sm font-semibold text-ink truncate cursor-pointer hover:text-primary"
                      onClick={() => triggerPreview(asset)}
                      title={asset.name}
                    >
                      {asset.name}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDropdownId(activeDropdownId === asset.id ? null : asset.id)
                        }}
                        className="text-ink-muted hover:text-ink p-1 rounded hover:bg-canvas"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdownId === asset.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveDropdownId(null)}
                          />
                          <div className="absolute right-0 bottom-full mb-1 w-36 rounded-control bg-surface border border-border shadow-hover py-1 z-20">
                            <button
                              onClick={() => triggerPreview(asset)}
                              className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-canvas flex items-center gap-1.5"
                            >
                              <Eye size={14} /> Details
                            </button>
                            <button
                              onClick={() => handleDownloadSim(asset)}
                              className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-canvas flex items-center gap-1.5"
                            >
                              <Download size={14} /> Download
                            </button>
                            <hr className="border-border my-1" />
                            <button
                              onClick={() => triggerDelete(asset)}
                              className="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-red-50 flex items-center gap-1.5 font-medium"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {asset.description && (
                    <p
                      className="text-xs text-ink-muted bg-canvas p-2 rounded-control border border-border/60 line-clamp-2"
                      title={asset.description}
                    >
                      {asset.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-xs text-ink-muted pt-1">
                    <span>{asset.size}</span>
                    {getStatusBadge(asset.status)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-canvas border-b border-border">
                    <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categoryAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-ink flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-canvas flex items-center justify-center shrink-0 border border-border">
                          {asset.type === 'image' ? (
                            <ImageIcon size={14} className="text-primary" />
                          ) : asset.type === 'video' ? (
                            <Film size={14} className="text-accent" />
                          ) : (
                            <FileText size={14} className="text-danger" />
                          )}
                        </div>
                        <span
                          className="truncate max-w-xs cursor-pointer hover:text-primary"
                          onClick={() => triggerPreview(asset)}
                        >
                          {asset.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted max-w-xs truncate">
                        {asset.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted">{asset.size}</td>
                      <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 text-ink-muted">
                          <button
                            onClick={() => triggerPreview(asset)}
                            className="hover:text-primary transition-colors cursor-pointer"
                            title="Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownloadSim(asset)}
                            className="hover:text-primary transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => triggerDelete(asset)}
                            className="hover:text-danger transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* New Folder Modal */}
      <Modal
        open={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title="Create New Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <Input
            label="Folder Name"
            required
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g. Q4 Campaign Assets"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete File Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm File Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Are you sure you want to delete <strong>{assetToDelete?.name}</strong> from {activeCategory}?
          </p>
          <div className="bg-canvas p-3 rounded-control border border-border flex items-center gap-2">
            <AlertCircle size={16} className="text-danger" />
            <span className="text-xs text-ink-muted">
              This action will remove the file from your workspace library.
            </span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Yes, Delete File
            </Button>
          </div>
        </div>
      </Modal>

      {/* Asset Details Preview Modal */}
      <Modal
        open={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false)
          setPreviewAsset(null)
        }}
        title="Asset Details"
      >
        {previewAsset && (
          <div className="space-y-4">
            <div className="aspect-video bg-canvas rounded-card flex items-center justify-center overflow-hidden border border-border relative">
              {previewAsset.type === 'image' && previewAsset.url ? (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="w-full h-full object-contain"
                />
              ) : previewAsset.type === 'video' && previewAsset.url ? (
                <video
                  src={previewAsset.url}
                  controls
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <div className="text-center">
                  {getAssetTypeIcon(previewAsset.type)}
                  <p className="text-xs text-ink-muted mt-2 capitalize font-semibold">
                    {previewAsset.type} File
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-semibold text-ink-muted">File Name</span>
                <span className="text-xs font-bold text-ink truncate max-w-[200px]" title={previewAsset.name}>
                  {previewAsset.name}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-semibold text-ink-muted">Category</span>
                <Badge tone="primary" className="text-xs">
                  {previewAsset.category}
                </Badge>
              </div>
              {previewAsset.description && (
                <div className="border-b border-border pb-2">
                  <span className="text-xs font-semibold text-ink-muted block mb-1">Description</span>
                  <p className="text-xs text-ink bg-canvas p-2 rounded-control border border-border">
                    {previewAsset.description}
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-semibold text-ink-muted">Size</span>
                <span className="text-xs font-semibold text-ink">{previewAsset.size}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-xs font-semibold text-ink-muted">Status</span>
                <span>{getStatusBadge(previewAsset.status)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => handleDownloadSim(previewAsset)}
              >
                <Download size={14} /> Download
              </Button>
              <Button
                variant="destructive"
                className="flex items-center gap-1"
                onClick={() => triggerDelete(previewAsset)}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
