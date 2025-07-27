// ARQUIVO: src/resources/alunos.tsx - VERSÃO CORRIGIDA
// DESCRIÇÃO: Corrige o carregamento e exibição dos dados de endereço e escolaridade

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    List, Datagrid, TextField, EmailField, TextInput, Edit,
    TabbedForm, FormTab, DateInput, Toolbar,
    useRecordContext, useNotify, Filter, SaveButton,
    useDataProvider, BooleanInput, useEditController,
    SelectInput, ArrayInput, SimpleFormIterator,
} from "react-admin";
import type { RaRecord } from 'react-admin';
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

interface MergedData extends RaRecord {
    student_id?: string | number;
    addresses?: any;
    schooling_data?: any;
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
// SPINNER E COMPONENTES DE UI
// =====================================================================
const CenterSpinner: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>{message}</Typography>
    </Box>
);

// =====================================================================
// COMPONENTE VISUALIZADOR DE DOCUMENTOS
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
            if (!studentId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const enrollmentResponse = await dataProvider.getList('enrollments', {
                    filter: { student_id: studentId },
                    pagination: { page: 1, perPage: 10 },
                    sort: { field: 'created_at', order: 'DESC' }
                });

                let finalDocuments: DocumentExtraction[] = [];
                if (enrollmentResponse.data.length > 0) {
                    const enrollmentId = enrollmentResponse.data[0].id;
                    const documentsResponse = await dataProvider.getList('document_extractions', {
                        filter: { enrollment_id: enrollmentId },
                        pagination: { page: 1, perPage: 100 },
                        sort: { field: 'uploaded_at', order: 'DESC' }
                    });
                    finalDocuments = documentsResponse.data;
                } else {
                    const directDocumentsResponse = await dataProvider.getList('document_extractions', {
                        filter: { enrollment_id: studentId },
                        pagination: { page: 1, perPage: 100 },
                        sort: { field: 'uploaded_at', order: 'DESC' }
                    });
                    finalDocuments = directDocumentsResponse.data;
                }
                
                setDocuments(finalDocuments);
                if (finalDocuments.length > 0) {
                    setSelectedDocument(finalDocuments[0]);
                }

            } catch (error: any) {
                notify(`Erro ao carregar documentos: ${error.message}`, { type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchDocuments();
    }, [studentId, dataProvider, notify]);

    useEffect(() => {
        if (selectedDocument?.storage_path) {
            const baseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
            const publicUrl = `${baseUrl}/storage/v1/object/public/documents/${selectedDocument.storage_path}`;
            setDocumentUrl(publicUrl);
        } else {
            setDocumentUrl('');
        }
    }, [selectedDocument]);

    const getDocumentLabel = (doc: DocumentExtraction) => DOCUMENT_TYPE_LABELS[doc.document_type] || doc.file_name;

    if (loading) return <CenterSpinner message="Carregando documentos..." />;
    if (documents.length === 0) return <Alert severity="info">Nenhum documento encontrado.</Alert>;

    return (
        <Box sx={{ height: '600px', display: 'flex', gap: 2 }}>
            <Paper sx={{ width: '300px', overflow: 'auto' }}>
                <MuiList>
                    {documents.map((doc) => (
                        <ListItemButton key={doc.id} selected={selectedDocument?.id === doc.id} onClick={() => setSelectedDocument(doc)}>
                            <ListItemText primary={getDocumentLabel(doc)} />
                        </ListItemButton>
                    ))}
                </MuiList>
            </Paper>
            <Paper sx={{ flex: 1 }}>
                {documentUrl ? (
                    <iframe src={documentUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={selectedDocument?.file_name} />
                ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography>Selecione um documento para visualizar</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

// =====================================================================
// BARRA DE FERRAMENTAS E FORMULÁRIO DE EDIÇÃO
// =====================================================================
const AlunoEditToolbar = () => <Toolbar><SaveButton label="Salvar Alterações" /></Toolbar>;

const DebugRecord = () => {
    const record = useRecordContext();
    return (
        <Box p={2}>
            <Typography variant="h6" gutterBottom>Debug - Dados Carregados:</Typography>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(record, null, 2)}
            </pre>
        </Box>
    );
};

const AlunoEditView = () => {
    const record = useRecordContext();
    
    // Debug: vamos ver o que está no record
    console.log('🔍 Record no AlunoEditView:', record);

    return (
        <TabbedForm toolbar={<AlunoEditToolbar />}>
            <FormTab label="Dados Pessoais">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Identificação</Typography>
                    <TextInput source="nome_completo" label="Nome Completo" fullWidth />
                    <BooleanInput source="tem_nome_social" label="Tem Nome Social?" />
                    <TextInput source="nome_social" label="Nome Social" fullWidth />
                    <BooleanInput source="tem_nome_afetivo" label="Tem Nome Afetivo?" />
                    <TextInput source="nome_afetivo" label="Nome Afetivo" fullWidth />
                    <TextInput source="sexo" label="Sexo" />
                    <TextInput source="idade" label="Idade" />
                    
                    <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 1 }}>Documentos</Typography>
                    <TextInput source="rg" label="RG" />
                    <TextInput source="rg_digito" label="Dígito" />
                    <TextInput source="rg_uf" label="UF" />
                    <DateInput source="rg_data_emissao" label="Data de Emissão" />
                    <TextInput source="cpf" label="CPF" />
                    <TextInput source="raca_cor" label="Raça/Cor" />
                    <DateInput source="data_nascimento" label="Data de Nascimento" />

                    <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 1 }}>Filiação e Origem</Typography>
                    <TextInput source="nome_mae" label="Nome da Mãe" fullWidth />
                    <TextInput source="nome_pai" label="Nome do Pai" fullWidth />
                    <TextInput source="nacionalidade" label="Nacionalidade" />
                    <TextInput source="nascimento_uf" label="UF de Nascimento" />
                    <TextInput source="nascimento_cidade" label="Cidade de Nascimento" />
                </Box>
            </FormTab>
            <FormTab label="Endereço">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Endereço Residencial</Typography>
                    <TextInput source="addresses.cep" label="CEP" />
                    <TextInput source="addresses.logradouro" label="Logradouro" fullWidth />
                    <TextInput source="addresses.numero" label="Número" />
                    <TextInput source="addresses.complemento" label="Complemento" fullWidth />
                    <TextInput source="addresses.bairro" label="Bairro" />
                    <TextInput source="addresses.nomeCidade" label="Cidade" />
                    <TextInput source="addresses.ufCidade" label="UF" />
                    <SelectInput source="addresses.zona" label="Zona" choices={[
                        { id: "Urbana", name: "Urbana" }, 
                        { id: "Rural", name: "Rural" }
                    ]} />
                </Box>
            </FormTab>
            <FormTab label="Escolaridade">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Dados de Escolaridade</Typography>
                    <TextInput source="schooling_data.nivel_ensino" label="Nível de Ensino" />
                    <TextInput source="schooling_data.itinerario_formativo" label="Itinerário Formativo" />
                    <TextInput source="schooling_data.ultima_serie_concluida" label="Última Série Concluída" />
                    <BooleanInput source="schooling_data.estudou_no_ceeja" label="Estudou no CEEJA?" />
                    <BooleanInput source="schooling_data.tem_progressao_parcial" label="Tem Progressão Parcial?" />
                    <ArrayInput source="schooling_data.progressao_parcial_disciplinas">
                        <SimpleFormIterator>
                            <TextInput source="disciplina" label="Disciplina em DP" />
                        </SimpleFormIterator>
                    </ArrayInput>
                </Box>
            </FormTab>
            <FormTab label="Documentos">
                <Box p={2}>
                    {record?.id ? (
                        <DocumentViewer studentId={String(record.student_id || record.id)} />
                    ) : (
                        <Alert severity="warning">ID do estudante não encontrado.</Alert>
                    )}
                </Box>
            </FormTab>
            <FormTab label="Debug">
                <DebugRecord />
            </FormTab>
        </TabbedForm>
    );
};

// =====================================================================
// COMPONENTE INTERNO CORRIGIDO
// =====================================================================
const AlunoEditInternal = () => {
    const controllerProps = useEditController<MergedData>();
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const [mergedRecord, setMergedRecord] = useState<MergedData | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>();

    useEffect(() => {
        // Se ainda está carregando os dados básicos, aguarda
        if (controllerProps.isLoading || !controllerProps.record) {
            return;
        }

        const studentId = controllerProps.record.student_id || controllerProps.record.id;
        if (!studentId) {
            setError(new Error('ID do estudante não encontrado no registro.'));
            setLoading(false);
            return;
        }

        console.log('🔍 Iniciando busca de dados complementares para studentId:', studentId);

        let isMounted = true;
        const fetchAndMergeData = async () => {
            try {
                setLoading(true);
                
                // Buscar dados de endereço e escolaridade em paralelo
                const [addressesRes, schoolingRes] = await Promise.all([
                    dataProvider.getList('addresses', { 
                        filter: { student_id: studentId }, 
                        pagination: { page: 1, perPage: 1 }, 
                        sort: { field: 'id', order: 'ASC' } 
                    }),
                    dataProvider.getList('schooling_data', { 
                        filter: { student_id: studentId }, 
                        pagination: { page: 1, perPage: 1 }, 
                        sort: { field: 'id', order: 'ASC' } 
                    })
                ]);

                console.log('🔍 Dados de endereço encontrados:', addressesRes.data);
                console.log('🔍 Dados de escolaridade encontrados:', schoolingRes.data);

                if (isMounted) {
                    const merged = {
                        ...controllerProps.record,
                        addresses: addressesRes.data.length > 0 ? addressesRes.data[0] : {},
                        schooling_data: schoolingRes.data.length > 0 ? schoolingRes.data[0] : {},
                    };
                    
                    console.log('🔍 Dados mesclados finais:', merged);
                    setMergedRecord(merged);
                }
            } catch (e: any) {
                console.error('❌ Erro ao buscar dados complementares:', e);
                if (isMounted) {
                    setError(e);
                    notify(`Erro ao carregar dados complementares: ${e.message}`, { type: 'error' });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAndMergeData();
        return () => { isMounted = false; };
    }, [controllerProps.record, controllerProps.isLoading, dataProvider, notify]);

    // Função de transformação para salvar os dados
    const transform = async (data: MergedData) => {
        try {
            const { addresses, schooling_data, ...personal_data } = data;
            const studentId = personal_data.student_id || personal_data.id;

            console.log('💾 Salvando dados:', { personal_data, addresses, schooling_data });

            const updates = [];
            
            // Sempre atualiza os dados pessoais
            updates.push(
                dataProvider.update('personal_data', { 
                    id: personal_data.id, 
                    data: personal_data, 
                    previousData: controllerProps.record! 
                })
            );

            // Salvar endereço
            if (addresses && Object.keys(addresses).length > 0) {
                const addressPayload = { ...addresses, student_id: studentId };
                if (addresses.id) {
                    updates.push(
                        dataProvider.update('addresses', { 
                            id: addresses.id, 
                            data: addressPayload, 
                            previousData: mergedRecord!.addresses 
                        })
                    );
                } else {
                    updates.push(
                        dataProvider.create('addresses', { data: addressPayload })
                    );
                }
            }

            // Salvar dados de escolaridade
            if (schooling_data && Object.keys(schooling_data).length > 0) {
                const schoolingPayload = { ...schooling_data, student_id: studentId };
                if (schooling_data.id) {
                    updates.push(
                        dataProvider.update('schooling_data', { 
                            id: schooling_data.id, 
                            data: schoolingPayload, 
                            previousData: mergedRecord!.schooling_data 
                        })
                    );
                } else {
                    updates.push(
                        dataProvider.create('schooling_data', { data: schoolingPayload })
                    );
                }
            }

            await Promise.all(updates);
            notify('Alterações salvas com sucesso!', { type: 'success' });
            
        } catch (error: any) {
            console.error('❌ Erro ao salvar:', error);
            notify(`Erro ao salvar: ${error.message}`, { type: 'error' });
            throw error;
        }
        
        return data;
    };

    // Estados de loading e erro
    if (controllerProps.isLoading || loading) {
        return <CenterSpinner message="Carregando dados do aluno..." />;
    }
    
    if (controllerProps.error || error) {
        return (
            <Alert severity="error">
                {(controllerProps.error || error)?.message || 'Erro desconhecido'}
            </Alert>
        );
    }
    
    if (!mergedRecord) {
        return <CenterSpinner message="Preparando dados..." />;
    }

    return (
        <Edit
            {...controllerProps}
            record={mergedRecord}
            transform={transform}
            mutationMode="pessimistic"
        >
            <AlunoEditView />
        </Edit>
    );
};

// =====================================================================
// COMPONENTE PRINCIPAL (ORQUESTRADOR COM 'key')
// =====================================================================
export const AlunoEdit = () => {
    const { id } = useParams<{ id: string }>();
    return <AlunoEditInternal key={id} />;
};

// =====================================================================
// LISTA E FILTRO DE ALUNOS
// =====================================================================
const AlunoFilter = (props: any) => (
    <Filter {...props}>
        <TextInput label="Buscar por Nome" source="nome_completo@ilike" alwaysOn />
        <TextInput label="Buscar por CPF" source="cpf@eq" />
    </Filter>
);

export const AlunoList = () => (
    <List filters={<AlunoFilter />} resource="personal_data" title="Cockpit de Verificação" perPage={25}>
        <Datagrid rowClick="edit">
            <TextField source="nome_completo" label="Nome Completo" />
            <EmailField source="email" label="E-mail" />
            <TextField source="cpf" label="CPF" />
            <TextField source="telefone" label="Telefone" />
        </Datagrid>
    </List>
);