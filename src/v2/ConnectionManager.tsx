import { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, Loader2, LogOut, ChevronDown } from 'lucide-react';

interface ConnectionManagerProps {
  onConnect?: (instanceName: string) => void;
  onConnected?: (instanceName: string) => void;
  onDisconnect?: () => void;
  connectedInstance?: string | null;
}

import { useAuth } from '../contexts/AuthContext';

export default function ConnectionManager({ onConnect, onConnected, onDisconnect, connectedInstance }: ConnectionManagerProps) {
  const { user } = useAuth();
  const instances = user?.instances || [];
  
  const [instanceName, setInstanceName] = useState(connectedInstance || instances[0] || '');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'creating' | 'waiting_qr' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const baseUrl = import.meta.env.VITE_EVOLUTION_URL;
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

  useEffect(() => {
    if (connectedInstance) {
      setStatus('connected');
      setInstanceName(connectedInstance);
    }
  }, [connectedInstance]);

  const cleanUrl = (url: string) => {
    let clean = url?.trim().replace(/\/$/, '') || '';
    if (clean && !clean.startsWith('http')) clean = 'https://' + clean;
    return clean;
  };

  const createInstance = async () => {
    if (!instanceName.trim()) {
      setErrorMsg('Digite um nome para a conexão (ex: Nome da sua Empresa).');
      return;
    }
    if (!baseUrl || !apiKey) {
      setErrorMsg('Variáveis de ambiente (VITE_EVOLUTION_URL ou API_KEY) não configuradas no seu .env');
      return;
    }

    setStatus('creating');
    setErrorMsg('');

    try {
      const endpoint = `/instance/create`;
      const targetUrl = cleanUrl(baseUrl);

      // Check current connection state
      try {
        const checkRes = await fetch(`/api-proxy/instance/connectionState/${instanceName.trim()}`, {
          method: 'GET',
          headers: { 'apikey': apiKey, 'x-target-url': targetUrl }
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData?.instance?.state === 'open' || checkData?.instance?.state === 'connecting') {
            const confirmOverwrite = window.confirm('⚠️ Esta instância já está conectada ou conectando ao WhatsApp!\n\nTem certeza que deseja gerar um novo QR Code e refazer a conexão?\nIsso vai desconectar o aparelho atual.');
            if (!confirmOverwrite) {
              setStatus('idle');
              if (checkData?.instance?.state === 'open') {
                setStatus('connected');
                if (onConnected) onConnected(instanceName.trim());
              }
              return;
            }
          }
        }
      } catch (e) {
        // ignore check errors and proceed to create
      }
      
      const response = await fetch(`/api-proxy${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'x-target-url': targetUrl
        },
        body: JSON.stringify({
          instanceName: instanceName.trim(),
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (errText.includes('already in use')) {
          startPolling(instanceName.trim());
          return;
        }
        throw new Error(`Erro ao criar instância: ${errText}`);
      }

      const data = await response.json();
      
      if (data.qrcode && data.qrcode.base64) {
        setQrCodeBase64(data.qrcode.base64);
        setStatus('waiting_qr');
        startPolling(instanceName.trim());
      } else {
        startPolling(instanceName.trim());
      }

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Erro desconhecido');
    }
  };

  const startPolling = (name: string) => {
    setStatus('waiting_qr');
    const interval = setInterval(async () => {
      try {
        const targetUrl = cleanUrl(baseUrl);
        
        // 1. Check state
        const stateRes = await fetch(`/api-proxy/instance/connectionState/${name}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'x-target-url': targetUrl
          }
        });
        
        if (stateRes.ok) {
          const data = await stateRes.json();
          const state = data?.instance?.state || data?.state;
          
          if (state === 'open' || state === 'connected' || state === 'CONNECTED') {
            clearInterval(interval);
            setStatus('connected');
            if (onConnect) onConnect(name);
            if (onConnected) onConnected(name);
            return;
          }
        }

        // 2. Fetch QR Code dynamically if not connected
        const connectRes = await fetch(`/api-proxy/instance/connect/${name}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'x-target-url': targetUrl
          }
        });
        
        if (connectRes.ok) {
          const qrData = await connectRes.json();
          if (qrData?.base64) {
            setQrCodeBase64(qrData.base64);
          } else if (qrData?.qrcode?.base64) {
            setQrCodeBase64(qrData.qrcode.base64);
          }
        }

      } catch (e) {
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      if (status !== 'connected') {
        setStatus('error');
        setErrorMsg('Tempo limite excedido aguardando leitura do QR Code.');
      }
    }, 120000);
  };

  if (status === 'connected') {
    return (
      <div className="liquid-panel rounded-[2rem] p-8 lg:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 w-full h-full">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h3 className="text-xl font-medium text-white tracking-tight">WhatsApp Conectado</h3>
            <p className="text-sm text-white/50 mt-1">Instância vinculada: <span className="text-white font-medium">{instanceName}</span></p>
          </div>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button 
            onClick={() => {
              if (onConnect) onConnect(instanceName);
              if (onConnected) onConnected(instanceName);
            }}
            className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90 rounded-full px-8 py-3.5 flex items-center justify-center gap-3 transition-all font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Avançar
          </button>
          <button 
            onClick={() => {
              if(onDisconnect) onDisconnect();
              setStatus('idle');
              setInstanceName('');
              setQrCodeBase64(null);
            }}
            className="flex-1 sm:flex-none liquid-glass border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium"
          >
            <LogOut size={16} />
            Desconectar
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-panel rounded-[2rem] p-8 lg:p-10 w-full space-y-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
      <div className="relative z-10 flex flex-col w-full space-y-6 h-full">
      
      {status === 'idle' || status === 'error' ? (
        <div className="space-y-6">
          {errorMsg && (
            <div className="p-4 liquid-glass border border-red-500/30 bg-red-500/10 text-red-200 rounded-2xl text-sm">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Sua Instância Atribuída</label>
            {instances.length > 0 ? (
              <div className="relative">
                <select
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 font-medium text-lg appearance-none cursor-pointer"
                >
                  {instances.map((inst: string) => (
                    <option key={inst} value={inst} className="bg-black text-white">{inst}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={20} className="text-white/50" />
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Digite o nome da nova instância..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 font-medium text-lg"
              />
            )}
          </div>
          
          <button
            onClick={createInstance}
            className="w-full bg-white text-black hover:bg-white/90 font-semibold py-4 rounded-full transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
          >
            Gerar QR Code para Conectar
          </button>
        </div>
      ) : null}

      {status === 'creating' && (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 className="w-10 h-10 text-white/80 animate-spin" />
          <p className="text-white/60 font-medium tracking-wide">Preparando conexão na nuvem...</p>
        </div>
      )}

      {status === 'waiting_qr' && !qrCodeBase64 && (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 className="w-10 h-10 text-white/80 animate-spin" />
          <p className="text-white/60 font-medium tracking-wide">Gerando QR Code na VPS, aguarde...</p>
        </div>
      )}

      {status === 'waiting_qr' && qrCodeBase64 && (
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="p-6 liquid-glass-strong border border-white/20 rounded-3xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
            <img src={qrCodeBase64} alt="QR Code WhatsApp" className="w-64 h-64 rounded-xl relative z-10" />
          </div>
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-white text-xl tracking-tight">Escaneie o QR Code</h3>
            <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
              Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e aponte a câmera para a tela.
            </p>
          </div>
          <div className="flex items-center gap-3 text-white/70 liquid-glass px-6 py-3 rounded-full text-sm font-medium border border-white/10">
            <Loader2 className="w-4 h-4 animate-spin" />
            Aguardando leitura do celular...
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
