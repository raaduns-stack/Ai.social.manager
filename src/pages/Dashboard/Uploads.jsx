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
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react'

export default function Uploads() {
  const fileInputRef = useRef(null)

  // Asset Library State
  const [assets, setAssets] = useState([
    {
      id: 1,
      name: 'Product_Reveal_Draft.mp4',
      type: 'video',
      size: '12.4 MB',
      sizeBytes: 12400000,
      date: 'Oct 25',
      timestamp: 1698192000000,
      status: 'Uploading',
      progress: 65,
    },
    {
      id: 2,
      name: 'Office_Lifestyle_01.jpg',
      type: 'image',
      size: '2.1 MB',
      sizeBytes: 2100000,
      date: 'Oct 24',
      timestamp: 1698105600000,
      status: 'Approved',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1krZOfiC6QCAloGneiRc7-QX9-b2GDw_jJp4PPpYJs_58goOSnxRVa75QfDvZwx2JZUdtNuo3fxSKFyTaBNfrJ_cWUPIBaPiXD_Cr1NoU3nRDQFk80hmL--8tzLtcdwq9V7g-eZgMJtTK0yhskZWUetaQlC-IW5GvXOSYiBif-qTMjbIcY5-jhKGdZao7dfkgCyuplIfGiksE2DvY8MzsblqLGh5o9KPfoxuQPuZ41wmO-75vJ_CZjdQ7klTl0lDfxPFRjADYw2Ch',
    },
    {
      id: 3,
      name: 'Q4_Marketing_Strategy.pdf',
      type: 'document',
      size: '840 KB',
      sizeBytes: 860160,
      date: 'Oct 23',
      timestamp: 1698019200000,
      status: 'Under Review',
    },
    {
      id: 4,
      name: 'Internal_Guidelines_v2.docx',
      type: 'document',
      size: '1.2 MB',
      sizeBytes: 1258291,
      date: 'Oct 21',
      timestamp: 1697846400000,
      status: 'Declined',
    },
    {
      id: 5,
      name: 'Brand_Intro_v1.mp4',
      type: 'video',
      size: '45.8 MB',
      sizeBytes: 48024576,
      date: 'Oct 20',
      timestamp: 1697760000000,
      status: 'Received',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3Jimuu-B4LWppBlMkDFBuoUyVtoA4p-ilkzJM6JTRQUbElC4T5hs8VRN8dJzHeXZfMSRpLJm3xNR17lWyCT-cvSfVyPYiuD6sEcOdaaHuITbxMo9VeOggj-EMjwY214lPqnDHptGeUqELk6lHZ5yBCRRSEuNm_K8HjIy1bTJh8RoAOWgebkylgR4CFuVOD_D7g0ql5u2BUcXfEvq-d4Gx1Ah8FBF0gpPVZ8g2gqx5_toU2Gsj5MQXi10Tyw9u_kTolEz-X3vQTRHT',
    },
    {
      id: 6,
      name: 'Gadget_Shot_09.png',
      type: 'image',
      size: '4.5 MB',
      sizeBytes: 4718592,
      date: 'Oct 19',
      timestamp: 1697673600000,
      status: 'Approved',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvm4_lUKgShZOcAaZCWCupG_45ua72xn4vgSeNwVuGlS7EvbjlWP8IthsiXuOIwaflCmh2ZC7oT6xItPk1tvzmgUpBbL9bH0deKnee1wEiPfY-YcgBwUwq12DaQOIo-090BGO4AEHCxwWX3mrnQcSQ6iU86CNWduv5N8ET61mUfZ5W8zh1JjMWNcFLEXfrurRKk6Qp97Welcf7j-jyF_bPkhIYTM4i6zgipBZoktlAyoHdE9_fxbummz4-HGQor0rQvv1IwgN8R6Rn',
    },
    {
      id: 7,
      name: 'Legal_Agreement_Draft.docx',
      type: 'document',
      size: '420 KB',
      sizeBytes: 430080,
      date: 'Oct 26',
      timestamp: 1698278400000,
      status: 'Processing',
      progress: 30,
    },
  ])

  // UI Interactive States
  const [selectedTab, setSelectedTab] = useState('All') // 'All' | 'Images' | 'Videos' | 'Documents'
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
            const nextProgress = asset.progress + Math.floor(Math.random() * 8) + 2
            if (nextProgress >= 100) {
              return {
                ...asset,
                progress: 100,
                status: asset.status === 'Uploading' ? 'Received' : 'Approved',
              }
            }
            return { ...asset, progress: nextProgress }
          }
          return asset
        })
      )
    }, 1500)

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
      handleFilesSelected(files)
    }
  }

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFilesSelected(files)
    }
  }

  const handleFilesSelected = (files) => {
    Array.from(files).forEach((file) => {
      let type = 'document'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'

      const newId = Date.now() + Math.random()
      const newAsset = {
        id: newId,
        name: file.name,
        type: type,
        size:
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
        sizeBytes: file.size,
        date: 'Just now',
        timestamp: Date.now(),
        status: 'Uploading',
        progress: 0,
        // Fallbacks for display
        url:
          type === 'image'
            ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
            : undefined,
      }

      setAssets((prev) => [newAsset, ...prev])
    })
  }

  // Create new folder action
  const handleCreateFolder = (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    alert(`Mock folder "${newFolderName}" created successfully!`)
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

  // Filtering + Searching logic
  const filteredAssets = assets
    .filter((asset) => {
      // Type Tab filter
      if (selectedTab === 'Images' && asset.type !== 'image') return false
      if (selectedTab === 'Videos' && asset.type !== 'video') return false
      if (selectedTab === 'Documents' && asset.type !== 'document') return false

      // Search matching name
      return asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      // Sorting
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
      case 'Under Review':
        return (
          <Badge tone="warning" className="text-[10px] font-bold uppercase tracking-wider">
            Under Review
          </Badge>
        )
      case 'Declined':
        return (
          <Badge tone="danger" className="text-[10px] font-bold uppercase tracking-wider">
            Declined
          </Badge>
        )
      case 'Received':
        return (
          <Badge tone="primary" className="text-[10px] font-bold uppercase tracking-wider">
            Received
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
      {/* Hidden input for local file selection */}
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
        title="Upload Assets"
        description="Manage your digital library and document workflow"
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-1.5 font-medium"
              onClick={() => alert('Syncing with connected social channels and cloud drivers...')}
            >
              <RefreshCw size={18} />
              Sync Cloud
            </Button>
            <Button
              variant="primary"
              className="flex items-center gap-1.5 font-medium"
              onClick={() => setIsFolderModalOpen(true)}
            >
              <Plus size={18} />
              New Folder
            </Button>
          </div>
        }
      />

      {/* Interactive Upload/Drop Zone */}
      <section
        id="drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className="relative group cursor-pointer"
      >
        <div
          className={`border-2 border-dashed rounded-card p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${isDragging
              ? 'border-primary bg-primary-50/50 scale-[1.01]'
              : 'border-border bg-surface hover:border-primary hover:bg-canvas'
            }`}
        >
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 transition-transform duration-300 group-hover:scale-110">
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-ink">Drag &amp; drop files here</p>
            <p className="text-sm text-ink-muted mt-1">Or click to browse your local storage</p>
          </div>
          <div className="flex gap-3 mt-1">
            <Button variant="primary" size="sm" type="button">
              Select Files
            </Button>
          </div>
          <div className="flex gap-6 text-xs text-ink-muted font-medium mt-2">
            <div className="flex items-center gap-1">
              <ImageIcon size={14} className="text-primary" />
              JPG, PNG, WEBP
            </div>
            <div className="flex items-center gap-1">
              <Film size={14} className="text-accent" />
              MP4, MOV
            </div>
            <div className="flex items-center gap-1">
              <FileText size={14} className="text-danger" />
              PDF, DOCX
            </div>
          </div>
        </div>
      </section>

      {/* Filter / Search Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Categories Tab Selector */}
        <div className="flex flex-wrap gap-2">
          {['All Assets', 'Images', 'Videos', 'Documents'].map((tab) => {
            const shortName = tab === 'All Assets' ? 'All' : tab
            const isActive = selectedTab === shortName
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(shortName)}
                className={`px-4 py-2 text-sm font-medium rounded-control transition-all ${isActive
                    ? 'text-primary-700 bg-primary-50 border-b-2 border-primary-600 font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-canvas'
                  }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Sort, Search, Layout Controllers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar inside header filter */}
          <div className="relative w-full sm:w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full h-10 rounded-control border border-border bg-surface pl-9 pr-4 text-xs text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="h-10 rounded-control border border-border bg-surface px-3 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Newest">Sort by: Newest</option>
            <option value="Largest">Sort by: Largest</option>
            <option value="Name">Sort by: Name</option>
          </select>

          <div className="flex border border-border rounded-control overflow-hidden bg-surface">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-canvas text-primary' : 'text-ink-muted hover:text-ink'
                }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-canvas text-primary' : 'text-ink-muted hover:text-ink'
                }`}
              title="List View"
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs List Mode */}
      {filteredAssets.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <FolderOpen size={48} className="text-ink-muted mb-4 stroke-1" />
          <h4 className="text-base font-semibold text-ink">No assets found</h4>
          <p className="text-sm text-ink-muted mt-1 max-w-sm">
            We couldn't find any uploaded file matching "{searchQuery}" in category "{selectedTab}".
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSearchQuery('')
              setSelectedTab('All')
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className="overflow-hidden group hover:shadow-hover border border-border flex flex-col justify-between"
            >
              {/* Media Thumbnail Container */}
              <div className="aspect-square bg-canvas flex items-center justify-center relative overflow-hidden">
                {asset.status === 'Uploading' || asset.status === 'Processing' ? (
                  <div className="absolute inset-0 bg-ink/5 backdrop-blur-[1px] flex items-center justify-center">
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

                {/* Grid Hover Lightbox Actions (only for finished files) */}
                {asset.status !== 'Uploading' && asset.status !== 'Processing' && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-surface/90 backdrop-blur-md p-1 rounded-control shadow-soft border border-border flex gap-1">
                      <button
                        onClick={() => triggerPreview(asset)}
                        className="p-1 rounded text-ink-muted hover:text-primary hover:bg-canvas"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadSim(asset)}
                        className="p-1 rounded text-ink-muted hover:text-primary hover:bg-canvas"
                        title="Download file"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => triggerDelete(asset)}
                        className="p-1 rounded text-danger hover:bg-red-50"
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Asset Meta Info */}
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

                    {/* Popover Action Menu */}
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

                {asset.status === 'Uploading' || asset.status === 'Processing' ? (
                  <div className="w-full bg-canvas h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${asset.progress}%` }}
                    ></div>
                  </div>
                ) : null}

                <div className="flex justify-between items-center text-xs text-ink-muted">
                  <span>{asset.size}</span>
                  {getStatusBadge(asset.status)}
                </div>
              </div>
            </Card>
          ))}

          {/* Dotted Quick Upload Card */}
          <Card
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center p-6 gap-2 hover:bg-canvas transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center text-ink-muted group-hover:bg-primary-50 group-hover:text-primary transition-colors">
              <Plus size={24} />
            </div>
            <p className="text-sm font-semibold text-ink-muted group-hover:text-primary">Add More Files</p>
          </Card>
        </div>
      ) : (
        /* Alternative Table List Layout */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border">
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-canvas transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-ink flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-canvas flex items-center justify-center shrink-0">
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
                    <td className="px-6 py-4 text-sm text-ink-muted capitalize">{asset.type}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{asset.size}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{asset.date}</td>
                    <td className="px-6 py-4">
                      {asset.status === 'Uploading' || asset.status === 'Processing' ? (
                        <div className="flex items-center gap-2">
                          {getStatusBadge(asset.status)}
                          <span className="text-xs text-ink-muted">{asset.progress}%</span>
                        </div>
                      ) : (
                        getStatusBadge(asset.status)
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 text-ink-muted">
                        <button
                          onClick={() => triggerPreview(asset)}
                          className="hover:text-primary transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadSim(asset)}
                          className="hover:text-primary transition-colors cursor-pointer"
                          title="Download"
                          disabled={asset.status === 'Uploading' || asset.status === 'Processing'}
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
            placeholder="e.g. Marketing Campaign Q4"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFolderModalOpen(false)}
            >
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
            Are you sure you want to permanently delete <strong>{assetToDelete?.name}</strong> from your media library?
          </p>
          <div className="bg-canvas p-3 rounded-control border border-border flex items-center gap-2">
            <AlertCircle size={16} className="text-danger" />
            <span className="text-xs text-ink-muted">
              This action cannot be undone. Scheduled posts using this asset might fail to sync.
            </span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Yes, Delete File
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lightbox / Asset Details Preview Modal */}
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
                <span className="text-xs font-semibold text-ink-muted">Size</span>
                <span className="text-xs font-semibold text-ink">{previewAsset.size}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-semibold text-ink-muted">Upload Date</span>
                <span className="text-xs text-ink font-semibold">{previewAsset.date}</span>
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
                disabled={previewAsset.status === 'Uploading' || previewAsset.status === 'Processing'}
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
