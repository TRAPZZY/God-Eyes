import { useState } from 'react'
import { Film, FileText, Download, Clock, Settings, CheckCircle, AlertCircle, Loader, Printer } from 'lucide-react'
import { timelapseAPI, reportAPI } from '../../services/api'

export default function Export() {
  const [activeTab, setActiveTab] = useState<'timelapse' | 'report'>('timelapse')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<Record<string, string | number | boolean | null> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [timelapseConfig, setTimelapseConfig] = useState({
    location_id: '',
    style: 'gif',
    fps: 5,
    duration_days: 30,
  })

  const [reportConfig, setReportConfig] = useState({
    location_id: '',
    format: 'html',
    date_range: '',
  })

  const handleGenerateTimelapse = async () => {
    if (!timelapseConfig.location_id) {
      setError('Please select a location')
      return
    }
    setGenerating(true)
    setError(null)
    setResult(null)
    try {
      const res = await timelapseAPI.generate({
        location_id: timelapseConfig.location_id,
        style: timelapseConfig.style,
        fps: timelapseConfig.fps,
        duration_days: timelapseConfig.duration_days,
      })
      setResult(res.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate time-lapse'
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!reportConfig.location_id) {
      setError('Please select a location')
      return
    }
    setGenerating(true)
    setError(null)
    setResult(null)
    try {
      const res = await reportAPI.generate({
        location_id: reportConfig.location_id,
        format: reportConfig.format,
        date_range: reportConfig.date_range || undefined,
      })
      setResult(res.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report'
      setError(message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export Center</h1>
        <p className="text-gray-400">Generate time-lapses and intelligence reports</p>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        <TabButton
          active={activeTab === 'timelapse'}
          onClick={() => setActiveTab('timelapse')}
          icon={<Film className="w-4 h-4" />}
          label="Time-lapse"
        />
        <TabButton
          active={activeTab === 'report'}
          onClick={() => setActiveTab('report')}
          icon={<FileText className="w-4 h-4" />}
          label="Reports"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Generation complete</p>
            <p className="text-sm text-gray-400">
              {result.format ? `Format: ${result.format}` : `${result.frame_count || 0} frames at ${result.fps || 0} fps`}
            </p>
            <div className="flex gap-3 mt-2">
              {result.url && (
                <a
                  href={result.url as string}
                  className="text-blue-400 hover:underline text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  View result
                </a>
              )}
              {result.download_url && (
                <a
                  href={result.download_url as string}
                  className="text-blue-400 hover:underline text-sm flex items-center gap-1"
                  download
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              )}
              {result.format === 'html' && result.file_path && (
                <button
                  onClick={() => {
                    const w = window.open('', '_blank')
                    if (w) {
                      fetch(result.file_path as string)
                        .then(r => r.text())
                        .then(html => {
                          w.document.write(html)
                          w.document.close()
                          w.onload = () => w.print()
                        })
                    }
                  }}
                  className="text-blue-400 hover:underline text-sm flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  Print Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timelapse' && (
        <div className="bg-card rounded-xl border border-gray-700 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Time-lapse Generator</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location ID</label>
              <input
                type="text"
                value={timelapseConfig.location_id}
                onChange={(e) => setTimelapseConfig({ ...timelapseConfig, location_id: e.target.value })}
                placeholder="Enter location UUID"
                className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
              <select
                value={timelapseConfig.style}
                onChange={(e) => setTimelapseConfig({ ...timelapseConfig, style: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gif">Animated GIF</option>
                <option value="mp4">MP4 (falls back to GIF)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                FPS: {timelapseConfig.fps}
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={timelapseConfig.fps}
                onChange={(e) => setTimelapseConfig({ ...timelapseConfig, fps: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Duration: {timelapseConfig.duration_days} days
              </label>
              <input
                type="range"
                min={1}
                max={365}
                value={timelapseConfig.duration_days}
                onChange={(e) => setTimelapseConfig({ ...timelapseConfig, duration_days: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerateTimelapse}
              disabled={generating}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  Generate Time-lapse
                </>
              )}
            </button>
            {result && result.download_url && (
              <a
                href={result.download_url as string}
                download
                className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download GIF
              </a>
            )}
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="bg-card rounded-xl border border-gray-700 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Intelligence Report</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location ID</label>
              <input
                type="text"
                value={reportConfig.location_id}
                onChange={(e) => setReportConfig({ ...reportConfig, location_id: e.target.value })}
                placeholder="Enter location UUID"
                className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Format</label>
              <select
                value={reportConfig.format}
                onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="html">HTML</option>
                <option value="pdf">PDF (requires weasyprint)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Date Range (optional)
              </label>
              <input
                type="text"
                value={reportConfig.date_range}
                onChange={(e) => setReportConfig({ ...reportConfig, date_range: e.target.value })}
                placeholder="2024-01-01:2024-12-31"
                className="w-full px-3 py-2 bg-input border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
            {result && result.format === 'html' && result.file_path && (
              <button
                onClick={() => {
                  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                  const w = window.open(`${API_URL}${result.file_path as string}`, '_blank')
                  if (w) {
                    setTimeout(() => w.print(), 1000)
                  }
                }}
                className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-400 hover:text-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
