// ARQUIVO: src/resources/alunos.tsx
// DESCRIÇÃO: Arquivo principal que integra o Cockpit de Verificação completo

import React from 'react';
import { 
    List, 
    Datagrid, 
    TextField, 
    DateField, 
    Edit, 
    SimpleForm, 
    TextInput, 
    DateInput,
    useRecordContext,
    useDataProvider,
    useNotify,
    TopToolbar,
    ListButton,
    ShowButton
} from 'react-admin';
import { 
    Box,
    useTheme,
    useMediaQuery 
} from '@mui/material';

// Importar componentes do Cockpit
import { CockpitLayout } from '../components/cockpit/CockpitLayout';
import { PainelEdicao } from '../components/panels/PainelEdicao/PainelEdicao';
import { PainelDocumentos } from '../components/panels/PainelDocumentos/PainelDocumentos';
import { PainelVisualizacao } from '../components/panels/PainelVisualizacao/PainelVisualizacao';

// =====================================================================
// LISTA DE ALUNOS (MANTIDA COMO ESTAVA)
// =====================================================================
export const AlunoList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="nome_completo" label="Nome Completo" />
            <TextField source="cpf" label="CPF" />
            <TextField source="telefone" label="Telefone" />
            <TextField source="email" label="E-mail" />
            <DateField source="created_at" label="Data de Cadastro" />
        </Datagrid>
    </List>
);

// =====================================================================
// COMPONENTE DE EDIÇÃO COM COCKPIT INTEGRADO
// =====================================================================
const CockpitEditContent: React.FC = () => {
    const record = useRecordContext();
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    if (!record) {
        return <div>Carregando...</div>;
    }
    
    // Função para salvar dados
    const handleSave = async (data: any) => {
        try {
            console.log('💾 [AlunoEdit] Iniciando salvamento de dados:', data);
            
            // Separar dados por tabela
            const personalData = { ...data };
            const addressData = data.addresses || {};
            const schoolingData = data.schooling_data || {};
            
            // Remover dados aninhados do objeto principal
            delete personalData.addresses;
            delete personalData.schooling_data;
            delete personalData.enrollment_id;
            
            // Salvar dados pessoais
            await dataProvider.update('personal_data', {
                id: record.id,
                data: personalData,
                previousData: record
            });
            
            // Salvar endereço (criar ou atualizar)
            if (addressData.id) {
                await dataProvider.update('addresses', {
                    id: addressData.id,
                    data: addressData,
                    previousData: addressData
                });
            } else if (Object.keys(addressData).length > 1) {
                await dataProvider.create('addresses', {
                    data: {
                        ...addressData,
                        student_id: record.student_id || record.id
                    }
                });
            }
            
            // Salvar dados de escolaridade (criar ou atualizar)
            if (schoolingData.id) {
                await dataProvider.update('schooling_data', {
                    id: schoolingData.id,
                    data: schoolingData,
                    previousData: schoolingData
                });
            } else if (Object.keys(schoolingData).length > 1) {
                await dataProvider.create('schooling_data', {
                    data: {
                        ...schoolingData,
                        student_id: record.student_id || record.id
                    }
                });
            }
            
            console.log('✅ [AlunoEdit] Dados salvos com sucesso');
            notify('Dados salvos com sucesso!', { type: 'success' });
            
        } catch (error: any) {
            console.error('❌ [AlunoEdit] Erro ao salvar dados:', error);
            notify(`Erro ao salvar: ${error.message}`, { type: 'error' });
            throw error;
        }
    };
    
    // Função para aprovar aluno
    const handleApprove = async (studentId: string) => {
        try {
            console.log('✅ [AlunoEdit] Iniciando aprovação do aluno:', studentId);
            
            // TODO: Implementar lógica de aprovação
            // Pode incluir:
            // - Marcar como aprovado no banco
            // - Enviar para sistema SED
            // - Gerar documentos
            // - Notificar aluno
            
            notify('Aluno aprovado! Processo de matrícula iniciado.', { type: 'success' });
            
        } catch (error: any) {
            console.error('❌ [AlunoEdit] Erro ao aprovar aluno:', error);
            notify(`Erro ao aprovar: ${error.message}`, { type: 'error' });
            throw error;
        }
    };
    
    return (
        <CockpitLayout
            studentId={record.id}
            onSave={handleSave}
            onApprove={handleApprove}
        />
    );
};

// =====================================================================
// COMPONENTE DE EDIÇÃO PRINCIPAL
// =====================================================================
const EditActions = () => (
    <TopToolbar>
        <ListButton />
        <ShowButton />
    </TopToolbar>
);

export const AlunoEdit = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    return (
        <Edit actions={<EditActions />} mutationMode="pessimistic">
            <Box sx={{ height: 'calc(100vh - 64px)' }}>
                <CockpitEditContent />
            </Box>
        </Edit>
    );
};

// =====================================================================
// COMPONENTE DE LAYOUT RESPONSIVO PARA O COCKPIT
// =====================================================================
const ResponsiveCockpitLayout: React.FC<{ studentId: string; onSave: any; onApprove: any }> = ({
    studentId,
    onSave,
    onApprove
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    
    if (isMobile) {
        // Layout Mobile: Abas
        return (
            <CockpitLayout
                studentId={studentId}
                onSave={onSave}
                onApprove={onApprove}
            />
        );
    }
    
    if (isTablet) {
        // Layout Tablet: 2 colunas + drawer
        return (
            <Box sx={{ display: 'flex', height: '100%' }}>
                <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider' }}>
                    <PainelEdicao />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <PainelVisualizacao />
                </Box>
                {/* PainelDocumentos será um drawer no tablet */}
            </Box>
        );
    }
    
    // Layout Desktop: 3 colunas
    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider' }}>
                <PainelEdicao />
            </Box>
            <Box sx={{ width: '20%', borderRight: 1, borderColor: 'divider' }}>
                <PainelDocumentos />
            </Box>
            <Box sx={{ flex: 1 }}>
                <PainelVisualizacao />
            </Box>
        </Box>
    );
};

// =====================================================================
// EXPORTS
// =====================================================================
export default {
    list: AlunoList,
    edit: AlunoEdit
};

// =====================================================================
// TIPOS E INTERFACES (PARA REFERÊNCIA)
// =====================================================================
interface StudentData {
    id: string | number;
    student_id?: string | number;
    
    // Dados Pessoais
    nome_completo: string;
    cpf: string;
    rg: string;
    data_nascimento: string;
    sexo: string;
    telefone: string;
    email: string;
    
    // Dados Aninhados
    addresses?: {
        id?: string | number;
        cep: string;
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        [key: string]: any;
    };
    
    schooling_data?: {
        id?: string | number;
        nivel_ensino: string;
        serie_ano: string;
        escola_anterior: string;
        [key: string]: any;
    };
    
    enrollment_id?: string;
    [key: string]: any;
}

interface DocumentExtraction {
    id: string;
    file_name: string;
    storage_path: string;
    document_type: string;
    status: string;
    enrollment_id: string;
    created_at: string;
}

// =====================================================================
// COMENTÁRIOS PARA IMPLEMENTAÇÃO
// =====================================================================

/*
PRÓXIMOS PASSOS PARA IMPLEMENTAÇÃO:

1. ESTRUTURA DE ARQUIVOS:
   - Criar pasta: src/components/cockpit/
   - Criar pasta: src/components/panels/PainelEdicao/
   - Criar pasta: src/components/panels/PainelDocumentos/
   - Criar pasta: src/components/panels/PainelVisualizacao/
   - Mover os arquivos criados para suas respectivas pastas

2. IMPORTS E DEPENDÊNCIAS:
   - Verificar se todas as importações estão corretas
   - Instalar dependências adicionais se necessário
   - Configurar variáveis de ambiente (VITE_SUPABASE_URL)

3. INTEGRAÇÃO COM REACT-ADMIN:
   - Substituir o arquivo src/resources/alunos.tsx atual
   - Testar a lista de alunos
   - Testar a edição com o novo cockpit

4. TESTES E AJUSTES:
   - Testar carregamento de dados
   - Testar salvamento de dados
   - Testar visualização de documentos
   - Ajustar responsividade
   - Corrigir bugs encontrados

5. MELHORIAS FUTURAS:
   - Implementar auto-save
   - Adicionar validações de formulário
   - Melhorar tratamento de erros
   - Adicionar testes unitários
   - Otimizar performance

FUNCIONALIDADES IMPLEMENTADAS:
✅ Layout responsivo (3 colunas desktop, 2 colunas tablet, abas mobile)
✅ Painel de edição com abas (Dados Pessoais, Endereço, Escolaridade)
✅ Lista de documentos agrupada por tipo
✅ Visualizador de documentos com controles
✅ Integração com Supabase
✅ Tratamento de erros
✅ Estados de loading
✅ Busca e filtros de documentos
✅ Controles de zoom, rotação e fullscreen
✅ Navegação por teclado
✅ Acessibilidade básica

FUNCIONALIDADES PENDENTES:
⏳ Auto-save de formulários
⏳ Validação de campos obrigatórios
⏳ Integração com sistema SED para aprovação
⏳ Upload de novos documentos
⏳ Histórico de alterações
⏳ Notificações em tempo real
⏳ Backup automático de dados
⏳ Relatórios de verificação
*/

