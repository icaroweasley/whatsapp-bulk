import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Trash2, Plus, ArrowLeft, Save, Loader2, Settings } from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  instances: string;
  createdAt: string;
  planStatus: string;
  planExpiresAt: string | null;
  customPrice: number | null;
  mpCustomerId?: string | null;
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const { token, user, refreshUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const API_URL = rawUrl.replace(/\/$/, '').replace('163.176.37.93:3001', '163.176.37.93:8080');
  
  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newInstances, setNewInstances] = useState('');

  // Delete User Confirmation State
  const [deletingUser, setDeletingUser] = useState<{ id: string, username: string } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Delete Instance State
  const [deletingInstance, setDeletingInstance] = useState<{ userId: string, username: string, instanceName: string, currentInstances: string } | null>(null);
  const [isDeletingInstanceLoading, setIsDeletingInstanceLoading] = useState(false);
  const [deleteInstanceError, setDeleteInstanceError] = useState('');

  // Add Instance State
  const [addingInstanceTo, setAddingInstanceTo] = useState<{ id: string, username: string, currentInstances: string } | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isAddingInstance, setIsAddingInstance] = useState(false);

  // Edit Plan State
  const [editingPlanFor, setEditingPlanFor] = useState<UserItem | null>(null);
  const [editPlanStatus, setEditPlanStatus] = useState('');
  const [editPlanExpiresAt, setEditPlanExpiresAt] = useState('');
  const [editCustomPrice, setEditCustomPrice] = useState('');
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  // Edit Password State
  const [editingPasswordFor, setEditingPasswordFor] = useState<UserItem | null>(null);
  const [newAdminUserPassword, setNewAdminUserPassword] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-target-url': API_URL
        }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newInstances) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-target-url': API_URL
        },
        body: JSON.stringify({ 
          username: newUsername.trim(), 
          password: newPassword, 
          instances: newInstances 
        })
      });

      if (res.ok) {
        alert("Usuário criado com sucesso!");
        setNewUsername('');
        setNewPassword('');
        setNewInstances('');
        setIsCreating(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar usuário");
      }
    } catch (e) {
      alert("Erro de conexão");
    }
  };

  const handleDeleteUser = (id: string, username: string) => {
    if (username === 'karu') {
      alert("Você não pode excluir o administrador principal.");
      return;
    }
    setDeletingUser({ id, username });
    setConfirmPassword('');
    setDeleteError('');
  };

  const submitDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingUser) return;
    if (!confirmPassword) {
      setDeleteError("Por favor, digite sua senha.");
      return;
    }

    setIsDeletingLoading(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-target-url': API_URL
        },
        body: JSON.stringify({ adminPassword: confirmPassword })
      });

      if (res.ok) {
        setDeletingUser(null);
        setConfirmPassword('');
        fetchUsers();
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Senha incorreta ou erro ao excluir.");
      }
    } catch (e) {
      setDeleteError("Erro de conexão com o servidor.");
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const submitDeleteInstance = async () => {
    if (!deletingInstance) return;
    setIsDeletingInstanceLoading(true);
    setDeleteInstanceError('');

    try {
      const baseUrl = import.meta.env.VITE_EVOLUTION_URL || '';
      let cleanBaseUrl = baseUrl.trim().replace(/\/$/, '');
      if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
        cleanBaseUrl = 'https://' + cleanBaseUrl;
      }
      const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY || '';

      // 1. Delete from Evolution API (logout and remove from db)
      try {
        await fetch(`/api-proxy/instance/logout/${deletingInstance.instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': apiKey, 'x-target-url': cleanBaseUrl }
        });
        // IMPORTANTE: Aguarda 2.5 segundos para dar tempo do WhatsApp processar o logout no celular
        // antes de destruirmos a instância no servidor.
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch(e) {
        console.error("Erro ao deslogar", e);
      }

      const evoRes = await fetch(`/api-proxy/instance/delete/${deletingInstance.instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey, 'x-target-url': cleanBaseUrl }
      });

      if (!evoRes.ok && evoRes.status !== 404) {
        console.error("Erro ao deletar da Evolution API", await evoRes.text());
      }

      // Limpa também do localStorage do próprio Admin caso seja uma instância dele
      try {
        const savedStr = localStorage.getItem('evolution_saved_instances');
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          const filtered = saved.filter((i: any) => i.instanceName !== deletingInstance.instanceName);
          localStorage.setItem('evolution_saved_instances', JSON.stringify(filtered));
        }
      } catch(e) {}

      // 2. Remove from local database
      const updatedInstancesArray = deletingInstance.currentInstances
        .split(',')
        .map(i => i.trim())
        .filter(i => i && i !== deletingInstance.instanceName);
      
      const newInstancesStr = updatedInstancesArray.join(',');

      const res = await fetch(`/api/admin/users/${deletingInstance.userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-target-url': API_URL
        },
        body: JSON.stringify({ instances: newInstancesStr, username: deletingInstance.username })
      });

      if (res.ok) {
        setDeletingInstance(null);
        fetchUsers();
        if (deletingInstance.userId === user?.id) {
          refreshUser();
        }
      } else {
        const data = await res.json();
        setDeleteInstanceError(data.error || "Erro ao atualizar usuário no banco local.");
      }
    } catch (e) {
      setDeleteInstanceError("Erro de conexão com o servidor.");
    } finally {
      setIsDeletingInstanceLoading(false);
    }
  };

  if (user?.username !== 'karu') {
    return <div className="p-10 text-white text-center">Acesso Negado</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl overflow-y-auto p-4 lg:p-10 font-sans text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-start md:items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 shrink-0 liquid-glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors mt-1 md:mt-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3 mb-1 md:mb-0 leading-tight">
                <Users className="text-purple-400 shrink-0" />
                Painel Administrativo
              </h1>
              <p className="text-white/50 text-sm md:text-base mt-2 md:mt-0 leading-relaxed">Gerencie as contas dos seus clientes e as instâncias liberadas.</p>
            </div>
          </div>
          
          {!isCreating && (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-3 flex items-center gap-2 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all shrink-0 self-start md:self-auto ml-14 md:ml-0"
            >
              <Plus size={18} /> Novo Cliente
            </button>
          )}
        </div>

        {isCreating && (
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-white/5 mb-10 shadow-2xl">
            <h2 className="text-xl font-semibold mb-6">Cadastrar Novo Cliente</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Usuário</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                  placeholder="ex: loja_do_joao"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Senha</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                  placeholder="Senha forte"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Instâncias Liberadas</label>
                <input
                  type="text"
                  value={newInstances}
                  onChange={e => setNewInstances(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                  placeholder="ex: inst1, inst2"
                />
                <p className="text-xs text-white/40 mt-2 ml-1">Separe os nomes por vírgula para dar acesso a múltiplas instâncias.</p>
              </div>
              
              <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="liquid-glass border border-white/10 text-white rounded-full px-6 py-3 font-semibold transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-white text-black rounded-full px-8 py-3 flex items-center gap-2 font-semibold hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  <Save size={18} /> Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Clientes */}
        <div className="liquid-panel rounded-[2rem] border border-white/10 bg-white/5 overflow-x-auto shadow-xl custom-scrollbar">
          {isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-white/50" /></div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Usuário</th>
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Assinatura</th>
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Instâncias Liberadas</th>
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Data de Criação</th>
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...users].sort((a, b) => a.username === 'karu' ? -1 : b.username === 'karu' ? 1 : a.username.localeCompare(b.username)).map((u) => (
                  <tr key={u.id} className={`transition-colors ${u.username === 'karu' ? 'border-b-4 border-white/10 bg-white/5' : 'border-b border-white/5 hover:bg-white/5'}`}>
                    <td className="p-6 font-medium flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${u.username === 'karu' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10'}`}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      {u.username}
                      {u.username === 'karu' && <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">Owner</span>}
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${u.planStatus === 'active' || u.username === 'karu' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {u.planStatus === 'active' || u.username === 'karu' ? 'ATIVO' : 'INATIVO'}
                          </span>
                          {u.username === 'karu' ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_5px_rgba(245,158,11,0.2)]">
                              Vitalício
                            </span>
                          ) : (
                            (u.planStatus === 'active' || u.planExpiresAt) && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${u.mpCustomerId ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                {u.mpCustomerId ? 'Pago' : 'Trial'}
                              </span>
                            )
                          )}
                        </div>
                        {u.planExpiresAt && u.username !== 'karu' && (
                          <span className="text-[10px] text-white/40">
                            Vence: {new Date(u.planExpiresAt).toLocaleDateString()}
                          </span>
                        )}
                        {u.customPrice !== null && u.username !== 'karu' && (
                          <span className="text-[10px] text-yellow-400/80 font-medium">
                            R$ {u.customPrice} fixo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-2 items-center">
                        {(u.instances || '').split(',').map(inst => inst.trim()).filter(Boolean).map((inst, i) => (
                          <div key={i} className="flex items-center bg-white/10 border border-white/10 rounded-full pr-1 overflow-hidden">
                            <span className="text-white/80 text-xs px-3 py-1">
                              {inst}
                            </span>
                            <button
                              onClick={() => setDeletingInstance({ userId: u.id, username: u.username, instanceName: inst, currentInstances: u.instances })}
                              className="w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-300 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                              title="Apagar Instância (Nuvem e Painel)"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => { setAddingInstanceTo({ id: u.id, username: u.username, currentInstances: u.instances }); setNewInstanceName(''); }}
                          className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 text-white/50 rounded-full hover:bg-white/10 hover:text-white transition-colors ml-1"
                          title="Adicionar Instância"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-6 text-white/50 text-sm">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-6 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingPlanFor(u);
                          setEditPlanStatus(u.planStatus);
                          setEditPlanExpiresAt(u.planExpiresAt ? new Date(u.planExpiresAt).toISOString().split('T')[0] : '');
                          setEditCustomPrice(u.customPrice ? u.customPrice.toString() : '');
                        }}
                        className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                        title="Editar Assinatura/Valores"
                      >
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingPasswordFor(u);
                          setNewAdminUserPassword('');
                        }}
                        className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center justify-center hover:bg-yellow-500/20 transition-colors"
                        title="Alterar Senha"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </button>
                      {u.username !== 'karu' ? (
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                          title="Excluir Cliente"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full bg-white/5 text-white/20 flex items-center justify-center cursor-not-allowed ml-auto"
                          title="Administrador Principal (Não pode ser excluído)"
                        >
                          <Trash2 size={16} className="opacity-40" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Sleek Password Confirmation Modal for Deleting User */}
      {deletingUser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-black/60 max-w-md w-full shadow-2xl relative z-50">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-red-400">
              <Trash2 size={20} />
              Confirmar Exclusão
            </h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Você está prestes a excluir permanentemente o cliente <span className="font-semibold text-white">@{deletingUser.username}</span> e todas as suas listas.
              <br />
              <span className="text-xs text-white/50 block mt-2">Para confirmar, digite a sua senha de administrador:</span>
            </p>

            <form onSubmit={submitDeleteUser} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all font-medium text-center tracking-widest text-lg"
                  placeholder="••••••••"
                  autoFocus
                />
                {deleteError && (
                  <p className="text-xs text-red-400 mt-2 font-medium">{deleteError}</p>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  disabled={isDeletingLoading}
                  className="liquid-glass border border-white/10 text-white rounded-full px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeletingLoading}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-3 text-sm font-semibold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingLoading ? (
                    <>
                      <Loader2 className="animate-spin text-white" size={16} /> Excluindo...
                    </>
                  ) : (
                    "Confirmar Exclusão"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instance Deletion Confirmation Modal */}
      {deletingInstance && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-black/60 max-w-md w-full shadow-2xl relative z-50">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-red-400">
              <Trash2 size={20} />
              Apagar Instância
            </h3>
            <div className="text-sm text-white/70 mb-6 leading-relaxed">
              Você está prestes a excluir a instância <strong className="text-white">"{deletingInstance.instanceName}"</strong> do usuário <strong className="text-white">{deletingInstance.username}</strong>.
              <br /><br />
              Esta ação irá desconectar o WhatsApp na Evolution API e apagar os dados da nuvem. Deseja continuar?
            </div>

            {deleteInstanceError && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl">
                {deleteInstanceError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setDeletingInstance(null)}
                className="liquid-glass border border-white/10 text-white rounded-full px-6 py-3 font-semibold transition-colors hover:bg-white/10"
              >
                Cancelar
              </button>
              <button 
                onClick={submitDeleteInstance}
                disabled={isDeletingInstanceLoading}
                className="bg-red-500 text-white rounded-full px-8 py-3 flex items-center gap-2 font-semibold hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
              >
                {isDeletingInstanceLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Instance Modal */}
      {addingInstanceTo && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-black/60 max-w-md w-full shadow-2xl relative z-50">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Plus size={20} className="text-purple-400" />
              Adicionar Instância
            </h3>
            <div className="text-sm text-white/70 mb-6 leading-relaxed">
              Adicionando nova instância para o usuário <strong className="text-white">{addingInstanceTo.username}</strong>.
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newInstanceName) return;
              setIsAddingInstance(true);
              try {
                const updatedInstancesArray = addingInstanceTo.currentInstances
                  .split(',')
                  .map(i => i.trim())
                  .filter(Boolean);
                updatedInstancesArray.push(newInstanceName.trim());
                
                const newInstancesStr = updatedInstancesArray.join(',');

                const res = await fetch(`/api/admin/users/${addingInstanceTo.id}`, {
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-target-url': API_URL
                  },
                  body: JSON.stringify({ instances: newInstancesStr, username: addingInstanceTo.username })
                });

                if (res.ok) {
                  setAddingInstanceTo(null);
                  fetchUsers();
                  if (addingInstanceTo.id === user?.id) {
                    refreshUser();
                  }
                } else {
                  alert("Erro ao adicionar instância.");
                }
              } catch (e) {
                alert("Erro de conexão.");
              } finally {
                setIsAddingInstance(false);
              }
            }}>
              <input
                type="text"
                value={newInstanceName}
                onChange={e => setNewInstanceName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium mb-6"
                placeholder="Nome da nova instância..."
                autoFocus
              />

              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setAddingInstanceTo(null)}
                  className="liquid-glass border border-white/10 text-white rounded-full px-6 py-3 font-semibold transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isAddingInstance || !newInstanceName}
                  className="bg-white text-black rounded-full px-8 py-3 flex items-center gap-2 font-semibold hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] disabled:opacity-50"
                >
                  {isAddingInstance ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlanFor && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-black/60 max-w-md w-full shadow-2xl relative z-50">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Settings size={20} className="text-blue-400" />
              Editar Assinatura e Preço
            </h3>
            <div className="text-sm text-white/70 mb-6 leading-relaxed">
              Configurações para o cliente <strong className="text-white">{editingPlanFor.username}</strong>.
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsEditingPlan(true);
              try {
                const res = await fetch(`/api/admin/users/${editingPlanFor.id}`, {
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ 
                    username: editingPlanFor.username,
                    instances: editingPlanFor.instances,
                    planStatus: editPlanStatus,
                    planExpiresAt: editPlanExpiresAt ? editPlanExpiresAt : null,
                    customPrice: editCustomPrice ? parseFloat(editCustomPrice) : null
                  })
                });

                if (res.ok) {
                  setEditingPlanFor(null);
                  fetchUsers();
                  if (editingPlanFor.id === user?.id) {
                    refreshUser();
                  }
                } else {
                  alert("Erro ao editar plano.");
                }
              } catch (e) {
                alert("Erro de conexão.");
              } finally {
                setIsEditingPlan(false);
              }
            }}>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Status da Assinatura</label>
                <select 
                  value={editPlanStatus} 
                  onChange={(e) => setEditPlanStatus(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                >
                  <option value="active">Ativo (Pode Disparar)</option>
                  <option value="inactive">Inativo (Bloqueado/Paywall)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Vencimento (Opcional)</label>
                <input
                  type="date"
                  value={editPlanExpiresAt}
                  onChange={e => setEditPlanExpiresAt(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
                <p className="text-xs text-white/40 mt-1 ml-1">Você pode estender o vencimento manualmente (Ex: Trial de 7 dias).</p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Preço Fixo Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editCustomPrice}
                  onChange={e => setEditCustomPrice(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="Ex: 50.00 (Deixe em branco para 100)"
                />
                <p className="text-xs text-white/40 mt-1 ml-1">Se preenchido, será este o valor cobrado no Mercado Pago.</p>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingPlanFor(null)}
                  className="liquid-glass border border-white/10 text-white rounded-full px-6 py-3 font-semibold transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isEditingPlan}
                  className="bg-white text-black rounded-full px-8 py-3 flex items-center gap-2 font-semibold hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] disabled:opacity-50"
                >
                  {isEditingPlan ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      {editingPasswordFor && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-panel rounded-[2rem] p-8 border border-white/10 bg-black/60 max-w-md w-full shadow-2xl relative z-50">
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-yellow-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Alterar Senha do Cliente
            </h3>
            <div className="text-sm text-white/70 mb-6 leading-relaxed">
              Você está definindo uma nova senha para o cliente <strong className="text-white">@{editingPasswordFor.username}</strong>.
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newAdminUserPassword.length < 6) {
                alert("A nova senha deve ter no mínimo 6 caracteres.");
                return;
              }
              setIsEditingPassword(true);
              try {
                const res = await fetch(`/api/admin/users/${editingPasswordFor.id}/password`, {
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ 
                    newPassword: newAdminUserPassword
                  })
                });

                if (res.ok) {
                  alert(`Senha alterada com sucesso para ${newAdminUserPassword}`);
                  setEditingPasswordFor(null);
                } else {
                  const data = await res.json();
                  alert(data.error || "Erro ao alterar a senha.");
                }
              } catch (e) {
                alert("Erro de conexão.");
              } finally {
                setIsEditingPassword(false);
              }
            }}>
              
              <div className="mb-6">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2 ml-1">Nova Senha</label>
                <input
                  type="text"
                  value={newAdminUserPassword}
                  onChange={e => setNewAdminUserPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-medium"
                  placeholder="Mínimo de 6 caracteres"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingPasswordFor(null)}
                  className="liquid-glass border border-white/10 text-white rounded-full px-6 py-3 font-semibold transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isEditingPassword}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-full px-8 py-3 flex items-center gap-2 font-semibold transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
                >
                  {isEditingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
