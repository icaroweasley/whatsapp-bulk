import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Trash2, Plus, ArrowLeft, Save, Loader2 } from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  instances: string;
  createdAt: string;
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api-proxy/api/admin/users`, {
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
      const res = await fetch(`/api-proxy/api/admin/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-target-url': API_URL
        },
        body: JSON.stringify({ 
          username: newUsername, 
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
      const res = await fetch(`/api-proxy/api/admin/users/${deletingUser.id}`, {
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

  if (user?.username !== 'karu') {
    return <div className="p-10 text-white text-center">Acesso Negado</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl overflow-y-auto p-4 lg:p-10 font-sans text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 liquid-glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                <Users className="text-purple-400" />
                Painel Administrativo
              </h1>
              <p className="text-white/50">Gerencie as contas dos seus clientes e as instâncias liberadas.</p>
            </div>
          </div>
          
          {!isCreating && (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-3 flex items-center gap-2 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
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
        <div className="liquid-panel rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-white/50" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Usuário</th>
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Instâncias Liberadas</th>
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider">Data de Criação</th>
                  <th className="p-6 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-6 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      {u.username}
                      {u.username === 'karu' && <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Admin</span>}
                    </td>
                    <td className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {u.instances.split(',').map(inst => inst.trim()).filter(Boolean).map((inst, i) => (
                          <span key={i} className="bg-white/10 border border-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
                            {inst}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-6 text-white/50 text-sm">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-6 text-right">
                      {u.username !== 'karu' ? (
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors ml-auto"
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
    </div>
  );
}
