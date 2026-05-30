import { useState, useRef, useEffect, useDeferredValue, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import ConnectionManager from './ConnectionManager';
import { Play, CheckCircle2, Upload, Search, Trash2, Users, MessageSquare, Image as ImageIcon, ArrowRight, ArrowLeft, Save, FolderOpen, Plus, Pause, Square, Download, Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  pushName?: string;
  name?: string;
  number: string;
  status?: 'pending' | 'sent' | 'error';
}

interface SavedList {
  id: string;
  name: string;
  contacts: Contact[];
  instanceName?: string;
}

interface SavedInstance {
  instanceName: string;
  baseUrl: string;
  apiKey: string;
}

interface LogEntry {
  id: number;
  text: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
}

interface MediaAttachment {
  id: string;
  base64: string;
  name: string;
  type: string;
}

const dockerComposeContent = `version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16.4-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      # Credenciais do banco (altere se necessário)
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-postgres123}
      POSTGRES_DB: \${POSTGRES_DB:-n8n}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7.2-alpine
    container_name: redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "\${REDIS_PASSWORD:-redis123}"]  # Senha do Redis (altere se necessário)
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "\${REDIS_PASSWORD:-redis123}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # n8n
  n8n:
    image: n8nio/n8n:1.119.1
    container_name: n8n
    restart: unless-stopped
    environment:
      # Conexão com PostgreSQL (use as mesmas credenciais do postgres acima)
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=\${POSTGRES_DB:-n8n}
      - DB_POSTGRESDB_USER=\${POSTGRES_USER:-postgres}
      - DB_POSTGRESDB_PASSWORD=\${POSTGRES_PASSWORD:-postgres123}
      # Conexão com Redis (use a mesma senha do redis acima)
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - QUEUE_BULL_REDIS_PASSWORD=\${REDIS_PASSWORD:-redis123}
      # - EXECUTIONS_MODE=queue
      - N8N_HOST=\${N8N_HOST:-host.docker.internal}
      - N8N_PORT=\${N8N_PORT:-5678}
      - N8N_PROTOCOL=\${N8N_PROTOCOL:-http}
      - WEBHOOK_URL=\${N8N_WEBHOOK_URL:-http://host.docker.internal:5678/}
      # ATUALIZADO: Fuso horário fixo para Campo Grande
      - GENERIC_TIMEZONE=America/Campo_Grande
      - TZ=America/Campo_Grande
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - app_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Evolution API
  evolution:
    image: evoapicloud/evolution-api:v2.3.6
    container_name: evolution_api
    restart: unless-stopped
    environment:
      - SERVER_TYPE=http
      - SERVER_PORT=\${EVOLUTION_PORT:-8080}
      - SERVER_URL=\${EVOLUTION_SERVER_URL:-}
      - LOG_LEVEL=\${EVOLUTION_LOG_LEVEL:-ERROR,WARN,DEBUG,INFO}
      - LOG_COLOR=true
      - LOG_BAILEYS=error
      - CORS_ORIGIN=*
      - CORS_METHODS=GET,POST,PUT,DELETE
      - CORS_CREDENTIALS=true
      # Database (use as mesmas credenciais do postgres acima)
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://\${POSTGRES_USER:-postgres}:\${POSTGRES_PASSWORD:-postgres123}@postgres:5432/\${EVOLUTION_DB_NAME:-evolution}?schema=public
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_api
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - DATABASE_SAVE_DATA_LABELS=true
      - DATABASE_SAVE_DATA_HISTORIC=true
      # Redis (use a mesma senha do redis acima)
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://:\${REDIS_PASSWORD:-redis123}@redis:6379
      - CACHE_REDIS_PREFIX_KEY=\${EVOLUTION_CACHE_REDIS_PREFIX_KEY:-evolution}
      - CACHE_REDIS_SAVE_INSTANCES=false
      - RABBITMQ_ENABLED=false
      - WEBSOCKET_ENABLED=false
      - WEBHOOK_GLOBAL_ENABLED=false
      - WEBHOOK_GLOBAL_URL=
      - WEBHOOK_EVENTS_QRCODE_UPDATED=true
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
      - WEBHOOK_EVENTS_MESSAGES_UPDATE=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      - QRCODE_LIMIT=30
      - QRCODE_COLOR=#175197
      - CONFIG_SESSION_PHONE_CLIENT=Evolution API
      - CONFIG_SESSION_PHONE_NAME=Chrome
      # API Key (ALTERE AQUI - importante!)
      - AUTHENTICATION_API_KEY=\${EVOLUTION_API_KEY:-evolution_api_key_12345}
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - TYPEBOT_ENABLED=false
      - CHATWOOT_ENABLED=false
      - OPENAI_ENABLED=false
      - DIFY_ENABLED=false
      - S3_ENABLED=false
      - TZ=America/Campo_Grande
      - DEL_INSTANCE=false
    ports:
      - "8080:8080"
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - app_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  n8n_data:
    driver: local
  evolution_instances:
    driver: local
  evolution_store:
    driver: local

networks:
  app_network:
    driver: bridge`;

const envContent = `POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=n8n

REDIS_PASSWORD=redis123

EVOLUTION_DB_NAME=evolution
EVOLUTION_API_KEY=evolution_api_key_12345

# ... suas outras configs ...

# FORÇAR O ENDEREÇO LOCALHOST
N8N_WEBHOOK_URL=http://localhost:5678/
WEBHOOK_URL=http://localhost:5678/`;

const downloadFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

import { useAuth } from '../contexts/AuthContext';
import AdminPanel from '../components/AdminPanel';
import { Settings } from 'lucide-react';

function AppV2() {
  const { user, token, logout } = useAuth();
  const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const API_URL = rawUrl.replace(/\/$/, '').replace('163.176.37.93:3001', '163.176.37.93:8080');
  
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<1 | 2 | 3>(1);
  const [mobileTab, setMobileTab] = useState<'source' | 'target'>('source');
  const [showAdmin, setShowAdmin] = useState(false);

  // Evolution API Config
  const baseUrl = import.meta.env.VITE_EVOLUTION_URL || '';
  const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY || '';
  const [instanceName, setInstanceName] = useState(() => {
    const loaded = localStorage.getItem(`evo_selectedInstance_${user?.username || 'default'}`);
    return loaded || (user?.instances && user.instances[0]) || '';
  });
  const [savedInstances, setSavedInstances] = useState<SavedInstance[]>(() => {
    const loaded = localStorage.getItem(`evolution_saved_instances_${user?.username || 'default'}`);
    if (loaded) { try { return JSON.parse(loaded); } catch(e) {} }
    return [];
  });
  
  // Contacts State
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedAllContacts, setSelectedAllContacts] = useState<Set<string>>(new Set());
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [searchAll, setSearchAll] = useState('');

  // Target List State
  const [targetContacts, setTargetContacts] = useState<Contact[]>([]);
  const [selectedTargetContacts, setSelectedTargetContacts] = useState<Set<string>>(new Set());
  const [searchTarget, setSearchTarget] = useState('');
  const [listName, setListName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);

  useEffect(() => {
    if (token) fetchLists();
  }, [token]);

  const fetchLists = async () => {
    try {
      const res = await fetch(`/api/lists`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-target-url': API_URL
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedLists(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Message State
  const [message, setMessage] = useState(() => localStorage.getItem(`evo_message_${user?.username || 'default'}`) || '');
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([]);
  const [textPosition, setTextPosition] = useState<'before' | 'after' | 'caption'>('after');
  
  // Broadcast State
  const [isSending, setIsSending] = useState(false);
  const [isPausedUI, setIsPausedUI] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync state to localStorage
  useEffect(() => { localStorage.setItem(`evo_message_${user?.username || 'default'}`, message); }, [message, user?.username]);

  // Reset textPosition if user uploaded multiple images but had caption selected
  useEffect(() => {
    if (mediaAttachments.length > 1 && textPosition === 'caption') {
      setTextPosition('after');
    }
  }, [mediaAttachments.length, textPosition]);

  // Handle instance changes
  useEffect(() => { 
    localStorage.setItem(`evo_selectedInstance_${user?.username || 'default'}`, instanceName);
    const loaded = localStorage.getItem(`evo_targetContacts_${user?.username || 'default'}_${instanceName}`);
    if (loaded) { try { setTargetContacts(JSON.parse(loaded)); } catch(e) { setTargetContacts([]); } }
    else { setTargetContacts([]); }
    // Clean up temporary states when instance changes
    setAllContacts([]);
    setSelectedListId('');
    setListName('');
  }, [instanceName, user?.username]);

  // Save active target contacts per instance
  useEffect(() => { 
    if (instanceName) {
      localStorage.setItem(`evo_targetContacts_${user?.username || 'default'}_${instanceName}`, JSON.stringify(targetContacts)); 
    }
  }, [targetContacts, instanceName, user?.username]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, status: 'pending' | 'success' | 'error') => {
    setLogs(prev => [...prev, { id: Date.now(), text, status, timestamp: new Date() }]);
  };

  const clearLogs = () => setLogs([]);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'ngrok-skip-browser-warning': 'true',
      'Bypass-Tunnel-Reminder': 'true',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchContacts = async (nameOverride?: string, autoRetry: boolean = false, retryCount: number = 0) => {
    const targetInstance = nameOverride || instanceName;
    if (!baseUrl || !apiKey || !targetInstance) {
      alert('Por favor, certifique-se de que a API está configurada e a instância conectada.');
      return;
    }

    setIsLoadingContacts(true);

    let cleanBaseUrl = baseUrl.trim().replace(/\/$/, '');
    if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
      cleanBaseUrl = 'https://' + cleanBaseUrl;
    }

    // 1. Fetch real instanceId for security filtering
    let realInstanceId = '';
    try {
      const stateRes = await fetch(`/api-proxy/instance/connectionState/${targetInstance}`, {
        method: 'GET',
        headers: { ...getHeaders(), 'x-target-url': cleanBaseUrl }
      });
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        realInstanceId = stateData?.instance?.instanceId || stateData?.instance?.id || '';
      }
    } catch (e) {}

    const payloadWhere = realInstanceId ? { instanceId: realInstanceId } : {};

    const endpointsContacts = [
      { path: `/chat/findContacts/${targetInstance}`, method: 'POST', body: { where: payloadWhere } },
      { path: `/v2/contact/fetchContacts/${targetInstance}`, method: 'GET' }
    ];

    const endpointsChats = [
      { path: `/chat/findChats/${targetInstance}`, method: 'POST', body: { where: payloadWhere } },
      { path: `/v2/chat/findChats/${targetInstance}`, method: 'GET' }
    ];

    let success = false;
    let mergedRawData: any[] = [];

    // Helper para tentar buscar de uma lista de endpoints (pega o primeiro que funcionar)
    const tryFetch = async (endpoints: any[]) => {
      for (const endpoint of endpoints) {
        try {
          const fetchOptions: RequestInit = {
            method: endpoint.method,
            headers: { ...getHeaders(), 'x-target-url': cleanBaseUrl }
          };
          if (endpoint.method === 'POST') {
            fetchOptions.body = JSON.stringify(endpoint.body || {});
          }
          const response = await fetch(`/api-proxy${endpoint.path}`, fetchOptions);
          const textResponse = await response.text();
          if (response.ok) {
            try {
              const data = JSON.parse(textResponse);
              const list = Array.isArray(data) ? data : (data.contacts || data.chats || data.data || []);
              if (list.length > 0) return list;
            } catch (err) {}
          }
        } catch (error) {}
      }
      return [];
    };

    // Busca contatos e chats simultaneamente
    const [contactsData, chatsData] = await Promise.all([
      tryFetch(endpointsContacts),
      tryFetch(endpointsChats)
    ]);

    mergedRawData = [...contactsData, ...chatsData];

    if (mergedRawData.length > 0) {
      success = true;

      const formattedContacts: Contact[] = mergedRawData.filter((c: any) => {
        // Filtro estrito de instanceId
        if (realInstanceId && c.instanceId && c.instanceId !== realInstanceId) return false;
        
        // Filtro estrito contra GRUPOS antes do parse
        const cid = String(c.id || c.remoteJid || '').toLowerCase();
        if (cid.includes('g.us') || cid.includes('broadcast')) return false;

        return true;
      }).map((c: any) => {
        // Tática de caça: transforma o contato inteiro em texto e acha o número real
        const cString = JSON.stringify(c);
        const match = cString.match(/\b(55\d{10,11})\b/);
        
        let actualNumber = '';
        let rawId = '';

        if (match) {
          actualNumber = match[1];
          rawId = actualNumber + '@s.whatsapp.net';
        } else {
          rawId = c.id || c.remoteJid || c.number || '';
          actualNumber = typeof rawId === 'string' ? rawId.split('@')[0] : String(rawId);
          actualNumber = actualNumber.replace(/\D/g, '');
          
          if (typeof rawId === 'string' && !rawId.includes('@') && actualNumber.length >= 14 && !actualNumber.startsWith('55')) {
            rawId = actualNumber + '@lid';
          }
        }
        
        return {
          id: rawId,
          pushName: c.pushName,
          name: c.name,
          number: actualNumber,
          status: 'pending' as 'pending'
        };
      }).filter((c: Contact) => {
        if (!c.number) return false;
        const lowerId = String(c.id).toLowerCase();
        if (lowerId.includes('g.us') || lowerId.includes('broadcast')) return false;
        return c.number.length >= 8;
      });

      // Remove duplicatas e mescla os dados para não perder nomes (ex: Chat sem 'name' sobrescrevendo Contact com 'name')
      const uniqueContactsMap = new Map<string, Contact>();
      formattedContacts.forEach(c => {
        if (uniqueContactsMap.has(c.id)) {
          const existing = uniqueContactsMap.get(c.id)!;
          uniqueContactsMap.set(c.id, {
            ...existing,
            name: existing.name || c.name,
            pushName: existing.pushName || c.pushName
          });
        } else {
          uniqueContactsMap.set(c.id, c);
        }
      });
      
      setAllContacts(Array.from(uniqueContactsMap.values()));
      setSelectedAllContacts(new Set());
    } else {
      setAllContacts([]);
      setSelectedAllContacts(new Set());
      
      if (autoRetry && retryCount < 5) {
        setTimeout(() => fetchContacts(nameOverride, true, retryCount + 1), 3000);
        return; // Retorna cedo sem desativar o isLoadingContacts
      }
    }
    
    setIsLoadingContacts(false);
  };

  // --- List Management ---
  const deferredSearchAll = useDeferredValue(searchAll);
  const deferredSearchTarget = useDeferredValue(searchTarget);

  const filteredAllContacts = useMemo(() => {
    const searchLower = deferredSearchAll.toLowerCase();
    return allContacts.filter(c => 
      c.name?.toLowerCase().includes(searchLower) || 
      c.number.includes(deferredSearchAll) ||
      c.pushName?.toLowerCase().includes(searchLower)
    );
  }, [allContacts, deferredSearchAll]);

  const filteredTargetContacts = useMemo(() => {
    const searchLower = deferredSearchTarget.toLowerCase();
    return targetContacts.filter(c => 
      c.name?.toLowerCase().includes(searchLower) || 
      c.number.includes(deferredSearchTarget) ||
      c.pushName?.toLowerCase().includes(searchLower)
    );
  }, [targetContacts, deferredSearchTarget]);

  const toggleAllSelection = (id: string) => {
    const newSelected = new Set(selectedAllContacts);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedAllContacts(newSelected);
  };

  const toggleAllAllSelection = () => {
    if (selectedAllContacts.size === filteredAllContacts.length) {
      setSelectedAllContacts(new Set());
    } else {
      setSelectedAllContacts(new Set(filteredAllContacts.map(c => c.id)));
    }
  };

  const toggleTargetSelection = (id: string) => {
    const newSelected = new Set(selectedTargetContacts);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTargetContacts(newSelected);
  };

  const toggleAllTargetSelection = () => {
    if (selectedTargetContacts.size === filteredTargetContacts.length) {
      setSelectedTargetContacts(new Set());
    } else {
      setSelectedTargetContacts(new Set(filteredTargetContacts.map(c => c.id)));
    }
  };

  const moveSelectedToTarget = () => {
    const toAdd = allContacts.filter(c => selectedAllContacts.has(c.id));
    const newTarget = [...targetContacts];
    
    toAdd.forEach(contact => {
      if (!newTarget.find(t => t.id === contact.id)) {
        newTarget.push({ ...contact, status: 'pending' });
      }
    });
    
    setTargetContacts(newTarget);
    setSelectedAllContacts(new Set());
  };

  const removeSelectedFromTarget = () => {
    const newTarget = targetContacts.filter(c => !selectedTargetContacts.has(c.id));
    setTargetContacts(newTarget);
    setSelectedTargetContacts(new Set());
  };

  const saveCurrentList = async () => {
    if (!listName.trim()) {
      alert("Por favor, digite um nome para a lista.");
      return;
    }
    if (targetContacts.length === 0) {
      alert("A lista alvo está vazia.");
      return;
    }

    try {
      const isNew = !selectedListId;
      const res = await fetch(`/api/lists`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-target-url': API_URL
        },
        body: JSON.stringify({
          id: selectedListId || undefined,
          name: listName.trim(),
          contacts: targetContacts.map(c => ({...c, status: 'pending'}))
        })
      });

      if (!res.ok) throw new Error('Falha ao salvar lista');
      
      const savedList = await res.json();
      
      if (isNew) {
        setSavedLists(prev => [savedList, ...prev]);
        setSelectedListId(savedList.id);
      } else {
        setSavedLists(prev => prev.map(l => l.id === savedList.id ? savedList : l));
      }
      
      alert(`Lista "${savedList.name}" salva com sucesso!`);
    } catch (error) {
      alert("Erro ao salvar lista no servidor.");
      console.error(error);
    }
  };

  const loadSavedList = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    
    const list = savedLists.find(l => l.id === id);
    if (list) {
      setTargetContacts(list.contacts.map(c => ({...c, status: 'pending'})));
      setListName(list.name);
      setSelectedListId(list.id);
      setSelectedTargetContacts(new Set());
    }
  };

  const deleteList = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta lista permanentemente?")) {
      try {
        const res = await fetch(`/api/lists/${id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-target-url': API_URL
          }
        });
        
        if (!res.ok) throw new Error('Falha ao excluir lista');
        
        setSavedLists(prev => prev.filter(l => l.id !== id));
        if (selectedListId === id) {
          setSelectedListId('');
          setListName('');
          setTargetContacts([]);
        }
      } catch (error) {
        alert("Erro ao excluir lista do servidor.");
        console.error(error);
      }
    }
  };




  // --- Media & Broadcast ---
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let filesArray = Array.from(files);
    
    // Limit to 3 files total
    const availableSlots = Math.max(0, 3 - mediaAttachments.length);
    if (filesArray.length > availableSlots) {
      alert(`Você só pode anexar no máximo 3 mídias.`);
      filesArray = filesArray.slice(0, availableSlots);
    }
    
    filesArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        // Resize Image Client-Side
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 1280;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% quality, very lightweight
            
            setMediaAttachments(current => {
              if (current.length >= 3) return current;
              return [...current, {
                id: Date.now().toString() + Math.random().toString(),
                base64: dataUrl,
                name: file.name.replace(/\.[^/.]+$/, "") + "_otimizada.jpg",
                type: 'image/jpeg'
              }];
            });
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // Videos or other files
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        if (file.size > maxSize) {
          alert(`O arquivo "${file.name}" é muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). O limite para vídeos é 5MB.`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaAttachments(current => {
            if (current.length >= 3) return current;
            return [...current, {
              id: Date.now().toString() + Math.random().toString(),
              base64: reader.result as string,
              name: file.name,
              type: file.type
            }];
          });
        };
        reader.readAsDataURL(file);
      }
    });

    // Clear input so same file can be selected again
    e.target.value = '';
  };

  const removeMedia = (id: string) => {
    setMediaAttachments(prev => prev.filter(m => m.id !== id));
  };

  const insertNamePlaceholder = () => {
    setMessage(prev => prev + '{nome}');
  };


  const startBroadcast = async () => {
    if (targetContacts.length === 0) {
      alert('A lista de disparo está vazia.');
      return;
    }
    if (!message && mediaAttachments.length === 0) {
      alert('Digite uma mensagem ou anexe uma mídia para enviar.');
      return;
    }

    setIsSending(true);
    setIsPausedUI(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;
    addLog(`Iniciando disparo para ${targetContacts.length} contatos...`, 'pending');

    let cleanBaseUrl = baseUrl.trim().replace(/\/$/, '');
    if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
      cleanBaseUrl = 'https://' + cleanBaseUrl;
    }

    let sentCount = 0;

    for (let i = 0; i < targetContacts.length; i++) {
      while (isPausedRef.current && !isCancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (isCancelledRef.current) {
        addLog(`Disparo cancelado pelo usuário.`, 'error');
        break;
      }

      const contact = targetContacts[i];
      
      setTargetContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'pending' } : c));
      
      try {
        const personalizedMessage = message.replace(/{nome}/gi, contact.name || contact.pushName || 'cliente');

        let targetJid = contact.id;
        if (!targetJid.includes('@')) {
           if (contact.number && /^\d+$/.test(contact.number)) {
              targetJid = contact.number + '@s.whatsapp.net';
           } else {
              targetJid = targetJid + '@s.whatsapp.net';
           }
        }

        // Anti-ban: Simular digitação
        const typingDelayMs = Math.floor(Math.random() * (10000 - 2000 + 1)) + 2000;
        const typingSeconds = (typingDelayMs / 1000).toFixed(1);
        
        addLog(`Simulando digitação para ${contact.name || contact.number} (${typingSeconds}s)...`, 'pending');
        
        try {
            await fetch(`/api-proxy/chat/sendPresence/${instanceName}`, {
               method: 'POST',
               headers: { ...getHeaders(), 'x-target-url': cleanBaseUrl },
               body: JSON.stringify({ number: targetJid, presence: 'composing', delay: typingDelayMs })
            });
        } catch(e) {}
        
        let typingWaited = 0;
        while(typingWaited < typingDelayMs) {
           if (isCancelledRef.current) break;
           await new Promise(resolve => setTimeout(resolve, 500));
           typingWaited += 500;
        }
        if (isCancelledRef.current) {
            addLog(`Disparo cancelado pelo usuário.`, 'error');
            break;
        }

        let contactSuccess = false;
        let contactErrorMsg = '';

        const sendText = async (textToSend: string) => {
           const endpoint = `/message/sendText/${instanceName}`;
           const response = await fetch(`/api-proxy${endpoint}`, {
              method: 'POST',
              headers: { ...getHeaders(), 'x-target-url': cleanBaseUrl },
              body: JSON.stringify({ number: targetJid, text: textToSend })
           });
           const textResponse = await response.text();
           if (!response.ok) {
              let err = response.status.toString();
              try { err += ' - ' + JSON.parse(textResponse).message; } catch(e) {}
              throw new Error(err);
           }
        };

        try {
          if (mediaAttachments.length > 0) {
             if (textPosition === 'before' && personalizedMessage) {
                 await sendText(personalizedMessage);
                 await new Promise(resolve => setTimeout(resolve, 2000));
             }

             let finalMediaAttachments = mediaAttachments;

             // Disparo sequencial para as imagens
             for (let mIndex = 0; mIndex < finalMediaAttachments.length; mIndex++) {
                const attachment = finalMediaAttachments[mIndex];
                const endpoint = `/message/sendMedia/${instanceName}`;
                let finalMedia = attachment.base64;
                if (finalMedia.includes('base64,')) {
                    finalMedia = finalMedia.split('base64,')[1];
                }

                const body = {
                  number: targetJid,
                  mediatype: attachment.type.startsWith('video') ? "video" : "image",
                  mimetype: attachment.type || "image/jpeg",
                  fileName: attachment.name || "media",
                  caption: (textPosition === 'caption' && mIndex === 0) ? personalizedMessage : "",
                  media: finalMedia
                };

                const response = await fetch(`/api-proxy${endpoint}`, {
                  method: 'POST',
                  headers: { ...getHeaders(), 'x-target-url': cleanBaseUrl },
                  body: JSON.stringify(body)
                });

                const textResponse = await response.text();
                
                if (!response.ok) {
                   let err = response.status.toString();
                   try { err += ' - ' + JSON.parse(textResponse).message; } catch(e) {}
                   throw new Error(err);
                }

                if (mIndex < finalMediaAttachments.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1500));
                }
             }

             if (textPosition === 'after' && personalizedMessage) {
                 await new Promise(resolve => setTimeout(resolve, 2000));
                 await sendText(personalizedMessage);
             }
             contactSuccess = true;
          } else {
             await sendText(personalizedMessage);
             contactSuccess = true;
          }
        } catch (err: any) {
           contactErrorMsg = err.message || "Erro desconhecido";
           contactSuccess = false;
        }

        if (contactSuccess && !contactErrorMsg) {
           setTargetContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sent' } : c));
           sentCount++;
           addLog(`Enviado para ${contact.name || contact.number}`, 'success');
        } else {
           setTargetContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'error' } : c));
           addLog(`Erro ao enviar para ${contact.number}: ${contactErrorMsg}`, 'error');
        }
      } catch (error) {
        setTargetContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'error' } : c));
        addLog(`Falha de conexão com ${contact.number}`, 'error');
      }

      if (i < targetContacts.length - 1) {
        if (isCancelledRef.current) {
           addLog(`Disparo cancelado pelo usuário.`, 'error');
           break;
        }
        const delayMs = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
        const delaySeconds = (delayMs / 1000).toFixed(1);
        addLog(`Aguardando ${delaySeconds}s para evitar bloqueio...`, 'pending');
        
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
           addLog(`Disparo cancelado pelo usuário.`, 'error');
           break;
        }
      }
    }

    addLog(`Disparo concluído! ${sentCount} mensagens enviadas.`, 'success');
    setIsSending(false);
  };

  const nextScreen = (screen: 1 | 2 | 3) => {
    if (screen === 2) {
      if (!baseUrl || !apiKey || !instanceName) {
        alert("Por favor, conecte uma instância primeiro.");
        return;
      }
      
      const newInstance = { instanceName, baseUrl, apiKey };
      setSavedInstances(prev => {
        const filtered = prev.filter(i => i.instanceName !== instanceName);
        const updated = [...filtered, newInstance];
        localStorage.setItem('evolution_saved_instances', JSON.stringify(updated));
        return updated;
      });

      if (allContacts.length === 0) fetchContacts(undefined, true);
    }
    if (screen === 3) {
      if (targetContacts.length === 0) {
        if (!confirm("A lista alvo está vazia. Deseja avançar mesmo assim?")) return;
      }
    }
    setCurrentScreen(screen);
  };

  return (
    <div className="relative min-h-screen font-sans text-white bg-transparent overflow-x-hidden selection:bg-emerald-500/30">
      {/* ChatPulse Aesthetic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] bg-emerald-500/30 rounded-full blur-[150px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>
      </div>

      {/* Main Content Wrapper - ChatPulse Desktop App Style */}
      <div className="relative z-10 flex h-screen p-4 lg:p-6 w-full max-w-[1600px] mx-auto items-center justify-center">
        
        {/* App Window Shell */}
        <div className="w-full h-full lg:max-h-[900px] liquid-panel rounded-[2rem] flex flex-col md:flex-row overflow-hidden border border-white/10 shadow-2xl relative">
          
          {/* Left Sidebar */}
          <aside className="w-full h-16 md:w-24 md:h-full shrink-0 flex flex-row md:flex-col items-center justify-around md:justify-start px-4 md:px-0 py-0 md:py-6 border-t md:border-t-0 md:border-r border-white/5 relative z-20 bg-black/40 md:bg-black/20 order-last md:order-first">
            {/* Sidebar Gradient Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500/10 via-transparent to-blue-500/10 opacity-50 pointer-events-none"></div>
            
            {/* Logo */}
            <div className="hidden md:flex w-12 h-12 mb-10 items-center justify-center drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10">
              <img src="/logo_v3.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            {/* Nav Icons */}
            <nav className="flex-1 w-full flex flex-row md:flex-col items-center justify-around md:justify-start gap-0 md:gap-6 relative z-10">
              <button 
                onClick={() => setCurrentScreen(1)} 
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentScreen === 1 ? 'bg-white/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                title="1. Conexão"
              >
                {currentScreen === 1 && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-400 rounded-l-md shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </button>

              <button 
                onClick={() => nextScreen(2)} 
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentScreen === 2 ? 'bg-white/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                title="2. Listas"
              >
                {currentScreen === 2 && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-purple-400 rounded-l-md shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>}
                <Users size={22} />
              </button>

              <button 
                onClick={() => nextScreen(3)} 
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentScreen === 3 ? 'bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                title="3. Disparo"
              >
                {currentScreen === 3 && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-cyan-400 rounded-l-md shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>}
                <MessageSquare size={22} />
              </button>
            </nav>

            {/* Bottom Sidebar Actions */}
            <div className="flex flex-col gap-4 mt-auto relative z-10 w-full items-center">
              {user?.username === 'karu' && (
                <button
                  onClick={() => setShowAdmin(true)}
                  className="w-10 h-10 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                  title="Admin"
                >
                  <Settings size={18} />
                </button>
              )}
              <button 
                onClick={logout}
                className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 flex items-center justify-center transition-all"
                title="Sair"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            
            {/* Top Bar */}
            <header className="h-20 border-b border-white/5 shrink-0 flex items-center justify-between px-8 bg-black/10">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-xl tracking-tight text-white">WhatsApp <span className="font-light opacity-50">Bulk</span></span>
                <div className="w-px h-5 bg-white/10 mx-2 hidden sm:block"></div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{instanceName ? 'CONEXÃO ATIVA' : 'DESCONECTADO'}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-xs font-medium text-white/70">{instanceName ? instanceName : 'Aguardando Dispositivo'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {user?.planExpiresAt && (
                  <div className="flex items-center gap-2 mr-2">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wide uppercase ${user.mpCustomerId ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                      {user.mpCustomerId ? 'Pro' : 'Trial'}
                    </span>
                    <span className="hidden sm:flex text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                      Vence: {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                     {user?.username?.substring(0, 2)}
                  </div>
                  <span className="text-sm font-semibold pr-2 hidden sm:block">{user?.username}</span>
                </div>
              </div>
            </header>

            {/* Inner Content Scroller */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">

        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
        
        {/* SCREEN 1: CONNECTION */}
        {currentScreen === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-light tracking-tight text-white mb-10 leading-tight text-center">
              Conecte sua <span className="font-serif italic text-white/80">instância</span>
            </h1>

            <div className="w-full">
              <ConnectionManager 
                 onConnected={(name) => {
                   setInstanceName(name);
                   setCurrentScreen(2);
                   if (allContacts.length === 0) fetchContacts(name, true);
                 }} 
              />
            </div>
          </div>
        )}

        {/* SCREEN 2: LIST MANAGEMENT */}
        {currentScreen === 2 && (
          <div className="flex-1 flex flex-col w-full max-h-[calc(100vh-140px)]">
            
            {/* Mobile Tabs for Step 2 */}
            <div className="flex lg:hidden w-full mb-4 liquid-glass rounded-xl p-1 shrink-0">
              <button 
                onClick={() => setMobileTab('source')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${mobileTab === 'source' ? 'bg-white text-black' : 'text-white/50'}`}
              >
                Buscar Contatos
              </button>
              <button 
                onClick={() => setMobileTab('target')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${mobileTab === 'target' ? 'bg-white text-black' : 'text-white/50'}`}
              >
                Lista Alvo ({targetContacts.length})
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
              
              {/* Left Panel: Fetched Contacts */}
              <div className={`w-full lg:w-1/2 bg-black/30 backdrop-blur-xl border border-white/5 shadow-inner rounded-[2rem] flex-col p-2 overflow-hidden relative group ${mobileTab === 'source' ? 'flex' : 'hidden lg:flex'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
                <div className="relative z-10 flex flex-col h-full w-full">
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-medium text-white tracking-tight">Contatos da Instância</h2>
                  <p className="text-xs text-white/50 mt-1">Busque os contatos diretamente da sua API.</p>
                </div>
                <button 
                  onClick={() => fetchContacts()}
                  disabled={isLoadingContacts}
                  className="liquid-glass border border-white/10 rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <Users size={14} />
                  {isLoadingContacts ? 'Buscando...' : 'Buscar da API'}
                </button>
              </div>

              <div className="px-5 pb-4">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                  <input 
                    type="text" 
                    value={searchAll}
                    onChange={(e) => setSearchAll(e.target.value)}
                    placeholder="Pesquisar contatos..."
                    className="liquid-glass w-full rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
                {isLoadingContacts ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/50 text-center p-6">
                    <Loader2 size={32} className="mb-4 opacity-50 animate-spin text-purple-400" />
                    <p className="text-sm font-medium">Buscando contatos...</p>
                    <p className="text-xs mt-1 opacity-70">Aguarde enquanto sincronizamos sua agenda e chats.</p>
                  </div>
                ) : allContacts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/50 text-center p-6">
                    <Users size={32} className="mb-4 opacity-50" />
                    <p className="text-sm">Nenhum contato carregado.</p>
                    <p className="text-xs mt-1">Clique em "Buscar da API" para tentar novamente.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center px-4 py-2 text-[10px] uppercase tracking-wider text-white/50 font-medium sticky top-0 bg-black/20 backdrop-blur-md rounded-lg mb-2 z-10">
                      <input 
                        type="checkbox" 
                        checked={allContacts.length > 0 && selectedAllContacts.size === filteredAllContacts.length}
                        onChange={toggleAllAllSelection}
                        className="mr-4 rounded-sm border-white/30 bg-white/10 text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer appearance-none checked:bg-white checked:border-white relative before:content-[''] before:block before:w-1.5 before:h-2.5 before:border-r-2 before:border-b-2 before:border-black before:absolute before:left-1 before:top-0 before:rotate-45 before:opacity-0 checked:before:opacity-100"
                      />
                      <div className="flex-1">Identidade ({filteredAllContacts.length})</div>
                    </div>
                    
                    {filteredAllContacts.map(contact => (
                      <div key={contact.id} onClick={() => toggleAllSelection(contact.id)} className={`liquid-glass rounded-xl p-2.5 flex items-center hover:bg-white/10 transition-colors cursor-pointer border border-transparent ${selectedAllContacts.has(contact.id) ? 'bg-white/5 border-white/20' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedAllContacts.has(contact.id)}
                          readOnly
                          className="ml-1 mr-4 rounded-sm border-white/30 bg-white/10 text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer appearance-none checked:bg-white checked:border-white relative before:content-[''] before:block before:w-1.5 before:h-2.5 before:border-r-2 before:border-b-2 before:border-black before:absolute before:left-1 before:top-0 before:rotate-45 before:opacity-0 checked:before:opacity-100"
                        />
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-sm font-medium text-white truncate leading-tight">{contact.name || contact.pushName || 'Desconhecido'}</span>
                          <span className="text-xs text-white/50 truncate mt-0.5">{contact.number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-white/5 mt-auto">
                <button 
                  onClick={moveSelectedToTarget}
                  disabled={selectedAllContacts.size === 0}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:bg-white/20 disabled:text-white/50 font-semibold"
                >
                  <span className="text-sm">Mover Selecionados para Alvo</span>
                  <ArrowRight size={16} />
                </button>
              </div>
              </div>
            </div>

            {/* Right Panel: Target List */}
            <div className={`w-full lg:w-1/2 bg-black/30 backdrop-blur-xl border border-white/5 shadow-inner rounded-[2rem] flex-col p-2 overflow-hidden relative group ${mobileTab === 'target' ? 'flex' : 'hidden lg:flex'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
              <div className="relative z-10 flex flex-col h-full w-full">
              <div className="p-5 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-medium text-white tracking-tight">Lista de Disparo (Alvo)</h2>
                  <span className="liquid-glass border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium text-white/90">
                    {targetContacts.length} contatos
                  </span>
                </div>
                
                {/* List Management UI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 liquid-glass rounded-2xl bg-black/20">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase text-white/50 px-1 font-medium tracking-wider">Listas Salvas</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                        <select 
                          value={selectedListId}
                          onChange={loadSavedList} 
                          className="liquid-glass w-full rounded-xl pl-9 pr-3 py-2 text-xs text-white/80 focus:outline-none appearance-none cursor-pointer hover:bg-white/5 bg-transparent"
                        >
                          <option value="" disabled className="text-black bg-white">Selecione uma lista...</option>
                          {savedLists.filter(l => !l.instanceName || l.instanceName === instanceName).map(list => (
                            <option key={list.id} value={list.id} className="text-black bg-white">{list.name} ({list.contacts.length})</option>
                          ))}
                        </select>
                      </div>
                      {selectedListId && (
                        <button onClick={() => deleteList(selectedListId)} className="liquid-glass p-2 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors" title="Excluir Lista Selecionada">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase text-white/50 px-1 font-medium tracking-wider">Salvar Lista Alvo</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        placeholder="Nome da lista" 
                        className="liquid-glass flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
                      />
                      <button onClick={saveCurrentList} className="liquid-glass p-2 rounded-xl hover:bg-white/10" title="Salvar Lista">
                        <Save size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                  <input 
                    type="text" 
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    placeholder="Filtrar na lista alvo..."
                    className="liquid-glass w-full rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
                {targetContacts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/50 text-center p-6">
                    <Plus size={32} className="mb-4 opacity-50" />
                    <p className="text-sm">A lista de disparo está vazia.</p>
                    <p className="text-xs mt-1">Selecione contatos à esquerda e clique em Mover, ou carregue uma lista salva acima.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center px-4 py-2 text-[10px] uppercase tracking-wider text-white/50 font-medium sticky top-0 bg-black/20 backdrop-blur-md rounded-lg mb-2 z-10">
                      <input 
                        type="checkbox" 
                        checked={targetContacts.length > 0 && selectedTargetContacts.size === filteredTargetContacts.length}
                        onChange={toggleAllTargetSelection}
                        className="mr-4 rounded-sm border-white/30 bg-white/10 text-white focus:ring-0 w-3.5 h-3.5 cursor-pointer appearance-none checked:bg-white checked:border-white relative before:content-[''] before:block before:w-1.5 before:h-2.5 before:border-r-2 before:border-b-2 before:border-black before:absolute before:left-1 before:top-0 before:rotate-45 before:opacity-0 checked:before:opacity-100"
                      />
                      <div className="flex-1">Lista Alvo ({filteredTargetContacts.length})</div>
                    </div>
                    
                    {filteredTargetContacts.map(contact => (
                      <div key={contact.id} onClick={() => toggleTargetSelection(contact.id)} className={`rounded-xl p-2.5 flex items-center transition-all cursor-pointer border ${selectedTargetContacts.has(contact.id) ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedTargetContacts.has(contact.id)}
                          readOnly
                          className="ml-1 mr-4 rounded-sm border-white/20 bg-black/40 text-emerald-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer appearance-none checked:bg-emerald-500 checked:border-emerald-500 relative before:content-[''] before:block before:w-1.5 before:h-2.5 before:border-r-2 before:border-b-2 before:border-black before:absolute before:left-1 before:top-0 before:rotate-45 before:opacity-0 checked:before:opacity-100"
                        />
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-sm font-medium text-white truncate leading-tight">{contact.name || contact.pushName || 'Desconhecido'}</span>
                          <span className="text-xs text-white/50 truncate mt-0.5">{contact.number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-white/5 mt-auto flex gap-3">
                <button 
                  onClick={removeSelectedFromTarget}
                  disabled={selectedTargetContacts.size === 0}
                  className="liquid-glass border border-white/10 rounded-2xl px-5 py-3.5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 text-white/70"
                  title="Remover selecionados"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => nextScreen(3)}
                  disabled={targetContacts.length === 0}
                  className="flex-1 bg-white text-black hover:bg-white/90 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:bg-white/20 disabled:text-white/50 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                >
                  <span className="text-sm font-semibold">Avançar para Mensagem</span>
                  <ArrowRight size={16} />
                </button>
              </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: BROADCAST */}
        {currentScreen === 3 && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full">
            
            {/* Left Panel: Compose Message */}
            <div className="w-full lg:w-1/2 bg-black/30 backdrop-blur-xl border border-white/5 shadow-inner rounded-[2rem] p-6 lg:p-8 flex flex-col relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
              
              <div className="relative z-10 flex flex-col h-full w-full">
                <button onClick={() => setCurrentScreen(2)} className="flex items-center gap-2 text-white/50 hover:text-white text-xs mb-8 transition-colors w-max font-medium uppercase tracking-wider">
                <ArrowLeft size={14} /> Voltar
              </button>

              <h2 className="text-4xl font-light tracking-tight text-white mb-10">
                Configure a <span className="font-serif italic text-white/80">Mensagem</span>
              </h2>

              <div className="space-y-6 flex-1">
                {/* Message Input */}
                <div>
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-3">Texto da Mensagem</label>
                  <div className="relative">
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Olá, {nome}! Tudo bem? Gostaria de compartilhar algo especial com você."
                      className="liquid-glass w-full h-48 rounded-2xl p-5 text-sm text-white placeholder-white/40 resize-none outline-none focus:ring-1 focus:ring-white/30 transition-all"
                    />
                    <button 
                      onClick={insertNamePlaceholder}
                      className="absolute bottom-4 right-4 liquid-glass-strong text-xs font-medium px-3 py-1.5 rounded-full hover:scale-105 transition-transform bg-white/5"
                    >
                      + NOME
                    </button>
                  </div>
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-3">Imagens até 3 (Opcional)</label>
                  
                  {mediaAttachments.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {mediaAttachments.map((media) => (
                        <div key={media.id} className="liquid-glass rounded-xl p-3 flex items-center justify-between group hover:bg-white/5 transition-colors border border-white/5">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <ImageIcon size={16} className="text-white" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-white/90 truncate">{media.name}</span>
                              <span className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1"><CheckCircle2 size={10} /> Pronto</span>
                            </div>
                          </div>
                          <button onClick={() => removeMedia(media.id)} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5 shrink-0 ml-2">
                            <Trash2 size={14} className="text-white/80 hover:text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="liquid-glass rounded-2xl h-16 flex items-center justify-center relative group hover:bg-white/5 transition-colors border border-white/5 border-dashed cursor-pointer">
                    <label className="flex items-center justify-center w-full h-full cursor-pointer gap-3">
                      <Upload size={16} className="text-white/50 group-hover:text-white transition-colors" />
                      <span className="text-sm font-medium text-white/50 group-hover:text-white transition-colors">Clique para anexar mídias</span>
                      <input type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                
                {/* Text Position Options */}
                {mediaAttachments.length > 0 && message && (
                  <div className="mt-6 space-y-3">
                    <label className="block text-xs font-medium text-white/60 uppercase tracking-wider">Como enviar o texto?</label>
                    <div className="grid grid-cols-1 gap-2">

                      {mediaAttachments.length === 1 && (
                        <label className={`liquid-glass rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors ${textPosition === 'caption' ? 'bg-white/10 border-white/20' : 'hover:bg-white/5 border-white/5 border'}`}>
                          <input type="radio" name="textPosition" checked={textPosition === 'caption'} onChange={() => setTextPosition('caption')} className="accent-green-500 w-4 h-4" />
                          <span className="text-sm text-white/90">Texto colado na imagem (Legenda)</span>
                        </label>
                      )}
                      <label className={`liquid-glass rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors ${textPosition === 'after' ? 'bg-white/10 border-white/20' : 'hover:bg-white/5 border-white/5 border'}`}>
                        <input type="radio" name="textPosition" checked={textPosition === 'after'} onChange={() => setTextPosition('after')} className="accent-green-500 w-4 h-4" />
                        <span className="text-sm text-white/90">Imagens primeiro, Texto depois</span>
                      </label>
                      <label className={`liquid-glass rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors ${textPosition === 'before' ? 'bg-white/10 border-white/20' : 'hover:bg-white/5 border-white/5 border'}`}>
                        <input type="radio" name="textPosition" checked={textPosition === 'before'} onChange={() => setTextPosition('before')} className="accent-green-500 w-4 h-4" />
                        <span className="text-sm text-white/90">Texto primeiro, Imagens depois</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Right Panel: Summary & Console */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              
              {/* Preview Card */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/5 shadow-inner rounded-[2rem] p-6 shrink-0 flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
                
                <div className="relative z-10 flex flex-col h-full w-full">
                  <h3 className="text-xs text-white/50 uppercase tracking-[0.2em] font-semibold mb-4 text-center">Preview da Mensagem</h3>
                
                <div className="relative rounded-2xl overflow-hidden min-h-[250px] border border-white/5 shadow-inner bg-black/40 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-repeat opacity-20 pointer-events-none" style={{backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: '400px'}}></div>
                  
                  <div className="relative z-10 p-4 flex flex-col gap-2 h-full">
                    {/* TEXT BEFORE MEDIA */}
                    {mediaAttachments.length > 0 && textPosition === 'before' && message && (
                      <div className="self-end bg-[#005c4b] text-[#e9edef] p-2 px-3 rounded-lg rounded-tr-none max-w-[85%] shadow-md">
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{message.replace(/{nome}/gi, 'João da Silva')}</p>
                      </div>
                    )}

                    {/* CAPTION MEDIA */}
                    {mediaAttachments.length === 1 && textPosition === 'caption' && mediaAttachments.map((media, index) => (
                      <div key={'prev-media-cap'} className="self-end bg-[#005c4b] text-[#e9edef] p-1.5 rounded-lg rounded-tr-none max-w-[85%] shadow-md">
                        {media.type.startsWith('image/') ? (
                           <img src={media.base64} alt="preview" className="rounded-md max-w-full object-cover mb-1" style={{maxHeight: '220px'}} />
                        ) : (
                           <div className="bg-black/30 w-full h-24 flex flex-col gap-2 items-center justify-center rounded-md mb-1 px-4 text-center text-white/60"><Play size={24} className="opacity-50"/><span className="text-[10px]">{media.name}</span></div>
                        )}
                        {message && (
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap px-1 pb-1 pt-1 break-words">{message.replace(/{nome}/gi, 'João da Silva')}</p>
                        )}
                      </div>
                    ))}

                    {/* REGULAR MEDIA */}
                    {mediaAttachments.length > 0 && textPosition !== 'caption' && mediaAttachments.map((media, index) => (
                      <div key={'prev-media-'+index} className="self-end bg-[#005c4b] text-[#e9edef] p-1.5 rounded-lg rounded-tr-none max-w-[85%] shadow-md">
                        {media.type.startsWith('image/') ? (
                           <img src={media.base64} alt="preview" className="rounded-md max-w-full object-cover mb-1" style={{maxHeight: '220px'}} />
                        ) : (
                           <div className="bg-black/30 w-full h-24 flex flex-col gap-2 items-center justify-center rounded-md mb-1 px-4 text-center text-white/60"><Play size={24} className="opacity-50"/><span className="text-[10px]">{media.name}</span></div>
                        )}
                      </div>
                    ))}

                  {/* TEXT AFTER MEDIA */}
                  {mediaAttachments.length > 0 && textPosition === 'after' && message && (
                    <div className="relative z-10 self-end bg-[#005c4b] text-[#e9edef] p-2 px-3 rounded-lg rounded-tr-none max-w-[85%] shadow-md">
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{message.replace(/{nome}/gi, 'João da Silva')}</p>
                    </div>
                  )}

                  {/* TEXT ONLY (No Media) */}
                  {mediaAttachments.length === 0 && message && (
                    <div className="relative z-10 self-end bg-[#005c4b] text-[#e9edef] p-2 px-3 rounded-lg rounded-tr-none max-w-[85%] shadow-md">
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{message.replace(/{nome}/gi, 'João da Silva')}</p>
                    </div>
                  )}

                  {/* EMPTY STATE */}
                  {!message && mediaAttachments.length === 0 && (
                     <div className="relative z-10 m-auto bg-black/40 text-white/50 px-4 py-2 rounded-full text-xs backdrop-blur-md border border-white/10">
                        A prévia aparecerá aqui
                     </div>
                  )}
                  </div>
                </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/5 shadow-inner rounded-[2rem] p-6 lg:p-10 shrink-0 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
                <h3 className="text-xs text-white/50 uppercase tracking-[0.2em] font-semibold mb-4">Resumo do Disparo</h3>
                <div className="text-7xl font-light tracking-tighter text-white mb-3">
                  {targetContacts.length}
                </div>
                <p className="text-sm text-white/60 font-medium">contatos na fila de envio</p>
                
                {!isSending ? (
                  <button 
                    onClick={startBroadcast}
                    disabled={targetContacts.length === 0 || (!message && mediaAttachments.length === 0)}
                    className="mt-10 bg-white text-black rounded-full pl-8 pr-3 py-3 flex items-center gap-6 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:bg-white/20 disabled:text-white shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    <span className="text-base font-semibold">Iniciar Disparo</span>
                    <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center">
                      <Play size={20} fill="currentColor" className="text-black ml-1" />
                    </div>
                  </button>
                ) : (
                  <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => {
                        isPausedRef.current = !isPausedRef.current;
                        setIsPausedUI(isPausedRef.current);
                      }}
                      className={`liquid-glass rounded-full pl-6 pr-3 py-2 flex items-center gap-4 transition-all hover:scale-105 \${isPausedUI ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-white/10 text-white border-white/20'} border`}
                    >
                      <span className="text-sm font-semibold">{isPausedUI ? 'Retomar' : 'Pausar'}</span>
                      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                        {isPausedUI ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        isCancelledRef.current = true;
                      }}
                      className="liquid-glass border border-red-500/50 bg-red-500/10 text-red-400 rounded-full pl-6 pr-3 py-2 flex items-center gap-4 transition-all hover:scale-105 hover:bg-red-500/20"
                    >
                      <span className="text-sm font-semibold">Cancelar</span>
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Square size={14} fill="currentColor" />
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Activity Console */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/5 shadow-inner rounded-[2rem] flex-1 flex flex-col overflow-hidden min-h-[250px]">
                 <div className="px-6 py-5 flex justify-between items-center border-b border-white/5">
                   <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Console de Atividade</span>
                   <button onClick={clearLogs} className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white/80 transition-colors">Limpar</button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-5 text-xs font-mono space-y-3 custom-scrollbar">
                   {logs.length === 0 ? (
                     <div className="text-white/30 h-full flex items-center justify-center italic">Nenhuma atividade recente.</div>
                   ) : (
                     logs.map(log => (
                       <div key={log.id} className="flex items-start gap-3">
                         <span className="text-white/30 shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                         <span className={`break-all ${
                           log.status === 'error' ? 'text-red-400' : 
                           log.status === 'success' ? 'text-emerald-400' : 
                           'text-white/70'
                         }`}>
                           {log.text}
                         </span>
                       </div>
                     ))
                   )}
                   <div ref={logsEndRef} />
                 </div>
              </div>

            </div>
          </div>
        )}

            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}} />
    </div>
  );
}

export default AppV2;
