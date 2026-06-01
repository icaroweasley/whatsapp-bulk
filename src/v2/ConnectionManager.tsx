import { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, Loader2, LogOut, ChevronDown, Smartphone } from 'lucide-react';

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
  const [connectionMethod, setConnectionMethod] = useState<'qrcode' | 'phone'>('qrcode');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_EVOLUTION_URL;
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

  useEffect(() => {
    if (connectedInstance) {
      setStatus('connected');
      setInstanceName(connectedInstance);
    }
  }, [connectedInstance]);

  const [instanceInfo, setInstanceInfo] = useState<any>(null);
  const [isCheckingState, setIsCheckingState] = useState(false);

  useEffect(() => {
    if (!instanceName || !baseUrl || !apiKey || status === 'creating' || status === 'waiting_qr') return;
    
    let isMounted = true;

    const checkState = async () => {
      setIsCheckingState(true);
      try {
        const targetUrl = cleanUrl(baseUrl);
        const res = await fetch(`/api-proxy/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': apiKey, 'x-target-url': targetUrl }
        });
        
        if (res.ok && isMounted) {
          const data = await res.json();
          const state = data?.instance?.state || data?.state;
          
          if (state === 'open' || state === 'connected' || state === 'CONNECTED') {
            setStatus('connected');
            
            // Try to get phone number
            const fetchRes = await fetch(`/api-proxy/instance/fetchInstances`, {
                headers: { 'apikey': apiKey, 'x-target-url': targetUrl }
            });
            if(fetchRes.ok){
               const allInstances = await fetchRes.json();
               const myInstance = allInstances.find((i: any) => i.name === instanceName || i.instance?.instanceName === instanceName);
               if(myInstance) {
                   setInstanceInfo(myInstance);
               }
            }
          } else {
            if (status === 'connected') setStatus('idle');
            setInstanceInfo(null);
            
            // Auto-fallback: se a atual está fechada, busca se tem alguma aberta
            const fetchRes = await fetch(`/api-proxy/instance/fetchInstances`, {
                headers: { 'apikey': apiKey, 'x-target-url': targetUrl }
            });
            if(fetchRes.ok){
               const allInstances = await fetchRes.json();
               const openInstance = allInstances.find((i: any) => i.connectionStatus === 'open' || i.instance?.state === 'open');
               if(openInstance) {
                   const openName = openInstance.name || openInstance.instance?.instanceName;
                   if (openName && openName !== instanceName) {
                       setInstanceName(openName);
                       if (onConnected) onConnected(openName);
                   }
               }
            }
          }
        }
      } catch (e) {
      } finally {
        if (isMounted) setIsCheckingState(false);
      }
    };
    
    checkState();
    
    return () => { isMounted = false; };
  }, [instanceName, baseUrl, apiKey]);

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
    
    let formattedNumber = undefined;
    if (connectionMethod === 'phone') {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      if (cleanNumber.length < 11) {
        setErrorMsg('Por favor, insira um número válido com DDI e DDD (ex: 5511999999999)');
        return;
      }
      formattedNumber = cleanNumber;
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
          number: formattedNumber,
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
        setStatus('waiting_qr');
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
          if (qrData?.pairingCode) {
            setPairingCode(qrData.pairingCode);
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
      <div className="liquid-panel rounded-[2rem] p-6 sm:p-8 lg:p-10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-8 w-full h-full">
          {/* Info Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6 flex-1 min-w-[280px]">
            {/* Avatar / Icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full"></div>
              {instanceInfo?.profilePicUrl ? (
                <img 
                  src={instanceInfo.profilePicUrl} 
                  alt="Profile" 
                  className="w-20 h-20 sm:w-16 sm:h-16 rounded-full border-2 border-emerald-500/50 object-cover relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                />
              ) : (
                <div className="w-20 h-20 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 border-2 border-emerald-500/50 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 size={32} className="w-10 h-10 sm:w-8 sm:h-8" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-black z-20">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            </div>

            {/* Texts */}
            <div className="flex flex-col min-w-0 w-full sm:pt-1">
              <h3 className="text-2xl sm:text-xl font-bold text-white tracking-tight mb-3 sm:mb-2">WhatsApp Conectado</h3>
              
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="uppercase text-[10px] tracking-wider font-semibold bg-white/10 px-2 py-0.5 rounded-full shrink-0">Instância</span>
                  <span className="text-sm text-white font-medium truncate max-w-[200px]">{instanceName}</span>
                </div>
                
                {instanceInfo?.ownerJid && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="uppercase text-[10px] tracking-wider font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full shrink-0">Número</span>
                    <span className="text-sm text-white font-medium truncate max-w-[200px]">
                      +{instanceInfo.ownerJid.split('@')[0]}
                    </span>
                  </div>
                )}
                
                {instanceInfo?.profileName && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="uppercase text-[10px] tracking-wider font-semibold bg-white/10 px-2 py-0.5 rounded-full shrink-0">Nome</span>
                    <span className="text-sm text-white font-medium truncate max-w-[200px]">{instanceInfo.profileName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto shrink-0 justify-center">
            <button 
              onClick={() => {
                if(onDisconnect) onDisconnect();
                setStatus('idle');
                setInstanceName('');
                setQrCodeBase64(null);
                setPairingCode(null);
              }}
              className="w-full sm:w-auto liquid-glass border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 rounded-2xl sm:rounded-full px-6 py-4 sm:py-3.5 text-sm font-medium"
            >
              <LogOut size={18} className="sm:w-4 sm:h-4" />
              <span>Desconectar</span>
            </button>
            
            <button 
              onClick={() => {
                if (onConnect) onConnect(instanceName);
                if (onConnected) onConnected(instanceName);
              }}
              className="w-full sm:w-auto bg-white text-black hover:bg-white/90 rounded-2xl sm:rounded-full px-8 py-4 sm:py-3.5 flex items-center justify-center gap-3 transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 text-base sm:text-sm whitespace-nowrap"
            >
              <span>Avançar para Envios</span>
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
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setConnectionMethod('qrcode')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${connectionMethod === 'qrcode' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <QrCode size={18} />
              QR Code
            </button>
            <button
              onClick={() => setConnectionMethod('phone')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${connectionMethod === 'phone' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Smartphone size={18} />
              Telefone
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 liquid-glass border border-red-500/30 bg-red-500/10 text-red-200 rounded-2xl text-sm">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Sua Instância Atribuída</label>
            {instances.length > 0 ? (
              <>
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
              </>

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

          {connectionMethod === 'phone' && (
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Número do WhatsApp</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 font-medium text-lg"
              />
              <p className="text-xs text-white/40 mt-2 ml-1">Insira o código do país (55 para Brasil) + DDD + número.</p>
            </div>
          )}
          
          <button
            onClick={createInstance}
            disabled={isCheckingState}
            className="w-full bg-white text-black hover:bg-white/90 font-semibold py-4 rounded-full transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isCheckingState ? <Loader2 size={18} className="animate-spin" /> : null}
            {connectionMethod === 'qrcode' ? 'Gerar QR Code para Conectar' : 'Gerar Código de Pareamento'}
          </button>
        </div>
      ) : null}

      {status === 'creating' && (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 className="w-10 h-10 text-white/80 animate-spin" />
          <p className="text-white/60 font-medium tracking-wide">Preparando conexão na nuvem...</p>
        </div>
      )}

      {status === 'waiting_qr' && !qrCodeBase64 && !pairingCode && (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <Loader2 className="w-10 h-10 text-white/80 animate-spin" />
          <p className="text-white/60 font-medium tracking-wide">
            {connectionMethod === 'qrcode' ? 'Gerando QR Code na VPS, aguarde...' : 'Gerando Código de Pareamento, aguarde...'}
          </p>
        </div>
      )}

      {status === 'waiting_qr' && connectionMethod === 'qrcode' && qrCodeBase64 && (
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

      {status === 'waiting_qr' && connectionMethod === 'phone' && pairingCode && (
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="p-8 liquid-glass-strong border border-white/20 rounded-3xl relative overflow-hidden w-full max-w-sm text-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
             <p className="text-white/60 font-medium text-sm mb-4 uppercase tracking-widest">Código de Pareamento</p>
             <h2 className="text-5xl font-bold tracking-[0.2em] text-white relative z-10">{pairingCode}</h2>
          </div>
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-white text-xl tracking-tight">Insira o código no celular</h3>
            <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
              Vá em <strong>Aparelhos Conectados &gt; Conectar um Aparelho &gt; Conectar com número de telefone</strong> no seu WhatsApp e digite o código acima.
            </p>
          </div>
          <div className="flex items-center gap-3 text-white/70 liquid-glass px-6 py-3 rounded-full text-sm font-medium border border-white/10">
            <Loader2 className="w-4 h-4 animate-spin" />
            Aguardando vinculação no celular...
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
