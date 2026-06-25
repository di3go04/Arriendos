'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { FileText, Send, MessageSquare, Upload, Loader2, Bot, X, FileUp, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ContractSummary {
  id: string
  title: string
  property: string
  tenant: string | null
  monthlyRent: number
  status: string
  date: string
}

interface UploadedDoc {
  id: string
  name: string
  status: 'processing' | 'completed' | 'error'
  extractedData?: Record<string, string>
  error?: string
}

export default function DocumentsPage() {
  const t = useTranslations('documents_page')
  const { toast } = useToast()
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [contractsLoading, setContractsLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<ContractSummary | null>(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/contracts')
      .then(res => res.ok ? res.json() : [])
      .then((response: any) => {
        const list: any[] = Array.isArray(response) ? response : (response.data || response.contracts || [])
        const mapped: ContractSummary[] = list.map((c: any) => ({
          id: c.id,
          title: c.title || `${t('contract_prefix')} #${c.id.slice(0, 8)}`,
          property: c.property?.title || c.propertyName || t('no_property'),
          tenant: c.tenant?.name || c.tenantName || null,
          monthlyRent: c.monthlyRent || 0,
          status: c.status || 'BORRADOR',
          date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-',
        }))
        setContracts(mapped)
      })
      .catch(() => setContracts([]))
      .finally(() => setContractsLoading(false))
  }, [t])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleAsk = async () => {
    if (!question.trim() || loading || !selectedContract) return

    const userMessage: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/documents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: selectedContract.id, question }),
      })

      if (!res.ok) throw new Error(t('error_query'))

      const data = await res.json()
      const answer = data.data?.answer || t('error_no_answer')

      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_connection'))
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const newDocs: UploadedDoc[] = []

    for (const file of Array.from(files)) {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const doc: UploadedDoc = { id: docId, name: file.name, status: 'processing' }
      newDocs.push(doc)
      setUploadedDocs(prev => [...prev, doc])

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', file.type.includes('pdf') ? 'contract' : 'document')

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error(t('error_processing'))

        const data = await res.json()
        setUploadedDocs(prev =>
          prev.map(d => d.id === docId
            ? { ...d, status: 'completed', extractedData: data.extractedData || { 'Nombre': file.name, 'Estado': 'Procesado' } }
            : d
          )
        )
        toast({ type: 'success', message: `${file.name} procesado correctamente` })
      } catch (err) {
        setUploadedDocs(prev =>
          prev.map(d => d.id === docId
            ? { ...d, status: 'error', error: err instanceof Error ? err.message : 'Error de procesamiento' }
            : d
          )
        )
        toast({ type: 'error', message: `Error al procesar ${file.name}` })
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract list */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('contracts_title')}
              </h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {contractsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : contracts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p>{t('no_contracts')}</p>
                </div>
              ) : (
                contracts.map(contract => (
                  <button
                    key={contract.id}
                    onClick={() => {
                      setSelectedContract(contract)
                      setMessages([])
                      setError(null)
                    }}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedContract?.id === contract.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{contract.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{contract.property}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">{contract.tenant || t('no_tenant')}</span>
                      <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                        contract.status === 'ACTIVO' ? 'bg-success/10 text-success' :
                        contract.status === 'PENDIENTE_FIRMA' ? 'bg-amber-50 text-amber-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))
              )}

              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  className="w-full gap-2 mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? t('uploading') : t('upload_pdf')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded documents */}
          {uploadedDocs.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" />
                  {t('uploaded_docs')}
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {uploadedDocs.map(doc => (
                  <div key={doc.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      {doc.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {doc.status === 'completed' && <CheckCircle className="h-4 w-4 text-success" />}
                      {doc.status === 'error' && <AlertCircle className="h-4 w-4 text-error" />}
                      <span className="font-medium truncate flex-1">{doc.name}</span>
                      <span className={`text-xs ${
                        doc.status === 'completed' ? 'text-success' :
                        doc.status === 'error' ? 'text-error' :
                        'text-primary'
                      }`}>
                        {doc.status === 'completed' ? t('status_completed') :
                         doc.status === 'error' ? t('status_error') :
                         t('status_processing')}
                      </span>
                    </div>
                    {doc.extractedData && (
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {Object.entries(doc.extractedData).map(([k, v]) => (
                          <div key={k} className="flex gap-1">
                            <span className="font-medium">{k}:</span>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {doc.error && (
                      <p className="mt-1 text-xs text-error">{doc.error}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{t('assistant_title')}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedContract
                      ? `${t('consulting')}: ${selectedContract.title}`
                      : t('select_contract_start')}
                  </p>
                </div>
                {selectedContract && (
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedContract(null); setMessages([]); setError(null) }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!selectedContract && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">{t('select_contract_start')}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                      {t('select_contract')}
                    </p>
                  </div>
                )}

                {selectedContract && messages.length === 0 && !error && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">{t('ask_question')}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      {t('example_question')}
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                      }`}>
                        {msg.role === 'assistant' ? 'AI' : 'U'}
                      </div>
                      <div className={`rounded-lg px-4 py-2.5 text-sm max-w-[80%] leading-relaxed ${
                        msg.role === 'assistant'
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-white'
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-lg bg-muted px-4 py-2.5">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="rounded-lg bg-error/5 border border-error/20 p-3 text-sm text-error">
                    {error}
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="border-t p-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleAsk() }}
                  className="flex gap-2"
                >
                  <input
                    placeholder={selectedContract ? t('input_active') : t('input_select_first')}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    disabled={!selectedContract}
                  />
                  <Button type="submit" disabled={!question.trim() || loading || !selectedContract}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('assistant_disclaimer')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
