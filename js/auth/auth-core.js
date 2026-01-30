/**
 * AUTH CORE
 * Central SCI Joinville - Sistema de Autenticação
 * 
 * Gerencia toda a lógica de autenticação:
 * - Login com matrícula/senha
 * - Cadastro de novos usuários
 * - Verificação de matrícula habilitada
 * - Recuperação de senha
 * - Gerenciamento de sessão
 */

import { auth, db, CONFIG } from './firebase-config.js';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

/**
 * CLASSE PRINCIPAL DE AUTENTICAÇÃO
 */
class AuthCore {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.userMatricula = null;
    this.listeners = [];
    
    // Inicializar listener de mudança de autenticação
    this.initAuthStateListener();
  }

  /**
   * LISTENER DE ESTADO DE AUTENTICAÇÃO
   * Detecta quando usuário faz login/logout
   */
  initAuthStateListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário logado
        console.log('🔐 Usuário autenticado:', firebaseUser.uid);
        
        // Buscar dados completos do usuário
        await this.loadUserData(firebaseUser);
        
        // Notificar listeners
        this.notifyListeners('login', this.currentUser);
      } else {
        // Usuário deslogado
        console.log('🔓 Usuário desautenticado');
        this.currentUser = null;
        this.userRole = null;
        this.userMatricula = null;
        
        // Notificar listeners
        this.notifyListeners('logout', null);
      }
    });
  }

  /**
   * CARREGAR DADOS DO USUÁRIO DO FIRESTORE
   */
  async loadUserData(firebaseUser) {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        this.currentUser = {
          uid: firebaseUser.uid,
          email: userData.email,
          displayName: userData.displayName,
          matricula: userData.matricula,
          role: userData.role,
          ativo: userData.ativo,
          cadastradoEm: userData.cadastradoEm,
          ultimoAcesso: userData.ultimoAcesso
        };
        
        this.userRole = userData.role;
        this.userMatricula = userData.matricula;
        
        // Atualizar último acesso
        await updateDoc(doc(db, 'usuarios', firebaseUser.uid), {
          ultimoAcesso: serverTimestamp()
        });
        
        console.log('✅ Dados do usuário carregados:', this.currentUser.matricula);
        
      } else {
        console.error('❌ Documento do usuário não encontrado no Firestore');
        // Usuário existe no Auth mas não no Firestore (situação anômala)
        await this.logout();
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * VALIDAR FORMATO DE MATRÍCULA
   * Retorna: { valid: boolean, message: string }
   */
  validateMatricula(matricula) {
    if (!matricula || matricula.trim() === '') {
      return { valid: false, message: 'Matrícula é obrigatória' };
    }
    
    const matriculaUpper = matricula.toUpperCase().trim();
    
    if (!CONFIG.matriculaPattern.test(matriculaUpper)) {
      return { 
        valid: false, 
        message: 'Matrícula deve ter 3 letras seguidas de 4 números (ex: ABC1234)' 
      };
    }
    
    return { valid: true, matricula: matriculaUpper };
  }

  /**
   * VALIDAR SENHA
   * Retorna: { valid: boolean, message: string }
   */
  validateSenha(senha) {
    if (!senha || senha.length < CONFIG.senhaMinLength) {
      return { 
        valid: false, 
        message: `Senha deve ter no mínimo ${CONFIG.senhaMinLength} caracteres` 
      };
    }
    
    const requirements = CONFIG.senhaRequirements;
    const errors = [];
    
    if (requirements.uppercase && !/[A-Z]/.test(senha)) {
      errors.push('uma letra maiúscula');
    }
    
    if (requirements.lowercase && !/[a-z]/.test(senha)) {
      errors.push('uma letra minúscula');
    }
    
    if (requirements.number && !/\d/.test(senha)) {
      errors.push('um número');
    }
    
    if (requirements.special) {
      const specialRegex = new RegExp(`[${CONFIG.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
      if (!specialRegex.test(senha)) {
        errors.push('um caractere especial');
      }
    }
    
    if (errors.length > 0) {
      return {
        valid: false,
        message: `Senha deve conter pelo menos: ${errors.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  /**
   * VERIFICAR SE MATRÍCULA ESTÁ HABILITADA
   * Retorna: { habilitada: boolean, usada: boolean, role: string }
   */
  async verificarMatriculaHabilitada(matricula) {
    try {
      const matriculaDoc = await getDoc(doc(db, 'matriculas', matricula));
      
      if (!matriculaDoc.exists()) {
        return { 
          habilitada: false, 
          message: 'Matrícula
