export interface AuthResponse{
    token: string;
    usuarioId: number;
    nome: string;
    role: 'ROLE_ADMIN' | 'ROLE_PROFISSIONAL' | 'ROLE_CLIENTE';
}

export interface Usuario{
    id: number;
    nome: string;
    email: string;
    telefone?: string;
    role: string;
    ativo?: boolean;
}

export interface Profissional{
    id: number;
    usuario: Usuario;
    especialidades: string[];
}

export interface Servico{
    id: number;
    nome_servico: string;
    descricao: string;
    preco: number;
    duracaoMin: number;
}

export interface Agendamento{
    id: number;
    dataInicio: string;
    dataFim: string;
    status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
    version?: number;
    cliente: Usuario;
    profissional: Profissional;
    servico: Servico;
}

export interface LoginRequest{
    email: string;
    senha: string;
}

export interface AgendamentoRequest{
    profissionalId: number;
    servicoId: number;
    dataHoraInicio: string;
    clienteId?: number;
    guestNome?: string;
    guestTelefone?: string;
}

export interface ServicoRequest{
    nome_servico: string;
    descricao: string;
    preco: number;
    duracaoMin: number;
}

export interface ProfissionalRequest{
    usuarioId: number;
    especialidades: string[];
}

export interface AdminCreateUserRequest{
    nome: string;
    telefone: string;
    email?: string;
}

export interface ForgotPasswordRequest{
    email: string;
}

export interface ResetPasswordRequest{
    token: string;
    newPass: string;
}

export interface RegisterRequest{
    nome: string;
    email: string;
    senha: string;
    telefone: string;
    role: "ROLE_CLIENTE";
}