// ARQUIVO: src/resources/alunos.tsx - COCKPIT DE VERIFICAÇÃO DE MATRÍCULA
// DESCRIÇÃO: Implementação da arquitetura "Orquestrador" para carregamento e salvamento
// de dados relacionados (personal_data, addresses, schooling_data) sem conflitos

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    List, Datagrid, TextField, EmailField, TextInput, Edit,
    TabbedForm, FormTab, DateInput, Toolbar, SaveButton,
    useRecordContext, useNotify, Filter, useEditController,
    useDataProvider, BooleanInput, SelectInput,
    ArrayInput, SimpleFormIterator,
} from "react-admin";
import { useQuery } from 'react-query';
import type { RaRecord } from 'react-admin';
import {
    Box, Typography, CircularProgress, Alert, Paper, Divider,
    List as MuiList, ListItemButton, ListItemText, Grid
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
    enrollment_id?: string;
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
// COMPONENTES DE UI
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
                console.log('📄 Buscando documentos para studentId:', studentId);
                
                const enrollmentResponse = await dataProvider.getList('enrollments', {
                    filter: { student_id: studentId },
                    pagination: { page: 1, perPage: 10 },
                    sort: { field: 'created_at', order: 'DESC' }
                });

                let finalDocuments: DocumentExtraction[] = [];
                if (enrollmentResponse.data.length > 0) {
                    const enrollmentId = enrollmentResponse.data[0].id;
                    console.log('📄 Enrollment encontrado:', enrollmentId);
                    
                    const documentsResponse = await dataProvider.getList('document_extractions', {
                        filter: { enrollment_id: enrollmentId },
                        pagination: { page: 1, perPage: 100 },
                        sort: { field: 'uploaded_at', order: 'DESC' }
                    });
                    finalDocuments = documentsResponse.data;
                } else {
                    console.log('📄 Nenhum enrollment encontrado, buscando documentos diretos');
                    const directDocumentsResponse = await dataProvider.getList('document_extractions', {
                        filter: { enrollment_id: studentId },
                        pagination: { page: 1, perPage: 100 },
                        sort: { field: 'uploaded_at', order: 'DESC' }
                    });
                    finalDocuments = directDocumentsResponse.data;
                }
                
                console.log('📄 Documentos encontrados:', finalDocuments.length);
                setDocuments(finalDocuments);
                if (finalDocuments.length > 0) {
                    setSelectedDocument(finalDocuments[0]);
                }

            } catch (error: any) {
                console.error('❌ Erro ao carregar documentos:', error);
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
                        <ListItemButton 
                            key={doc.id} 
                            selected={selectedDocument?.id === doc.id} 
                            onClick={() => setSelectedDocument(doc)}
                        >
                            <ListItemText primary={getDocumentLabel(doc)} />
                        </ListItemButton>
                    ))}
                </MuiList>
            </Paper>
            <Paper sx={{ flex: 1 }}>
                {documentUrl ? (
                    <iframe 
                        src={documentUrl} 
                        style={{ width: '100%', height: '100%', border: 'none' }} 
                        title={selectedDocument?.file_name} 
                    />
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

const AlunoEditView: React.FC<{ mergedData: MergedData }> = ({ mergedData }) => {
    console.log('🔍 Record no AlunoEditView:', mergedData);

    return (
        <TabbedForm record={mergedData} toolbar={<AlunoEditToolbar />}>
            <FormTab label="Dados Pessoais">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Identificação</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <TextInput source="nome_completo" label="Nome Completo" fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextInput source="idade" label="Idade" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <BooleanInput source="tem_nome_social" label="Tem Nome Social?" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="nome_social" label="Nome Social" fullWidth />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <BooleanInput source="tem_nome_afetivo" label="Tem Nome Afetivo?" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="nome_afetivo" label="Nome Afetivo" fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <SelectInput source="sexo" label="Sexo" choices={[
                                { id: "Masculino", name: "Masculino" },
                                { id: "Feminino", name: "Feminino" }
                            ]} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <DateInput source="data_nascimento" label="Data de Nascimento" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextInput source="raca_cor" label="Raça/Cor" />
                        </Grid>
                    </Grid>
                    
                    <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 1 }}>Documentos</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <TextInput source="rg" label="RG" />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextInput source="rg_digito" label="Dígito" />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextInput source="rg_uf" label="UF" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <DateInput source="rg_data_emissao" label="Data de Emissão" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="cpf" label="CPF" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="telefone" label="Telefone" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextInput source="email" label="E-mail" fullWidth />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" color="primary" sx={{ mt: 3, mb: 1 }}>Filiação e Origem</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextInput source="nome_mae" label="Nome da Mãe" fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <TextInput source="nome_pai" label="Nome do Pai" fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextInput source="nacionalidade" label="Nacionalidade" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextInput source="nascimento_uf" label="UF de Nascimento" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextInput source="nascimento_cidade" label="Cidade de Nascimento" />
                        </Grid>
                    </Grid>
                </Box>
            </FormTab>

            <FormTab label="Endereço">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Endereço Residencial</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextInput source="addresses.cep" label="CEP" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="addresses.logradouro" label="Logradouro" fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextInput source="addresses.numero" label="Número" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextInput source="addresses.complemento" label="Complemento" fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextInput source="addresses.bairro" label="Bairro" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextInput source="addresses.nomeCidade" label="Cidade" />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextInput source="addresses.ufCidade" label="UF" />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <SelectInput source="addresses.zona" label="Zona" choices={[
                                { id: "Urbana", name: "Urbana" }, 
                                { id: "Rural", name: "Rural" }
                            ]} />
                        </Grid>
                    </Grid>
                </Box>
            </FormTab>

            <FormTab label="Escolaridade">
                <Box p={3}>
                    <Typography variant="h6" color="primary" gutterBottom>Dados de Escolaridade</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextInput source="schooling_data.nivel_ensino" label="Nível de Ensino" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="schooling_data.itinerario_formativo" label="Itinerário Formativo" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="schooling_data.ultima_serie_concluida" label="Última Série Concluída" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextInput source="schooling_data.ra" label="RA" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <BooleanInput source="schooling_data.estudou_no_ceeja" label="Estudou no CEEJA?" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <BooleanInput source="schooling_data.tem_progressao_parcial" label="Tem Progressão Parcial?" />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <BooleanInput source="schooling_data.eliminou_disciplina" label="Eliminou Disciplina?" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextInput source="schooling_data.nome_escola" label="Nome da Escola" fullWidth />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <SelectInput source="schooling_data.tipo_escola" label="Tipo de Escola" choices={[
                                { id: "Pública", name: "Pública" },
                                { id: "Privada", name: "Privada" }
                            ]} />
                        </Grid>
                    </Grid>
                    <Box mt={2}>
                        <Typography variant="subtitle1" gutterBottom>Disciplinas em Dependência</Typography>
                        <ArrayInput source="schooling_data.progressao_parcial_disciplinas">
                            <SimpleFormIterator>
                                <TextInput source="disciplina" label="Disciplina em DP" />
                            </SimpleFormIterator>
                        </ArrayInput>
                    </Box>
                </Box>
            </FormTab>

            <FormTab label="Documentos">
                <Box p={2}>
                    {mergedData?.id ? (
                        <DocumentViewer studentId={String(mergedData.student_id || mergedData.id)} />
                    ) : (
                        <Alert severity="warning">ID do estudante não encontrado.</Alert>
                    )}
                </Box>
            </FormTab>
        </TabbedForm>
    );
};

// =====================================================================
// HOOK PERSONALIZADO PARA CARREGAR DADOS MESCLADOS COM REACT-QUERY
// =====================================================================
const useMergedStudentData = (personalDataRecord: any) => {
    const dataProvider = useDataProvider();
    
    return useQuery(
        ['mergedStudentData', personalDataRecord?.id],
        async () => {
            if (!personalDataRecord?.id) {
                throw new Error('ID do registro não encontrado');
            }

            const studentId = personalDataRecord.student_id || personalDataRecord.id;
            console.log('🔍 Buscando dados relacionados para studentId:', studentId);
            
            // Buscar dados relacionados em paralelo
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

            console.log('🔍 Dados de endereço:', addressesRes.data);
            console.log('🔍 Dados de escolaridade:', schoolingRes.data);

            const merged = {
                ...personalDataRecord,
                addresses: addressesRes.data.length > 0 ? addressesRes.data[0] : {},
                schooling_data: schoolingRes.data.length > 0 ? schoolingRes.data[0] : {},
            };
            
            console.log('✅ Dados mesclados:', merged);
            return merged;
        },
        {
            enabled: !!personalDataRecord?.id,
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 10 * 60 * 1000, // 10 minutos
        }
    );
};

// =====================================================================
// COMPONENTE ORQUESTRADOR PRINCIPAL
// =====================================================================
export const AlunoEdit = () => {
    const { id } = useParams<{ id: string }>();
    const dataProvider = useDataProvider();
    const notify = useNotify();
    
    // Usar o useEditController para buscar o registro principal
    const { record: personalDataRecord, isLoading: personalLoading, error: personalError } = useEditController({
        resource: 'personal_data',
        id: id!
    });

    // Usar react-query para orquestrar o carregamento dos dados relacionados
    const { data: mergedData, isLoading: relatedLoading, error: relatedError } = useMergedStudentData(personalDataRecord);

    // Função de transformação para salvar os dados
    const transform = async (data: MergedData) => {
        try {
            console.log('💾 Transform iniciado com dados:', data);
            
            // SEPARAR corretamente os dados para evitar envio de campos aninhados
            const { addresses, schooling_data, ...personal_data } = data;
            const studentId = personal_data.student_id || personal_data.id;

            console.log('💾 Dados separados:', { 
                personal_keys: Object.keys(personal_data),
                addresses_keys: Object.keys(addresses || {}),
                schooling_keys: Object.keys(schooling_data || {})
            });

            const updates = [];
            
            // 1. SEMPRE atualiza os dados pessoais (SEM campos aninhados)
            const cleanPersonalData = { ...personal_data };
            delete cleanPersonalData.addresses;           // Remove nested data
            delete cleanPersonalData.schooling_data;     // Remove nested data
            delete cleanPersonalData.enrollment_id;      // Remove enrollment reference
            
            console.log('💾 Salvando dados pessoais limpos:', cleanPersonalData);
            updates.push(
                dataProvider.update('personal_data', { 
                    id: personal_data.id, 
                    data: cleanPersonalData, 
                    previousData: personalDataRecord! 
                })
            );

            // 2. Salvar endereço (CREATE ou UPDATE)
            if (addresses && Object.keys(addresses).some(key => key !== 'student_id' && addresses[key] != null && addresses[key] !== '')) {
                const addressPayload = { ...addresses, student_id: studentId };
                if (addresses.id) {
                    console.log('🏠 Atualizando endereço existente ID:', addresses.id);
                    updates.push(
                        dataProvider.update('addresses', { 
                            id: addresses.id, 
                            data: addressPayload, 
                            previousData: mergedData!.addresses 
                        })
                    );
                } else {
                    console.log('🏠 Criando novo endereço');
                    updates.push(
                        dataProvider.create('addresses', { data: addressPayload })
                    );
                }
            }

            // 3. Salvar dados de escolaridade (CREATE ou UPDATE)
            if (schooling_data && Object.keys(schooling_data).some(key => key !== 'student_id' && schooling_data[key] != null && schooling_data[key] !== '')) {
                const schoolingPayload = { ...schooling_data, student_id: studentId };
                if (schooling_data.id) {
                    console.log('🎓 Atualizando escolaridade existente ID:', schooling_data.id);
                    updates.push(
                        dataProvider.update('schooling_data', { 
                            id: schooling_data.id, 
                            data: schoolingPayload, 
                            previousData: mergedData!.schooling_data 
                        })
                    );
                } else {
                    console.log('🎓 Criando nova escolaridade');
                    updates.push(
                        dataProvider.create('schooling_data', { data: schoolingPayload })
                    );
                }
            }

            // 4. Executar todas as operações
            console.log(`🚀 Executando ${updates.length} operações...`);
            await Promise.all(updates);
            
            console.log('✅ Todas as alterações foram salvas!');
            notify('Alterações salvas com sucesso!', { type: 'success' });
            
        } catch (error: any) {
            console.error('❌ Erro ao salvar:', error);
            notify(`Erro ao salvar: ${error.message}`, { type: 'error' });
            throw error;
        }
        
        return data;
    };

    // Estados de loading e erro
    const isLoading = personalLoading || relatedLoading;
    const error = personalError || relatedError;
    
    if (isLoading) {
        return <CenterSpinner message="Carregando dados do aluno..." />;
    }
    
    if (error || !mergedData) {
        return (
            <Alert severity="error">
                {error?.message || 'Erro ao carregar dados do aluno'}
            </Alert>
        );
    }

    return (
        <Edit
            resource="personal_data"
            id={id}
            record={mergedData}
            transform={transform}
            mutationMode="pessimistic"
        >
            <AlunoEditView mergedData={mergedData} />
        </Edit>
    );
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