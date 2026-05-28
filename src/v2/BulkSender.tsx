import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Users, Settings, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Contact {
  id: string;
  pushName?: string;
  name?: string;
  number: string;
  status?: 'pending' | 'sent' | 'error';
}

interface LogEntry {
  id: number;
  text: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
}

interface BulkSenderProps {
  instanceName: string;
  targetContacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
}

export default function BulkSender({ instanceName, targetContacts, onUpdateContacts }: BulkSenderProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPausedUI, setIsPausedUI] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { token } = useAuth();
  
  // Anti-ban configs
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(45);

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const baseUrl = import.meta.env.VITE_EVOLUTION_URL;
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, status: 'pending' | 'success' | 'error') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, status, timestamp: new Date() }]);
  };

  const cleanUrl = (url: string) => {
    let clean = url.trim().replace(/\/$/, '');
    if (!clean.startsWith('http')) clean = 'https://' + clean;
    return clean;
  };

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'x-target-url': cleanUrl(baseUrl),
      'Authorization': `Bearer ${token}`
    };
  };

  const startBroadcast = async () => {
    if (targetContacts.length === 0) {
      alert('A lista de disparo está vazia.');
      return;
    }
    if (!message.trim()) {
      alert('Digite uma mensagem para enviar.');
      return;
    }

    setIsSending(true);
    setIsPausedUI(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;
    addLog(`Iniciando disparo para ${targetContacts.length} contatos...`, 'pending');

    let sentCount = 0;
    const currentContacts = [...targetContacts];

    for (let i = 0; i < currentContacts.length; i++) {
      while (isPausedRef.current && !isCancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (isCancelledRef.current) {
        addLog('Disparo cancelado pelo usuário.', 'error');
        break;
      }

      const contact = currentContacts[i];
      currentContacts[i] = { ...contact, status: 'pending' };
      onUpdateContacts([...currentContacts]);
      
      try {
        const personalizedMessage = message.replace(/{nome}/gi, contact.name || contact.pushName || 'cliente');

        let targetJid = contact.id;
        if (!targetJid.includes('@')) {
           if (contact.number && /^\\d+$/.test(contact.number)) {
              targetJid = contact.number + '@s.whatsapp.net';
           } else {
              targetJid = targetJid + '@s.whatsapp.net';
           }
        }

        // --- SIMULAÇÃO DE HUMANO: DIGITANDO ---
        const typingDelayMs = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
        const typingSeconds = (typingDelayMs / 1000).toFixed(1);
        
        addLog(`Simulando digitação para ${contact.name || contact.number} (${typingSeconds}s)...`, 'pending');
        
        try {
            await fetch(`/api-proxy/chat/sendPresence/${instanceName}`, {
               method: 'POST',
               headers: getHeaders(),
               body: JSON.stringify({ number: targetJid, presence: 'composing', delay: typingDelayMs })
            });
        } catch(e) { console.warn("Erro ao enviar presence", e); }
        
        let typingWaited = 0;
        while(typingWaited < typingDelayMs) {
           if (isCancelledRef.current) break;
           await new Promise(resolve => setTimeout(resolve, 500));
           typingWaited += 500;
        }
        
        if (isCancelledRef.current) {
            addLog('Disparo cancelado pelo usuário.', 'error');
            break;
        }

        // --- ENVIO DA MENSAGEM ---
        const endpoint = `/message/sendText/${instanceName}`;
        const body = { number: targetJid, text: personalizedMessage };
        const response = await fetch(`/api-proxy${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (response.ok) {
           currentContacts[i] = { ...contact, status: 'sent' };
           sentCount++;
           addLog(`Mensagem enviada para ${contact.name || contact.number}`, 'success');
        } else {
           const errData = await response.text();
           currentContacts[i] = { ...contact, status: 'error' };
           addLog(`Erro ao enviar para ${contact.number}: ${errData.substring(0, 50)}`, 'error');
        }
      } catch (error: any) {
        currentContacts[i] = { ...contact, status: 'error' };
        addLog(`Falha de conexão com ${contact.number}: ${error.message}`, 'error');
      }
      
      onUpdateContacts([...currentContacts]);

      // --- DELAY VARIÁVEL ENTRE MENSAGENS ---
      if (i < currentContacts.length - 1) {
        if (isCancelledRef.current) {
           addLog('Disparo cancelado pelo usuário.', 'error');
           break;
        }
        const delayMs = Math.floor(Math.random() * ((maxDelay * 1000) - (minDelay * 1000) + 1)) + (minDelay * 1000);
        const delaySeconds = (delayMs / 1000).toFixed(1);
        addLog(`Aguardando ${delaySeconds}s para evitar bloqueio (Anti-Ban)...`, 'pending');
        
        let waited = 0;
        while (waited < delayMs) {
          if (isCancelledRef.current) break;
          while (isPausedRef.current && !isCancelledRef.current) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          if (isCancelledRef.current) break;
          await new Promise(resolve => setTimeout(resolve, 500));
          waited += 500;
        }
        if (isCancelledRef.current) {
           addLog('Disparo cancelado pelo usuário.', 'error');
           break;
        }
      }
    }

    addLog(`Disparo concluído! ${sentCount} mensagens enviadas.`, 'success');
    setIsSending(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <MessageSquare size={18} className="text-blue-600" />
          Disparador em Lote
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={16} />
          {targetContacts.length} contatos alvo
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Anti-ban settings */}
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-800 font-medium mb-3">
            <Settings size={16} />
            Proteção Anti-Banimento (Delay Variável)
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-orange-600 block mb-1">Mínimo (seg)</label>
              <input type="number" value={minDelay} onChange={e => setMinDelay(Number(e.target.value))} className="w-20 px-2 py-1 rounded border-orange-200 border text-sm" />
            </div>
            <div>
              <label className="text-xs text-orange-600 block mb-1">Máximo (seg)</label>
              <input type="number" value={maxDelay} onChange={e => setMaxDelay(Number(e.target.value))} className="w-20 px-2 py-1 rounded border-orange-200 border text-sm" />
            </div>
            <div className="text-xs text-orange-600/80 max-w-[200px] leading-tight">
              O sistema aguardará um tempo aleatório entre {minDelay} e {maxDelay}s após cada mensagem.
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div className="flex flex-col flex-1">
          <div className="flex justify-between items-end mb-2">
            <label className="text-sm font-medium text-gray-700">Mensagem</label>
            <button 
              onClick={() => setMessage(prev => prev + '{nome}')}
              className="text-xs text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              + Inserir {'{nome}'}
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Olá {nome}, temos uma novidade para você!"
            className="w-full flex-1 min-h-[120px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
          />
        </div>

        {/* Logs */}
        <div className="h-40 bg-gray-900 rounded-lg p-3 overflow-y-auto font-mono text-xs flex flex-col gap-1">
          {logs.length === 0 && <div className="text-gray-500 italic">Logs do sistema aparecerão aqui...</div>}
          {logs.map(log => (
            <div key={log.id} className={`
              ${log.status === 'success' ? 'text-green-400' : ''}
              ${log.status === 'error' ? 'text-red-400' : ''}
              ${log.status === 'pending' ? 'text-blue-300' : ''}
            `}>
              <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span> {log.text}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
        {!isSending ? (
          <button
            onClick={startBroadcast}
            disabled={targetContacts.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            <Play size={18} />
            Iniciar Disparo
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                isPausedRef.current = !isPausedRef.current;
                setIsPausedUI(isPausedRef.current);
                addLog(isPausedRef.current ? 'Disparo pausado.' : 'Disparo retomado.', 'pending');
              }}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {isPausedUI ? <Play size={18} /> : <Pause size={18} />}
              {isPausedUI ? 'Retomar' : 'Pausar'}
            </button>
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja cancelar o disparo?')) {
                  isCancelledRef.current = true;
                  addLog('Cancelando...', 'error');
                }
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              <Square size={18} />
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
