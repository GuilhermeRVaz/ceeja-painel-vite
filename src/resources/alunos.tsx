
import React, { useState, useEffect } from 'react';
import {
    List, Datagrid, TextField, EmailField, TextInput, Edit,
    TabbedForm, FormTab, DateInput, Toolbar, SaveButton,
    useRecordContext, useNotify, Filter, useDataProvider, useEditController,
    BooleanInput, ArrayInput, SimpleFormIterator
} from 'react-admin';
import type { RaRecord } from 'react-admin';
import { Grid, Box, Typography, CircularProgress, Alert, Paper, Divider, List as MuiList, ListItem, ListItemButton, ListItemText } from '@mui/material';

// ===================== Tipos =====================
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

// ===================== Visualizador de Documentos =====================
const DocumentViewer: React.FC<{ enrollmentId: string }> = ({ enrollmentId }) => {
    const [documents, setDocuments] = useState<DocumentExtraction[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentExtraction | null>(null);
    const [loading, setLoading] = useState(true);
    const [documentUrl, setDocumentUrl] = useState<string>('');
    const dataProvider = useDataProvider();
    const notify = useNotify();

    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            try {
                const response = await dataProvider.getList('document_extractions', {
                    filter: { enrollment_id: enrollmentId },
                    pagination: { page: 1, perPage: 100 },
                    sort: { field: 'uploaded_at', order: 'DESC' }
                });
                setDocuments(response.data);
                if (response.data.length > 0) setSelectedDocument(response.data[0]);
            } catch (error: any) {
                notify(`Erro ao carregar documentos: ${error.message}`, { type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        if (enrollmentId) fetchDocuments();
    }, [enrollmentId, dataProvider, notify]);

    useEffect(() => {
        const generateDocumentUrl = async () => {
            if (selectedDocument && selectedDocument.storage_path) {
                try {
                    const baseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>Carregando documentos...</Typography>
            </Box>
        );
    }
    if (documents.length === 0) {
        return (
            <Box p={3}><Alert severity="info">Nenhum documento encontrado para esta matrícula.</Alert></Box>
        );
    }
    return (
        <Box sx={{ height: '600px', display: 'flex' }}>
            {/* Lista de Documentos */}
            <Paper sx={{ width: '300px', mr: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6">Documentos Enviados</Typography>
                    <Typography variant="body2">{documents.length} documento(s) encontrado(s)</Typography>
                </Box>
                <Divider />
                <MuiList sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
                    {documents.map((document, index) => (
                        <React.Fragment key={document.id}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={selectedDocument?.id === document.id}
                                    onClick={() => setSelectedDocument(document)}
                                    sx={{ '&.Mui-selected': { backgroundColor: 'primary.light', color: 'white', '&:hover': { backgroundColor: 'primary.main' } } }}
                                >
                                    <ListItemText
                                        primary={DOCUMENT_TYPE_LABELS[document.document_type] || document.file_name}
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" display="block">{document.file_name}</Typography>
                                                <Typography variant="caption" display="block">Status: {document.status}</Typography>
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                            {index < documents.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </MuiList>
            </Paper>
            {/* Visualizador */}
            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">
                        {selectedDocument ? (DOCUMENT_TYPE_LABELS[selectedDocument.document_type] || selectedDocument.file_name) : 'Selecione um documento'}
                    </Typography>
                    {selectedDocument && (
                        <Typography variant="body2" color="text.secondary">Arquivo: {selectedDocument.file_name}</Typography>
                    )}
                </Box>
                <Box sx={{ flex: 1, position: 'relative' }}>
                    {selectedDocument && documentUrl ? (
                        <iframe
                            src={documentUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title={`Documento: ${selectedDocument.file_name}`}
                        />
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%" bgcolor="grey.50">
                            <Typography variant="body1" color="text.secondary">
                                {selectedDocument ? 'Carregando documento...' : 'Selecione um documento da lista para visualizar'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

// ===================== Toolbar customizada =====================
const AlunoEditToolbar = () => (
    <Toolbar>
        <SaveButton label="Salvar Todas as Alterações" />
    </Toolbar>
);

// ===================== Formulário Tabulado =====================
const AlunoEditView: React.FC = () => {
    const record = useRecordContext();
    return (
        <TabbedForm toolbar={<AlunoEditToolbar />}>
            <FormTab label="Dados Pessoais">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">Dados Pessoais do Aluno</Typography>
                    <Grid container sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="nome_completo" label="Nome Completo" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="tem_nome_social" label="Tem Nome Social?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="nome_social" label="Nome Social" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="tem_nome_afetivo" label="Tem Nome Afetivo?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="nome_afetivo" label="Nome Afetivo" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="sexo" label="Sexo" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="idade" label="Idade" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12' } }}><Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Documentos de Identificação</Typography></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="rg" label="RG" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 2' } }}><TextInput source="rg_digito" label="Dígito" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 2' } }}><TextInput source="rg_uf" label="UF" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><DateInput source="rg_data_emissao" label="Data de Emissão" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="cpf" label="CPF" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="raca_cor" label="Raça/Cor" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><DateInput source="data_nascimento" label="Data de Nascimento" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12' } }}><Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Filiação e Origem</Typography></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="nome_mae" label="Nome da Mãe" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="nome_pai" label="Nome do Pai" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="nacionalidade" label="Nacionalidade" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="nascimento_uf" label="UF de Nascimento" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="nascimento_cidade" label="Cidade de Nascimento" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="pais_origem" label="País de Origem" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12' } }}><Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Contato e Tecnologia</Typography></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="telefone" label="Telefone" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="email" label="E-mail" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="possui_internet" label="Possui Internet?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="possui_device" label="Possui Dispositivo?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12' } }}><Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Informações Adicionais</Typography></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="is_gemeo" label="É Gêmeo?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="nome_gemeo" label="Nome do Gêmeo" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="trabalha" label="Trabalha?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="is_pcd" label="É PCD?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="profissao" label="Profissão" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="empresa" label="Empresa" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="deficiencia" label="Tipo de Deficiência" fullWidth /></Box>
                    </Grid>
                </Box>
            </FormTab>
            <FormTab label="Endereço">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">Endereço Residencial</Typography>
                    <Grid container sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="addresses.cep" label="CEP" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="addresses.logradouro" label="Logradouro" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="addresses.numero" label="Número" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="addresses.complemento" label="Complemento" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="addresses.bairro" label="Bairro" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="addresses.nomeCidade" label="Cidade" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="addresses.ufCidade" label="UF" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><TextInput source="addresses.zona" label="Zona" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><BooleanInput source="addresses.temLocalizacaoDiferenciada" label="Localização Diferenciada?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="addresses.localizacaoDiferenciada" label="Descrição da Localização Diferenciada" fullWidth /></Box>
                    </Grid>
                </Box>
            </FormTab>
            <FormTab label="Escolaridade">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">Dados de Escolaridade</Typography>
                    <Grid container sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="schooling_data.nivel_ensino" label="Nível de Ensino" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="schooling_data.itinerario_formativo" label="Itinerário Formativo" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}><TextInput source="schooling_data.ultima_serie_concluida" label="Última Série Concluída" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="schooling_data.estudou_no_ceeja" label="Estudou no CEEJA?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="schooling_data.tem_progressao_parcial" label="Tem Progressão Parcial?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12' } }}><Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Disciplinas em Progressão Parcial</Typography>
                            <ArrayInput source="schooling_data.progressao_parcial_disciplinas">
                                <SimpleFormIterator>
                                    <TextInput source="disciplina" label="Disciplina em DP" helperText={false} />
                                </SimpleFormIterator>
                            </ArrayInput>
                        </Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><BooleanInput source="schooling_data.eliminou_disciplina" label="Eliminou Disciplina?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="schooling_data.eliminou_disciplina_nivel" label="Nível da Disciplina Eliminada" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="schooling_data.eliminou_disciplinas" label="Disciplinas Eliminadas" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12' } }}><Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Opções Curriculares</Typography></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="schooling_data.optou_ensino_religioso" label="Optou por Ensino Religioso?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="schooling_data.optou_educacao_fisica" label="Optou por Educação Física?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><BooleanInput source="schooling_data.aceitou_termos" label="Aceitou os Termos?" /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 3' } }}><DateInput source="schooling_data.data_aceite" label="Data de Aceite" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12' } }}><Typography variant="subtitle1" color="primary" sx={{ mt: 2, mb: 1 }}>Dados da Escola Anterior</Typography></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="schooling_data.ra" label="RA" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="schooling_data.tipo_escola" label="Tipo de Escola" fullWidth /></Box>
                        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}><TextInput source="schooling_data.nome_escola" label="Nome da Escola" fullWidth /></Box>
                    </Grid>
                </Box>
            </FormTab>
            <FormTab label="Documentos">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">Verificação de Documentos</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Visualize os documentos enviados pelo aluno para validar as informações preenchidas.
                    </Typography>
                    {record?.user_id ? (
                        <DocumentViewer enrollmentId={record.user_id} />
                    ) : (
                        <Alert severity="warning">Não foi possível carregar os documentos. ID do usuário não encontrado.</Alert>
                    )}
                </Box>
            </FormTab>
        </TabbedForm>
    );
};

// ===================== ORQUESTRADOR =====================
export const AlunoEdit = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const controllerProps = useEditController<RaRecord & { user_id?: string }>();
    const [mergedData, setMergedData] = useState<any>(null);

    useEffect(() => {
        if (controllerProps.record && controllerProps.record.user_id && !mergedData) {
            Promise.all([
                dataProvider.getList('addresses', { filter: { user_id: controllerProps.record.user_id }, pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' } }),
                dataProvider.getList('schooling_data', { filter: { user_id: controllerProps.record.user_id }, pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' } })
            ]).then(([addressesRes, schoolingRes]) => {
                const fullRecord = {
                    ...controllerProps.record,
                    addresses: addressesRes.data[0] || {},
                    schooling_data: schoolingRes.data[0] || {},
                };
                setMergedData(fullRecord);
            });
        }
    }, [controllerProps.record, dataProvider, mergedData]);

    const transform = async (data: any) => {
        const { addresses, schooling_data, ...personal_data } = data;
        try {
            await Promise.all([
                dataProvider.update('personal_data', { id: personal_data.id, data: personal_data, previousData: controllerProps.record }),
                addresses?.id && dataProvider.update('addresses', { id: addresses.id, data: addresses, previousData: mergedData.addresses }),
                schooling_data?.id && dataProvider.update('schooling_data', { id: schooling_data.id, data: schooling_data, previousData: mergedData.schooling_data }),
            ]);
            notify('Alterações salvas com sucesso!', { type: 'success' });
        } catch (error: any) {
            notify(`Erro ao salvar: ${error.message}`, { type: 'error' });
        }
        return data;
    };

    if (controllerProps.isLoading || (controllerProps.record && !mergedData)) {
        return <CircularProgress />;
    }
    if (controllerProps.error) {
        return <Alert severity="error">{controllerProps.error.message}</Alert>;
    }
    
    return (
        <Edit {...controllerProps} record={mergedData || controllerProps.record} transform={transform}>
            <AlunoEditView />
        </Edit>
    );
};

// ===================== Lista e Filtro de Alunos =====================
const AlunoFilter = (props: any) => (
    <Filter {...props}>
        <TextInput label="Buscar por Nome" source="nome_completo" alwaysOn />
        <TextInput label="Buscar por CPF" source="cpf" />
        <TextInput label="Buscar por E-mail" source="email" />
    </Filter>
);

export const AlunoList = () => (
    <List filters={<AlunoFilter />} title="Lista de Alunos - Cockpit de Verificação" perPage={25}>
        <Datagrid rowClick="edit">
            <TextField source="nome_completo" label="Nome Completo" />
            <EmailField source="email" label="E-mail" />
            <TextField source="cpf" label="CPF" />
            <TextField source="telefone" label="Telefone" />
            <TextField source="idade" label="Idade" />
        </Datagrid>
    </List>
);

