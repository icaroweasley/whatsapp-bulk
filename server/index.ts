import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_charlie_key_2026';

app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req: any, res: any, next: any) => {
  authenticateToken(req, res, () => {
    if (req.user.username !== 'karu') return res.status(403).json({ error: 'Acesso negado. Apenas karu.' });
    next();
  });
};

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(400).json({ error: 'Usuário ou senha inválidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Usuário ou senha inválidos' });
    }

    const instancesArray = user.instances.split(',').map(s => s.trim()).filter(Boolean);

    const token = jwt.sign(
      { id: user.id, username: user.username, instances: instancesArray },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, instances: instancesArray } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Admin: Get Users
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, instances: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Admin: Create User
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { username, password, instances } = req.body; // instances is expected to be a comma-separated string
    
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        instances
      }
    });

    res.json({ message: 'Usuário criado com sucesso!', user: { id: user.id, username: user.username, instances: user.instances } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Admin: Update User
app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, instances } = req.body;
    
    const data: any = { username, instances };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });

    res.json({ message: 'Usuário atualizado!', user: { id: user.id, username: user.username, instances: user.instances } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Admin: Delete User
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ error: 'Senha de confirmação necessária' });
    }

    const adminUser = await prisma.user.findUnique({ where: { username: 'karu' } });
    if (!adminUser) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }

    const isValid = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha de administrador incorreta!' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuário excluído com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});


// Get User's Lists
app.get('/api/lists', authenticateToken, async (req: any, res: any) => {
  try {
    const lists = await prisma.savedList.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedLists = lists.map(list => ({
      ...list,
      contacts: JSON.parse(list.contacts)
    }));

    res.json(formattedLists);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar listas' });
  }
});

// Create/Update List
app.post('/api/lists', authenticateToken, async (req: any, res: any) => {
  try {
    const { id, name, contacts } = req.body;
    const userId = req.user.id;

    let savedList;
    if (id) {
      const existingList = await prisma.savedList.findUnique({ where: { id } });
      if (existingList?.userId !== userId) {
        return res.status(403).json({ error: 'Acesso negado a esta lista' });
      }

      savedList = await prisma.savedList.update({
        where: { id },
        data: { name, contacts: JSON.stringify(contacts) }
      });
    } else {
      savedList = await prisma.savedList.create({
        data: {
          name,
          contacts: JSON.stringify(contacts),
          userId
        }
      });
    }

    res.json({ ...savedList, contacts: JSON.parse(savedList.contacts) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar lista' });
  }
});

// Delete List
app.delete('/api/lists/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingList = await prisma.savedList.findUnique({ where: { id } });
    if (!existingList) return res.status(404).json({ error: 'Lista não encontrada' });
    if (existingList.userId !== userId) return res.status(403).json({ error: 'Acesso negado' });

    await prisma.savedList.delete({ where: { id } });
    res.json({ message: 'Lista deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar lista' });
  }
});

// Get Current User Info
app.get('/api/auth/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    const instancesArray = user.instances.split(',').map(s => s.trim()).filter(Boolean);
    res.json({ user: { id: user.id, username: user.username, instances: instancesArray } });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
