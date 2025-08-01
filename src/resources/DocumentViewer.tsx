import React from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    List as MuiList,
    ListItemButton,
    ListItemText,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useStudentDocuments } from '../hooks/useStudentDocuments';

// =====================================================================
// TIPOS E CONSTANTES
// =====================================================================
interface DocumentViewerProps {
    studentId: string;
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
    const {
        documents,
        selectedDocument,
        setSelectedDocument,
        loading,
        error,
        documentUrl,
        noDocumentsFound
    } = useStudentDocuments(studentId);

    const getDocumentLabel = (doc: any) => {
        return DOCUMENT_TYPE_LABELS[doc.document_type] || doc.file_name || 'Documento';
    };

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
                    <br /><br />
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

    return (
        <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', gap: 2, p: 1 }}>
            {/* COLUNA DA ESQUERDA - Lista de Documentos */}
            <Paper
                sx={{
                    width: '300px',
                    overflow: 'auto',
                    borderRadius: 2,
                    boxShadow: 2,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" color="primary">
                        Documentos ({documents.length})
                    </Typography>
                </Box>
                <MuiList sx={{ p: 0, flex: 1, overflow: 'auto' }}>
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
                    boxShadow: 2
                }}
            >
                {selectedDocument && (
                    <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" color="primary">
                                {getDocumentLabel(selectedDocument)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Arquivo: {selectedDocument.file_name}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Box sx={{ flex: 1, position: 'relative', backgroundColor: '#e0e0e0', minHeight: 0 }}>
                    {documentUrl && selectedDocument ? (
                        <>
                            {selectedDocument.file_name?.toLowerCase().endsWith('.pdf') ? (
                                <object
                                    data={documentUrl}
                                    type="application/pdf"
                                    width="100%"
                                    height="100%"
                                    aria-label="Visualizador de PDF"
                                >
                                    <Box sx={{ p: 2 }}>
                                        <Alert severity="warning">
                                            Seu navegador não suporta a visualização de PDFs. Tente abrir o arquivo em uma nova aba.
                                            <a href={documentUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px' }}>
                                                Abrir PDF
                                            </a>
                                        </Alert>
                                    </Box>
                                </object>
                            ) : (
                                <TransformWrapper
                                    key={selectedDocument.id} // Força a recriação do componente ao mudar de documento
                                    initialScale={1}
                                    initialPositionX={0}
                                    initialPositionY={0}
                                >
                                    {({ zoomIn, zoomOut, resetTransform }) => (
                                        <>
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    zIndex: 10,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Tooltip title="Aumentar Zoom">
                                                    <IconButton onClick={() => zoomIn()} size="small"><ZoomInIcon /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Diminuir Zoom">
                                                    <IconButton onClick={() => zoomOut()} size="small"><ZoomOutIcon /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Resetar Zoom">
                                                    <IconButton onClick={() => resetTransform()} size="small"><ResetIcon /></IconButton>
                                                </Tooltip>
                                            </Box>
                                            <TransformComponent
                                                wrapperStyle={{ width: '100%', height: '100%' }}
                                                contentStyle={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                            >
                                                <img
                                                    src={documentUrl}
                                                    alt={selectedDocument?.file_name || 'Documento'}
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '100%',
                                                        objectFit: 'contain',
                                                    }}
                                                    onError={(e) => {
                                                        console.error('❌ Erro ao carregar imagem:', e);
                                                    }}
                                                />
                                            </TransformComponent>
                                        </>
                                    )}
                                </TransformWrapper>
                            )}
                        </>
                    ) : (
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="100%"
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

// =====================================================================
// COMPONENTE AUXILIAR PARA RENDERIZAR O CONTEÚDO DO DOCUMENTO
// =====================================================================
interface DocumentContentProps {
    document: any;
    url: string;
}

const DocumentContent: React.FC<DocumentContentProps> = ({ document, url }) => {
    const isPdf = document.file_name?.toLowerCase().endsWith('.pdf');

    if (isPdf) {
        return (
            <object
                data={url}
                type="application/pdf"
                width="100%"
                height="100%"
                aria-label={`Visualizador de PDF para ${document.file_name}`}
            >
                <Box sx={{ p: 2, color: 'white' }}>
                    <Alert severity="error">
                        Seu navegador não consegue exibir este PDF.
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px', color: 'inherit' }}>
                            Abrir em nova aba.
                        </a>
                    </Alert>
                </Box>
            </object>
        );
    }

    return (
        <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
            minScale={0.5}
            maxScale={8}
        >
            {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                    {/* Controles de Zoom */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '4px',
                            display: 'flex',
                            gap: '4px',
                            p: '4px'
                        }}
                    >
                        <Tooltip title="Aumentar Zoom">
                            <IconButton onClick={() => zoomIn()} size="small" sx={{ color: 'white' }}><ZoomInIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Diminuir Zoom">
                            <IconButton onClick={() => zoomOut()} size="small" sx={{ color: 'white' }}><ZoomOutIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Resetar Zoom">
                            <IconButton onClick={() => resetTransform()} size="small" sx={{ color: 'white' }}><ResetIcon /></IconButton>
                        </Tooltip>
                    </Box>

                    {/* Componente da Imagem */}
                    <TransformComponent
                        wrapperStyle={{ width: '100%', height: '100%' }}
                        contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <img
                            src={url}
                            alt={document.file_name || 'Documento do aluno'}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                            onError={(e) => console.error('❌ Erro ao carregar imagem:', e)}
                        />
                    </TransformComponent>
                </>
            )}
        </TransformWrapper>
    );
};