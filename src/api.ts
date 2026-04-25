export type MediaType = 'video' | 'audio' | 'combined'

export interface MediaFormat {
    format_id: string
    type: MediaType
    container?: string | null
    resolution?: string | null
    fps?: number | null
    bitrate?: string | null
    filesize_est?: number | null
}

export interface AnalyzeResponse {
    id: string
    title: string
    duration: number
    thumbnail?: string | null
    formats: MediaFormat[]
}

export interface FormatResponse {
    video_id: string
    formats: MediaFormat[]
}

export interface JobResponse {
    id: string
    kind: string
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
    progress_bytes: number
    total_bytes: number
    detail?: string | null
    result?: Record<string, unknown> | null
    created_at: string
    updated_at: string
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function buildUrl(path: string): string {
    return `${API_BASE}${path}`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response
    try {
        response = await fetch(buildUrl(path), {
            headers: {
                'Content-Type': 'application/json',
                ...(init.headers || {}),
            },
            ...init,
        })
    } catch {
        throw new Error(`Cannot reach backend at ${API_BASE}`)
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const detail = body.detail || body.message || response.statusText || `HTTP ${response.status}`
        throw new Error(detail)
    }

    return response.json() as Promise<T>
}

function filenameFromDisposition(headerValue: string | null): string | null {
    if (!headerValue) return null
    const match = /filename\*?=(?:UTF-8''|\")?([^;\"]+)/i.exec(headerValue)
    if (!match) return null
    return decodeURIComponent(match[1].replace(/\"/g, '').trim())
}

function humanFilename(title: string, formatId: string, contentType: string | null): string {
    const ext = contentType?.includes('mp4') ? 'mp4' : contentType?.includes('webm') ? 'webm' : 'bin'
    return `${title.slice(0, 48).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'media'}-${formatId}.${ext}`
}

export const api = {
    baseUrl: API_BASE,
    analyze: (url: string, signal?: AbortSignal) =>
        request<AnalyzeResponse>('/analyze', {
            method: 'POST',
            body: JSON.stringify({ url }),
            signal,
        }),
    formats: (videoId: string, signal?: AbortSignal) => request<FormatResponse>(`/formats/${encodeURIComponent(videoId)}`, { signal }),
    job: (jobId: string, signal?: AbortSignal) => request<JobResponse>(`/jobs/${encodeURIComponent(jobId)}`, { signal }),
    downloadUrl: (videoId: string, formatId: string, merge: boolean) =>
        buildUrl(`/download?video_id=${encodeURIComponent(videoId)}&format_id=${encodeURIComponent(formatId)}&merge=${merge ? 'true' : 'false'}`),
    streamDownload: async ({
        videoId,
        formatId,
        merge,
        signal,
        onProgress,
    }: {
        videoId: string
        formatId: string
        merge: boolean
        signal?: AbortSignal
        onProgress?: (received: number, total: number | null) => void
    }) => {
        const response = await fetch(api.downloadUrl(videoId, formatId, merge), { signal })
        if (!response.ok || !response.body) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body.detail || `Download failed (${response.status})`)
        }

        const jobId = response.headers.get('x-job-id') || ''
        const total = Number(response.headers.get('content-length') || 0) || null
        const contentType = response.headers.get('content-type')
        const disposition = filenameFromDisposition(response.headers.get('content-disposition'))
        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let received = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) {
                chunks.push(value)
                received += value.length
                onProgress?.(received, total)
            }
        }

        const blob = new Blob(chunks as BlobPart[], { type: contentType || 'application/octet-stream' })
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = disposition || humanFilename(videoId, formatId, contentType)
        anchor.rel = 'noreferrer'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)

        return { jobId, received, total, filename: disposition || null }
    },
    openStream: (videoId: string, formatId: string, merge: boolean) => {
        window.open(api.downloadUrl(videoId, formatId, merge), '_blank', 'noopener,noreferrer')
    },
}

export function prettyBytes(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return 'Unknown size'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / 1024 ** index
    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

export function prettyDuration(seconds: number | null | undefined): string {
    if (!seconds || seconds <= 0) return 'Unknown duration'
    const rounded = Math.round(seconds)
    const hours = Math.floor(rounded / 3600)
    const minutes = Math.floor((rounded % 3600) / 60)
    const remaining = rounded % 60
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
    return `${minutes}:${String(remaining).padStart(2, '0')}`
}