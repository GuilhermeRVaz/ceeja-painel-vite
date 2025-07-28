import React from 'react';
import {
    Box, 
    Typography, 
    CircularProgress, 
    Alert, 
    Paper, 
    List as MuiList, 
    ListItemButton, 
    ListItemText
} from '@mui/material';
import { useStudentDocuments } from '../hooks/useStudentDocuments';

// =====================================================================
// TIPOS E CONSTANTES
// =====================================================================
interface DocumentViewerProps {
    studentId: string;
}

// Mapeamento de tipos de documento para labels amigáveis
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
// COMPONENTE DE LOADING CENTRALIZADO
// =====================================================================
const CenterSpinner: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => (
    <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
    >
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
        </Typography>
    </Box>
);

// =====================================================================
// COMPONENTE PRINCIPAL - DOCUMENT VIEWER
// =====================================================================
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ studentId }) => {
    // Hook customizado com toda a lógica de negócio
    const {
        documents,
        selectedDocument,
        setSelectedDocument,
        loading,
        error,
        documentUrl,
        noDocumentsFound
    } = useStudentDocuments(studentId);

    // =====================================================================
    // FUNÇÃO HELPER PARA OBTER LABEL DO DOCUMENTO
    // =====================================================================
    const getDocumentLabel = (doc: any) => {
        return DOCUMENT_TYPE_LABELS[doc.document_type] || doc.file_name || 'Documento';
    };

    // =====================================================================
    // RENDERIZAÇÃO CONDICIONAL - ESTADOS DE LOADING E ERRO
    // =====================================================================
    if (loading) {
        return <CenterSpinner message="Carregando documentos..." />;
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                <Typography variant="body2">
                    <strong>Erro ao carregar documentos:</strong> {error}
                </Typography>
            </Alert>
        );
    }

    if (noDocumentsFound) {
        return (
            <Alert severity="warning" sx={{ m: 2 }}>
                <Typography variant="h6" gutterBottom>Nenhum documento visível</Typography>
                <Typography variant="body2">
                    A matrícula do aluno foi encontrada, mas nenhum documento pôde ser carregado.
                    <br/><br/>
                    <strong>Causa provável:</strong> A política de segurança do banco de dados (Row-Level Security) pode estar impedindo o acesso. Verifique se o usuário atual tem permissão para ler a tabela `document_extractions`.
                </Typography>
            </Alert>
        );
    }

    if (documents.length === 0) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                <Typography variant="body2">
                    Nenhum documento encontrado para este aluno.
                </Typography>
            </Alert>
        );
    }

    // =====================================================================
    // RENDERIZAÇÃO PRINCIPAL - LAYOUT DE DUAS COLUNAS
    // =====================================================================
    return (
        <Box sx={{ height: '600px', display: 'flex', gap: 2, p: 1 }}>
            {/* COLUNA DA ESQUERDA - Lista de Documentos */}
            <Paper 
                sx={{ 
                    width: '300px', 
                    overflow: 'auto',
                    borderRadius: 2,
                    boxShadow: 2
                }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" color="primary">
                        Documentos ({documents.length})
                    </Typography>
                </Box>
                
                <MuiList sx={{ p: 0 }}>
                    {documents.map((doc, index) => (
                        <ListItemButton 
                            key={doc.id || index}
                            selected={selectedDocument?.id === doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            sx={{
                                borderBottom: '1px solid #f5f5f5',
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        backgroundColor: 'primary.main',
                                    }
                                }
                            }}
                        >
                            <ListItemText 
                                primary={getDocumentLabel(doc)}
                                secondary={doc.status || 'Status não informado'}
                                primaryTypographyProps={{
                                    variant: 'body2',
                                    fontWeight: selectedDocument?.id === doc.id ? 'bold' : 'normal'
                                }}
                                secondaryTypographyProps={{
                                    variant: 'caption',
                                    color: selectedDocument?.id === doc.id ? 'inherit' : 'text.secondary'
                                }}
                            />
                        </ListItemButton>
                    ))}
                </MuiList>
            </Paper>

            {/* COLUNA DA DIREITA - Visualizador do Documento */}
            <Paper 
                sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    boxShadow: 2,
                    overflow: 'hidden'
                }}
            >
                {/* Header do visualizador */}
                {selectedDocument && (
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                        <Typography variant="h6" color="primary">
                            {getDocumentLabel(selectedDocument)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Arquivo: {selectedDocument.file_name}
                        </Typography>
                    </Box>
                )}

                {/* Conteúdo do visualizador */}
                <Box sx={{ flex: 1, display: 'flex' }}>
                    {documentUrl ? (
                        <iframe 
                            src={documentUrl}
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                border: 'none',
                                backgroundColor: '#fff'
                            }}
                            title={selectedDocument?.file_name || 'Documento'}
                            onError={(e) => {
                                console.error('❌ Erro ao carregar iframe:', e);
                            }}
                        />
                    ) : (
                        <Box 
                            display="flex" 
                            justifyContent="center" 
                            alignItems="center" 
                            height="100%"
                            sx={{ backgroundColor: '#f5f5f5' }}
                        >
                            <Typography variant="body1" color="text.secondary">
                                {selectedDocument ? 'Carregando documento...' : 'Selecione um documento para visualizar'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};