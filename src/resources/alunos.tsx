// ARQUIVO DEFINITIVO v2: alunos.tsx (usando React Query para robustez)

import React, { useState, useEffect } from 'react';
import {
    List, Datagrid, TextField, EmailField, TextInput, Edit,
    TabbedForm, FormTab, DateInput, Toolbar, Button,
    useRecordContext, useNotify, Filter, SaveButton,
    useDataProvider, BooleanInput, useEditController, RaRecord,
    SelectInput,
    ArrayInput, // <-- Adicione aqui!
    SimpleFormIterator // (se usar também)
} from "react-admin";
import { useQuery } from 'react-query';
import {
    Box, Typography, CircularProgress, Alert, Paper, Divider,
    List as MuiList, ListItem, ListItemButton, ListItemText
} from '@mui/material';

// =====================================================================
// TIPOS E INTERFACES
// =====================================================================
interface DocumentExtraction {
    id: string;
    file_name: string;
    storage_path: string;
    document_type: string;
    status: string;
    enrollment_id: string;
}

interface MergedData {
    id: string;
    student_id: string;
    addresses?: any;
    schooling_data?: any;
    [key: string]: any;
}

// =====================================================================
// MAPEAMENTO DE TIPOS DE DOCUMENTOS
// =====================================================================
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
// COMPONENTE VISUALIZADOR DE DOCUMENTOS
// =====================================================================
const DocumentViewer: React.FC<{ studentId: string }> = ({ studentId }) => {
    const [documents, setDocuments] = useState<DocumentExtraction[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentExtraction | null>(null);
    const [loading, setLoading] = useState(true);
    const [documentUrl, setDocumentUrl] = useState<string>('');
    const dataProvider = useDataProvider();
    const notify = useNotify();

    // Buscar documentos relacionados ao student_id
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                console.log('Buscando documentos para student_id:', studentId);
                
                // Primeiro buscar enrollment_id pelo student_id
                const enrollmentResponse = await dataProvider.getList('enrollments', {
                    filter: { student_id: studentId },
                    pagination: { page: 1, perPage: 1 },
                    sort: { field: 'created_at', order: 'DESC' }
                });

                if (enrollmentResponse.data.length === 0) {
                    console.log('Nenhuma matrícula encontrada para student_id:', studentId);
                    setDocuments([]);
                    return;
                }

                const enrollmentId = enrollmentResponse.data[0].id;
                console.log('Enrollment ID encontrado:', enrollmentId);
                
                // Buscar documentos pelo enrollment_id
                const documentsResponse = await dataProvider.getList('document_extractions', {
                    filter: { enrollment_id: enrollmentId },
                    pagination: { page: 1, perPage: 100 },
                    sort: { field: 'uploaded_at', order: 'DESC' }
                });
                
                console.log('Documentos encontrados:', documentsResponse.data.length);
                setDocuments(documentsResponse.data);
                
                // Selecionar automaticamente o primeiro documento
                if (documentsResponse.data.length > 0) {
                    setSelectedDocument(documentsResponse.data[0]);
                }
            } catch (error: any) {
                console.error('Erro ao carregar documentos:', error);
                notify(`Erro ao carregar documentos: ${error.message}`, { type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchDocuments();
        }
    }, [studentId, dataProvider, notify]);

    // Gerar URL do documento selecionado
    useEffect(() => {
        const generateDocumentUrl = async () => {
            if (selectedDocument && selectedDocument.storage_path) {
                try {
                    // Gerar URL pública do Supabase Storage
                    const baseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
                    const bucketName = 'documents';
                    const publicUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${selectedDocument.storage_path}`;
                    console.log('URL do documento gerada:', publicUrl);
                    setDocumentUrl(publicUrl);
                } catch (error: any) {
                    console.error('Erro ao gerar URL do documento:', error);
                    notify(`Erro ao gerar URL do documento: ${error.message}`, { type: 'error' });
                }
            }
        };

        generateDocumentUrl();
    }, [selectedDocument, notify]);

    const handleDocumentSelect = (document: DocumentExtraction) => {
        console.log('Documento selecionado:', document.file_name);
        setSelectedDocument(document);
    };

    const getDocumentLabel = (documentType: string, fileName: string) => {
        return DOCUMENT_TYPE_LABELS[documentType] || fileName;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Carregando documentos...
                </Typography>
            </Box>
        );
    }

    if (documents.length === 0) {
        return (
            <Box p={3}>
                <Alert severity="info">
                    Nenhum documento encontrado para este aluno.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '600px', display: 'flex', gap: 2 }}>
            {/* Coluna da Esquerda - Lista de Documentos */}
            <Paper sx={{ width: '300px', overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6">
                        Documentos Enviados
                    </Typography>
                    <Typography variant="body2">
                        {documents.length} documento(s) encontrado(s)
                    </Typography>
                </Box>
                <Divider />
                <MuiList sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
                    {documents.map((document, index) => (
                        <React.Fragment key={document.id}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    selected={selectedDocument?.id === document.id}
                                    onClick={() => handleDocumentSelect(document)}
                                    sx={{
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.light',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: 'primary.main',
                                            }
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={getDocumentLabel(document.document_type, document.file_name)}
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" display="block">
                                                    {document.file_name}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Status: {document.status}
                                                </Typography>
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

            {/* Coluna da Direita - Visualizador de Documento */}
            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">
                        {selectedDocument ? 
                            getDocumentLabel(selectedDocument.document_type, selectedDocument.file_name) : 
                            'Selecione um documento'
                        }
                    </Typography>
                    {selectedDocument && (
                        <Typography variant="body2" color="text.secondary">
                            Arquivo: {selectedDocument.file_name}
                        </Typography>
                    )}
                </Box>
                
                <Box sx={{ flex: 1, position: 'relative' }}>
                    {selectedDocument && documentUrl ? (
                        <iframe
                            src={documentUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            title={`Documento: ${selectedDocument.file_name}`}
                        />
                    ) : (
                        <Box 
                            display="flex" 
                            justifyContent="center" 
                            alignItems="center" 
                            height="100%"
                            bgcolor="grey.50"
                        >
                            <Typography variant="body1" color="text.secondary">
                                {selectedDocument ? 
                                    'Carregando documento...' : 
                                    'Selecione um documento da lista para visualizar'
                                }
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

// =====================================================================
// BARRA DE FERRAMENTAS
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
// A "VIEW" - O formulário com todos os campos mapeados usando BOX
// =====================================================================
const AlunoEditView = () => {
    const record = useRecordContext();
    
    return (
        <TabbedForm toolbar={<AlunoEditToolbar />}>
            <FormTab label="Dados Pessoais">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">
                        Dados Pessoais do Aluno
                    </Typography>
                    
                    {/* Linha 1 - Nome e Nome Social */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                            <TextInput source="nome_completo" label="Nome Completo" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}>
                            <BooleanInput source="tem_nome_social" label="Tem Nome Social?" />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="nome_social" label="Nome Social" fullWidth />
                        </Box>
                    </Box>
                    
                    {/* Linha 2 - Nome Afetivo e Sexo */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}>
                            <BooleanInput source="tem_nome_afetivo" label="Tem Nome Afetivo?" />
                        </Box>
                        <Box sx={{ flex: '1 1 35%', minWidth: '200px' }}>
                            <TextInput source="nome_afetivo" label="Nome Afetivo" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}>
                            <TextInput source="sexo" label="Sexo" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 20%', minWidth: '100px' }}>
                            <TextInput source="idade" label="Idade" fullWidth />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Documentos de Identificação
                    </Typography>
                    
                    {/* Linha 3 - RG */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 35%', minWidth: '200px' }}>
                            <TextInput source="rg" label="RG" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 15%', minWidth: '100px' }}>
                            <TextInput source="rg_digito" label="Dígito" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 15%', minWidth: '100px' }}>
                            <TextInput source="rg_uf" label="UF" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <DateInput source="rg_data_emissao" label="Data de Emissão" fullWidth />
                        </Box>
                    </Box>
                    
                    {/* Linha 4 - CPF, Raça/Cor, Data Nascimento */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="cpf" label="CPF" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="raca_cor" label="Raça/Cor" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 35%', minWidth: '200px' }}>
                            <DateInput source="data_nascimento" label="Data de Nascimento" fullWidth />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Filiação e Origem
                    </Typography>
                    
                    {/* Linha 5 - Filiação */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="nome_mae" label="Nome da Mãe" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="nome_pai" label="Nome do Pai" fullWidth />
                        </Box>
                    </Box>
                    
                    {/* Linha 6 - Origem */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="nacionalidade" label="Nacionalidade" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="nascimento_uf" label="UF de Nascimento" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 35%', minWidth: '200px' }}>
                            <TextInput source="nascimento_cidade" label="Cidade de Nascimento" fullWidth />
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="pais_origem" label="País de Origem" fullWidth />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Contato e Tecnologia
                    </Typography>
                    
                    {/* Linha 7 - Contato */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="telefone" label="Telefone" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="email" label="E-mail" fullWidth />
                        </Box>
                    </Box>
                    
                    {/* Linha 8 - Tecnologia */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                            <BooleanInput source="possui_internet" label="Possui Internet?" />
                        </Box>
                        <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                            <BooleanInput source="possui_device" label="Possui Dispositivo?" />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Informações Adicionais
                    </Typography>
                    
                    {/* Linha 9 - Informações Adicionais */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 20%', minWidth: '120px' }}>
                            <BooleanInput source="is_gemeo" label="É Gêmeo?" />
                        </Box>
                        <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
                            <TextInput source="nome_gemeo" label="Nome do Gêmeo" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 20%', minWidth: '120px' }}>
                            <BooleanInput source="trabalha" label="Trabalha?" />
                        </Box>
                        <Box sx={{ flex: '1 1 20%', minWidth: '120px' }}>
                            <BooleanInput source="is_pcd" label="É PCD?" />
                        </Box>
                    </Box>
                    
                    {/* Linha 10 - Trabalho e Deficiência */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="profissao" label="Profissão" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="empresa" label="Empresa" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 35%', minWidth: '200px' }}>
                            <TextInput source="deficiencia" label="Tipo de Deficiência" fullWidth />
                        </Box>
                    </Box>
                </Box>
            </FormTab>

            <FormTab label="Endereço">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">
                        Endereço Residencial
                    </Typography>
                    
                    {/* Linha 1 - CEP, Logradouro, Número */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 20%', minWidth: '150px' }}>
                            <TextInput source="addresses.cep" label="CEP" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 55%', minWidth: '300px' }}>
                            <TextInput source="addresses.logradouro" label="Logradouro" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 20%', minWidth: '100px' }}>
                            <TextInput source="addresses.numero" label="Número" fullWidth />
                        </Box>
                    </Box>
                    
                    {/* Linha 2 - Complemento, Bairro */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="addresses.complemento" label="Complemento" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="addresses.bairro" label="Bairro" fullWidth />
                        </Box>
                    </Box>
                    
                    {/* Linha 3 - Cidade, UF, Zona */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                            <TextInput source="addresses.nomeCidade" label="Cidade" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 25%', minWidth: '100px' }}>
                            <TextInput source="addresses.ufCidade" label="UF" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                            <SelectInput 
                                source="addresses.zona" 
                                label="Zona" 
                                choices={[
                                    { id: "urbana", name: "Urbana" }, 
                                    { id: "rural", name: "Rural" }
                                ]} 
                                fullWidth 
                            />
                        </Box>
                    </Box>
                    
                    {/* Linha 4 - Localização Diferenciada */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <BooleanInput source="addresses.temLocalizacaoDiferenciada" label="Localização Diferenciada?" />
                        </Box>
                        <Box sx={{ flex: '1 1 65%', minWidth: '400px' }}>
                            <TextInput source="addresses.localizacaoDiferenciada" label="Descrição da Localização Diferenciada" fullWidth />
                        </Box>
                    </Box>
                </Box>
            </FormTab>

            <FormTab label="Escolaridade">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">
                        Dados de Escolaridade
                    </Typography>
                    
                    {/* Linha 1 - Nível de Ensino, Itinerário */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="schooling_data.nivel_ensino" label="Nível de Ensino" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
                            <TextInput source="schooling_data.itinerario_formativo" label="Itinerário Formativo" fullWidth />
                        </Box>
                    </Box>
                    
                    {/* Linha 2 - Última Série, Checkboxes */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
                            <TextInput source="schooling_data.ultima_serie_concluida" label="Última Série Concluída" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                            <BooleanInput source="schooling_data.estudou_no_ceeja" label="Estudou no CEEJA?" />
                        </Box>
                        <Box sx={{ flex: '1 1 25%', minWidth: '150px' }}>
                            <BooleanInput source="schooling_data.tem_progressao_parcial" label="Tem Progressão Parcial?" />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Disciplinas em Progressão Parcial
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <ArrayInput source="schooling_data.progressao_parcial_disciplinas">
                            <SimpleFormIterator>
                                <TextInput source="disciplina" label="Disciplina em DP" helperText={false} />
                            </SimpleFormIterator>
                        </ArrayInput>
                    </Box>

                    {/* Linha 3 - Eliminação de Disciplinas */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <BooleanInput source="schooling_data.eliminou_disciplina" label="Eliminou Disciplina?" />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="schooling_data.eliminou_disciplina_nivel" label="Nível da Disciplina Eliminada" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 35%', minWidth: '250px' }}>
                            <TextInput source="schooling_data.eliminou_disciplinas" label="Disciplinas Eliminadas" fullWidth />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Opções Curriculares
                    </Typography>
                    
                    {/* Linha 4 - Opções Curriculares */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 22%', minWidth: '150px' }}>
                            <BooleanInput source="schooling_data.optou_ensino_religioso" label="Optou por Ensino Religioso?" />
                        </Box>
                        <Box sx={{ flex: '1 1 22%', minWidth: '150px' }}>
                            <BooleanInput source="schooling_data.optou_educacao_fisica" label="Optou por Educação Física?" />
                        </Box>
                        <Box sx={{ flex: '1 1 22%', minWidth: '150px' }}>
                            <BooleanInput source="schooling_data.aceitou_termos" label="Aceitou os Termos?" />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <DateInput source="schooling_data.data_aceite" label="Data de Aceite" fullWidth />
                        </Box>
                    </Box>

                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Dados da Escola Anterior
                    </Typography>
                    
                    {/* Linha 5 - Escola Anterior */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="schooling_data.ra" label="RA" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                            <TextInput source="schooling_data.tipo_escola" label="Tipo de Escola" fullWidth />
                        </Box>
                        <Box sx={{ flex: '1 1 35%', minWidth: '250px' }}>
                            <TextInput source="schooling_data.nome_escola" label="Nome da Escola" fullWidth />
                        </Box>
                    </Box>
                </Box>
            </FormTab>

            <FormTab label="Documentos">
                <Box p={2}>
                    <Typography variant="h6" gutterBottom color="primary">
                        Verificação de Documentos
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Visualize os documentos enviados pelo aluno para validar as informações preenchidas.
                    </Typography>
                    
                    {record?.student_id ? (
                        <DocumentViewer studentId={record.student_id} />
                    ) : (
                        <Alert severity="warning">
                            Não foi possível carregar os documentos. ID do estudante não encontrado.
                        </Alert>
                    )}
                </Box>
            </FormTab>
        </TabbedForm>
    );
};

// =====================================================================
// O "ORQUESTRADOR" - COM A LÓGICA DE CARREGAMENTO CORRIGIDA
// =====================================================================
const CenterSpinner: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
        </Typography>
    </Box>
);

export const AlunoEdit = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const controllerProps = useEditController<RaRecord & { student_id?: string }>();
    
    const { data: mergedData, isLoading, error } = useQuery(
        ['aluno-details', controllerProps.record?.id],
        async () => {
            const { record } = controllerProps;
            if (!record || !record.student_id) return record;
            const [addressesRes, schoolingRes] = await Promise.all([
                dataProvider.getList('addresses', { filter: { student_id: record.student_id }, pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' } }),
                dataProvider.getList('schooling_data', { filter: { student_id: record.student_id }, pagination: { page: 1, perPage: 1 }, sort: { field: 'id', order: 'ASC' } })
            ]);
            return {
                ...record,
                addresses: addressesRes.data[0] || { student_id: record.student_id },
                schooling_data: schoolingRes.data[0] || { student_id: record.student_id },
            };
        },
        { enabled: !!controllerProps.record }
    );

    const transform = async (data: any) => {
        const { addresses, schooling_data, ...personal_data } = data;
        const studentId = personal_data.student_id;
        try {
            const updates = [
                dataProvider.update('personal_data', { id: personal_data.id, data: personal_data, previousData: controllerProps.record }),
            ];
            if (addresses && addresses.id) {
                updates.push(dataProvider.update('addresses', { id: addresses.id, data: addresses, previousData: mergedData?.addresses }));
            } else if (addresses && Object.keys(addresses).length > 1) {
                updates.push(dataProvider.create('addresses', { data: { ...addresses, student_id: studentId } }));
            }
            if (schooling_data && schooling_data.id) {
                updates.push(dataProvider.update('schooling_data', { id: schooling_data.id, data: schooling_data, previousData: mergedData?.schooling_data }));
            } else if (schooling_data && Object.keys(schooling_data).length > 1) {
                updates.push(dataProvider.create('schooling_data', { data: { ...schooling_data, student_id: studentId } }));
            }
            await Promise.all(updates);
            notify('Alterações salvas com sucesso!', { type: 'success' });
        } catch (error: any) {
            notify(`Erro ao salvar: ${error.message}`, { type: 'error' });
        }
        return data;
    };

    // Estados de loading e erro
    if (controllerProps.isLoading || isLoading) {
        return <CenterSpinner message="Carregando dados do aluno..." />;
    }
    
    if (controllerProps.error || error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {controllerProps.error?.message || error}
            </Alert>
        );
    }

    if (!controllerProps.record) {
        return (
            <Alert severity="warning" sx={{ m: 2 }}>
                Registro do aluno não encontrado.
            </Alert>
        );
    }

    if (!mergedData) {
        return (
            <Alert severity="warning" sx={{ m: 2 }}>
                Dados do aluno não puderam ser carregados.
            </Alert>
        );
    }
    
    return (
        <Edit
            {...controllerProps}
            record={mergedData}
            transform={transform}
            mutationMode="pessimistic"
            key={mergedData?.id || controllerProps.record?.id}
        >
            <AlunoEditView />
        </Edit>
    );
};

// =====================================================================
// LISTA E FILTRO DE ALUNOS
// =====================================================================
const AlunoFilter = (props: any) => (
    <Filter {...props}>
        <TextInput label="Buscar por Nome" source="nome_completo" alwaysOn />
        <TextInput label="Buscar por CPF" source="cpf" />
        <TextInput label="Buscar por E-mail" source="email" />
    </Filter>
);

export const AlunoList = () => (
    <List 
        filters={<AlunoFilter />}
        resource="personal_data"
        title="Lista de Alunos - Cockpit de Verificação"
        perPage={25}
    >
        <Datagrid rowClick="edit">
            <TextField source="nome_completo" label="Nome Completo" />
            <EmailField source="email" label="E-mail" />
            <TextField source="cpf" label="CPF" />
            <TextField source="telefone" label="Telefone" />
            <TextField source="idade" label="Idade" />
        </Datagrid>
    </List>
);