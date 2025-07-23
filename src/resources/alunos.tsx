// ARQUIVO: src/resources/alunos.tsx
// DESCRIÇÃO: Implementação da arquitetura "Orquestrador" para carregar e salvar
// dados de múltiplas tabelas (personal_data, addresses, schooling_data).

import React, { useEffect, useState } from 'react';
import {
    List, Datagrid, TextField, EmailField, TextInput, Edit,
    TabbedForm, FormTab, DateInput, Toolbar, Button,
    useRecordContext, useNotify, Filter, SaveButton,
    useDataProvider, BooleanInput, useEditController,
    SelectInput, ArrayInput, SimpleFormIterator, RaRecord,
} from "react-admin";
import { useQuery } from 'react-query';
import {
    Box, Typography, CircularProgress, Alert, Paper, Divider,
    List as MuiList, ListItemButton, ListItemText
} from '@mui/material';

// =====================================================================
// TIPOS E CONSTANTES
// =====================================================================
interface DocumentExtraction {
    id: string;
    file_name: string;
    storage_path: string;
    document_type: string;
    status: string;
    enrollment_id: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    'rg_frente': 'RG - Frente',
    'rg_verso': 'RG - Verso',
    'cpf': 'CPF',
    'certidao_nascimento_casamento': 'Certidão de Nascimento/Casamento',
    'comprovante_residencia': 'Comprovante de Residência',
    'historico_medio': 'Histórico Escolar - Ensino Médio',
    'historico_medio_verso': 'Histórico Escolar - Verso',
    'historico_fundamental': 'Histórico Escolar - Ensino Fundamental',
    'declaracao_escolaridade': 'Declaração de Escolaridade',
    'outros': 'Outros Documentos'
};

// =====================================================================
// COMPONENTE VISUALIZADOR DE DOCUMENTOS (Sem alterações)
// =====================================================================
const DocumentViewer: React.FC<{ studentId: string }> = ({ studentId }) => {
    const [documents, setDocuments] = useState<DocumentExtraction[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentExtraction | null>(null);
    const [loading, setLoading] = useState(true);
    const [documentUrl, setDocumentUrl] = useState<string>('');
    const dataProvider = useDataProvider();
    const notify = useNotify();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                const enrollmentResponse = await dataProvider.getList('enrollments', {
                    filter: { student_id: studentId },
                    pagination: { page: 1, perPage: 1 },
                    sort: { field: 'created_at', order: 'DESC' }
                });

                if (enrollmentResponse.data.length === 0) {
                    setDocuments([]);
                    return;
                }

                const enrollmentId = enrollmentResponse.data[0].id;
                
                const documentsResponse = await dataProvider.getList('document_extractions', {
                    filter: { enrollment_id: enrollmentId },
                    pagination: { page: 1, perPage: 100 },
                    sort: { field: 'uploaded_at', order: 'DESC' }
                });
                
                setDocuments(documentsResponse.data);
                
                if (documentsResponse.data.length > 0) {
                    setSelectedDocument(documentsResponse.data[0]);
                }
            } catch (error: any) {
                notify(`Erro ao carregar documentos: ${error.message}`, { type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchDocuments();
        }
    }, [studentId, dataProvider, notify]);

    useEffect(() => {
        const generateDocumentUrl = () => {
            if (selectedDocument && selectedDocument.storage_path) {
                try {
                    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const bucketName = 'documents';
                    const publicUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${selectedDocument.storage_path}`;
                    setDocumentUrl(publicUrl);
                } catch (error: any) {
                    notify(`Erro ao gerar URL do documento: ${error.message}`, { type: 'error' });
                }
            }
        };

        generateDocumentUrl();
    }, [selectedDocument, notify]);

    const handleDocumentSelect = (document: DocumentExtraction) => {
        setSelectedDocument(document);
    };

    const getDocumentLabel = (documentType: string, fileName: string) => {
        return DOCUMENT_TYPE_LABELS[documentType] || fileName;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>Carregando documentos...</Typography>
            </Box>
        );
    }

    if (documents.length === 0) {
        return <Alert severity="info">Nenhum documento encontrado para este aluno.</Alert>;
    }

    return (
        <Box sx={{ height: '600px', display: 'flex', gap: 2 }}>
            <Paper sx={{ width: '300px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6">Documentos Enviados</Typography>
                </Box>
                <Divider />
                <MuiList sx={{ flex: 1, overflow: 'auto' }}>
                    {documents.map((doc) => (
                        <ListItemButton
                            key={doc.id}
                            selected={selectedDocument?.id === doc.id}
                            onClick={() => handleDocumentSelect(doc)}
                        >
                            <ListItemText 
                                primary={getDocumentLabel(doc.document_type, doc.file_name)}
                                secondary={`Status: ${doc.status}`}
                            />
                        </ListItemButton>
                    ))}
                </MuiList>
            </Paper>

            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">
                        {selectedDocument ? getDocumentLabel(selectedDocument.document_type, selectedDocument.file_name) : 'Selecione um documento'}
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, position: 'relative' }}>
                    {selectedDocument && documentUrl ? (
                        <iframe
                            src={documentUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title={`Documento: ${selectedDocument.file_name}`}
                        />
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Typography color="text.secondary">
                                {selectedDocument ? 'Carregando...' : 'Selecione um documento para visualizar'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

// =====================================================================
// BARRA DE FERRAMENTAS PERSONALIZADA (Sem alterações)
// =====================================================================
const AlunoEditToolbar = () => {
    const record = useRecordContext();
    const notify = useNotify();

    const handleApproveAndAutomate = () => {
        if (!record) return;
        console.log('CHAMANDO API DO ROBÔ PLAYWRIGHT para o aluno ID:', record.id);
        notify('Automação na SED iniciada!', { type: 'info' });
    };

    return (
        <Toolbar>
            <SaveButton label="Salvar Todas as Alterações" />
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    label="Aprovar e Iniciar Matrícula na SED" 
                    onClick={handleApproveAndAutomate}
                    variant="contained"
                    color="success"
                />
            </Box>
        </Toolbar>
    );
};

// =====================================================================
// A "VIEW" - O formulário que apenas renderiza a UI
// =====================================================================
const AlunoEditView = () => {
    const record = useRecordContext();
    
    return (
        <TabbedForm toolbar={<AlunoEditToolbar />}>
            <FormTab label="Dados Pessoais">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Identificação</Typography>
                    <Box display="flex" gap={2} mb={2}><TextInput source="nome_completo" label="Nome Completo" fullWidth /><TextInput source="nome_social" label="Nome Social" fullWidth /></Box>
                    <Box display="flex" gap={2} mb={2}><BooleanInput source="tem_nome_social" label="Tem Nome Social?" /><BooleanInput source="tem_nome_afetivo" label="Tem Nome Afetivo?" /><TextInput source="nome_afetivo" label="Nome Afetivo" fullWidth /></Box>
                    
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" color="primary" gutterBottom>Documentos</Typography>
                    <Box display="flex" gap={2} mb={2}><TextInput source="rg" label="RG" fullWidth /><TextInput source="rg_digito" label="Dígito" /><TextInput source="rg_uf" label="UF" /><DateInput source="rg_data_emissao" label="Data de Emissão" fullWidth /></Box>
                    <Box display="flex" gap={2} mb={2}><TextInput source="cpf" label="CPF" fullWidth /><TextInput source="raca_cor" label="Raça/Cor" fullWidth /><DateInput source="data_nascimento" label="Data de Nascimento" fullWidth /></Box>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" color="primary" gutterBottom>Filiação e Origem</Typography>
                    <Box display="flex" gap={2} mb={2}><TextInput source="nome_mae" label="Nome da Mãe" fullWidth /><TextInput source="nome_pai" label="Nome do Pai" fullWidth /></Box>
                    <Box display="flex" gap={2} mb={2}><TextInput source="nacionalidade" label="Nacionalidade" fullWidth /><TextInput source="nascimento_uf" label="UF de Nascimento" fullWidth /><TextInput source="nascimento_cidade" label="Cidade de Nascimento" fullWidth /></Box>
                    
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" color="primary" gutterBottom>Contato</Typography>
                    <Box display="flex" gap={2} mb={2}><TextInput source="telefone" label="Telefone" fullWidth /><TextInput source="email" label="E-mail" fullWidth /></Box>
                </Box>
            </FormTab>

            <FormTab label="Endereço">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Endereço Residencial</Typography>
                    <Box display="flex" gap={2} mb={2}><TextInput source="addresses.cep" label="CEP" /><TextInput source="addresses.logradouro" label="Logradouro" fullWidth /><TextInput source="addresses.numero" label="Número" /></Box>
                    <Box display="flex" gap={2} mb={2}><TextInput source="addresses.complemento" label="Complemento" fullWidth /><TextInput source="addresses.bairro" label="Bairro" fullWidth /></Box>
                    <Box display="flex" gap={2} mb={2}><TextInput source="addresses.nomeCidade" label="Cidade" fullWidth /><TextInput source="addresses.ufCidade" label="UF" /><SelectInput source="addresses.zona" label="Zona" choices={[{ id: "urbana", name: "Urbana" }, { id: "rural", name: "Rural" }]} /></Box>
                </Box>
            </FormTab>

            <FormTab label="Escolaridade">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Dados de Escolaridade</Typography>
                    <Box display="flex" gap={2} mb={2}><TextInput source="schooling_data.nivel_ensino" label="Nível de Ensino" fullWidth /><TextInput source="schooling_data.itinerario_formativo" label="Itinerário Formativo" fullWidth /></Box>
                    <Box display="flex" gap={2} mb={2}><TextInput source="schooling_data.ultima_serie_concluida" label="Última Série Concluída" fullWidth /><BooleanInput source="schooling_data.estudou_no_ceeja" label="Estudou no CEEJA?" /><BooleanInput source="schooling_data.tem_progressao_parcial" label="Tem Progressão Parcial?" /></Box>
                    
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>Disciplinas em Progressão Parcial</Typography>
                    <ArrayInput source="schooling_data.progressao_parcial_disciplinas">
                        <SimpleFormIterator>
                            <TextInput source="disciplina" label="Disciplina em DP" helperText={false} />
                        </SimpleFormIterator>
                    </ArrayInput>
                </Box>
            </FormTab>

            <FormTab label="Documentos">
                <Box p={2}>
                    {record?.student_id ? (
                        <DocumentViewer studentId={record.student_id} />
                    ) : (
                        <Alert severity="warning">ID do estudante não encontrado para carregar documentos.</Alert>
                    )}
                </Box>
            </FormTab>
        </TabbedForm>
    );
};

// =====================================================================
// O "ORQUESTRADOR" - Lógica de Carregamento e Salvamento
// =====================================================================
export const AlunoEdit = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    // Usamos o controller do react-admin para obter o registro principal
    const controllerProps = useEditController<RaRecord & { student_id?: string }>();

    // useQuery para orquestrar o carregamento de dados relacionados
    const { data: mergedData, isLoading, error, refetch } = useQuery(
        // A chave da query inclui o ID do registro para que seja refeita se o registro mudar
        ['aluno-details', controllerProps.record?.id],
        async () => {
            const { record } = controllerProps;
            // Se não houver registro principal ou student_id, não há o que buscar
            if (!record || !record.student_id) return record;

            // Busca os dados de endereço e escolaridade em paralelo
            const [addressesRes, schoolingRes] = await Promise.all([
                dataProvider.getList('addresses', { filter: { student_id: record.student_id }, pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' } }),
                dataProvider.getList('schooling_data', { filter: { student_id: record.student_id }, pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' } })
            ]);

            // Unifica os resultados em um único objeto para o formulário
            return {
                ...record,
                addresses: addressesRes.data[0] || {}, // Inicializa como objeto vazio se não existir
                schooling_data: schoolingRes.data[0] || {}, // Inicializa como objeto vazio se não existir
            };
        },
        // A query só será executada quando o registro principal estiver carregado
        { enabled: !!controllerProps.record && !!controllerProps.record.id }
    );

    // A função transform é o coração da lógica de salvamento
    const transform = async (formData: RaRecord) => {
        // Desestrutura o formData para separar os dados de cada tabela
        const { id, student_id, addresses, schooling_data, ...personalData } = formData;

        try {
            // 1. ATUALIZA PERSONAL_DATA
            // O payload contém apenas os campos da tabela personal_data
            await dataProvider.update('personal_data', {
                id: id,
                data: personalData,
                previousData: controllerProps.record,
            });

            // 2. ATUALIZA/CRIA ADDRESSES
            if (addresses && Object.keys(addresses).length > 0) {
                const existingAddress = mergedData?.addresses;
                // Se já existe um endereço (tem ID), atualiza.
                if (existingAddress?.id) {
                    await dataProvider.update('addresses', {
                        id: existingAddress.id,
                        data: addresses,
                        previousData: existingAddress,
                    });
                } else { // Senão, cria um novo.
                    await dataProvider.create('addresses', {
                        data: { ...addresses, student_id: student_id },
                    });
                }
            }

            // 3. ATUALIZA/CRIA SCHOOLING_DATA
            if (schooling_data && Object.keys(schooling_data).length > 0) {
                const existingSchooling = mergedData?.schooling_data;
                // Se já existem dados de escolaridade (tem ID), atualiza.
                if (existingSchooling?.id) {
                    await dataProvider.update('schooling_data', {
                        id: existingSchooling.id,
                        data: schooling_data,
                        previousData: existingSchooling,
                    });
                } else { // Senão, cria um novo.
                    await dataProvider.create('schooling_data', {
                        data: { ...schooling_data, student_id: student_id },
                    });
                }
            }

            notify('Alterações salvas com sucesso!', { type: 'success' });
            refetch(); // Força a re-busca dos dados para manter a UI sincronizada
        } catch (err: any) {
            notify(`Erro ao salvar: ${err.message}`, { type: 'error' });
            // Rejeita a promessa para que o react-admin saiba que a mutação falhou
            return Promise.reject(new Error(err.message));
        }
    };

    // Gerencia os estados de carregamento e erro
    if (isLoading || controllerProps.isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }
    
    if (error) {
        return <Alert severity="error">Erro ao carregar dados do aluno: {(error as Error).message}</Alert>;
    }

    // Renderiza o componente Edit principal, passando o registro unificado (mergedData)
    // e a função de transformação. O mutationMode="pessimistic" garante que a UI
    // só é atualizada após a confirmação do backend.
    return (
        <Edit {...controllerProps} record={mergedData} transform={transform} mutationMode="pessimistic">
            <AlunoEditView />
        </Edit>
    );
};

// =====================================================================
// LISTA E FILTRO DE ALUNOS (Sem alterações)
// =====================================================================
const AlunoFilter = (props: any) => (
    <Filter {...props}>
        <TextInput label="Buscar por Nome" source="nome_completo" alwaysOn />
        <TextInput label="Buscar por CPF" source="cpf" />
    </Filter>
);

export const AlunoList = () => (
    <List 
        filters={<AlunoFilter />}
        resource="personal_data"
        title="Cockpit de Verificação de Matrícula"
        perPage={25}
    >
        <Datagrid rowClick="edit">
            <TextField source="nome_completo" label="Nome Completo" />
            <EmailField source="email" label="E-mail" />
            <TextField source="cpf" label="CPF" />
            <TextField source="telefone" label="Telefone" />
        </Datagrid>
    </List>
);