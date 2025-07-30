// ARQUIVO: src/components/panels/PainelVisualizacao/PainelVisualizacao.tsx
// DESCRIÇÃO: Painel direito com visualização de documentos e controles

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Toolbar,
    Tooltip,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Fab,
    Zoom,
    Divider
} from '@mui/material';
import {
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    RotateRight as RotateIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    Download as DownloadIcon,
    NavigateBefore as PrevIcon,
    NavigateNext as NextIcon,
    Refresh as RefreshIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { useCockpitContext } from '../cockpit/CockpitLayout';
import { useDataProvider } from 'react-admin';

// =====================================================================
// INTERFACES
// =====================================================================
interface PainelVisualizacaoProps {
    className?: string;
}

interface DocumentViewerControls {
    zoom: {
        value: number;
        zoomIn: () => void;
        zoomOut: () => void;
        reset: () => void;
    };
    rotation: {
        value: number;
        rotate: () => void;
        reset: () => void;
    };
    fullscreen: {
        isFullscreen: boolean;
        toggle: () => void;
    };
    navigation: {
        canGoPrev: boolean;
        canGoNext: boolean;
        goToPrev: () => void;
        goToNext: () => void;
    };
}

// =====================================================================
// HOOK PARA CONTROLES DO VISUALIZADOR
// =====================================================================
const useDocumentViewer = (selectedDocument: any, allDocuments: any[]) => {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [documentUrl, setDocumentUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const dataProvider = useDataProvider();
    
    // Buscar URL assinada do documento
    useEffect(() => {
        if (!selectedDocument) {
            setDocumentUrl('');
            setError(null);
            return;
        }
        
        const fetchDocumentUrl = async () => {
            setLoading(true);
            setError(null);
            
            try {
                console.log('🔍 [PainelVisualizacao] Buscando URL para documento:', selectedDocument.file_name);
                
                // Construir URL do Supabase Storage
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                if (!supabaseUrl) {
                    throw new Error('URL do Supabase não configurada');
                }
                
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/documents/${selectedDocument.storage_path}`;
                
                console.log('📄 [PainelVisualizacao] URL construída:', publicUrl);
                setDocumentUrl(publicUrl);
                
            } catch (err: any) {
                console.error('❌ [PainelVisualizacao] Erro ao buscar URL:', err);
                setError(err.message || 'Erro ao carregar documento');
            } finally {
                setLoading(false);
            }
        };
        
        fetchDocumentUrl();
    }, [selectedDocument, dataProvider]);
    
    // Controles de zoom
    const zoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
    const zoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
    const resetZoom = () => setZoom(100);
    
    // Controles de rotação
    const rotate = () => setRotation(prev => (prev + 90) % 360);
    const resetRotation = () => setRotation(0);
    
    // Controles de fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };
    
    // Navegação entre documentos
    const currentIndex = allDocuments.findIndex(doc => doc.id === selectedDocument?.id);
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < allDocuments.length - 1;
    
    const goToPrev = () => {
        if (canGoPrev) {
            // TODO: Implementar navegação para documento anterior
        }
    };
    
    const goToNext = () => {
        if (canGoNext) {
            // TODO: Implementar navegação para próximo documento
        }
    };
    
    // Listener para mudanças de fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    
    const controls: DocumentViewerControls = {
        zoom: {
            value: zoom,
            zoomIn,
            zoomOut,
            reset: resetZoom
        },
        rotation: {
            value: rotation,
            rotate,
            reset: resetRotation
        },
        fullscreen: {
            isFullscreen,
            toggle: toggleFullscreen
        },
        navigation: {
            canGoPrev,
            canGoNext,
            goToPrev,
            goToNext
        }
    };
    
    return {
        documentUrl,
        loading,
        error,
        controls
    };
};

// =====================================================================
// COMPONENTE DE BARRA DE FERRAMENTAS
// =====================================================================
const DocumentToolbar: React.FC<{ controls: DocumentViewerControls; onRefresh: () => void }> = ({ 
    controls, 
    onRefresh 
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    return (
        <Toolbar 
            variant="dense" 
            sx={{ 
                backgroundColor: 'grey.100', 
                borderBottom: 1, 
                borderColor: 'divider',
                minHeight: 48,
                gap: 1
            }}
        >
            {/* Navegação */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Documento Anterior">
                    <span>
                        <IconButton 
                            size="small" 
                            onClick={controls.navigation.goToPrev}
                            disabled={!controls.navigation.canGoPrev}
                        >
                            <PrevIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                
                <Tooltip title="Próximo Documento">
                    <span>
                        <IconButton 
                            size="small" 
                            onClick={controls.navigation.goToNext}
                            disabled={!controls.navigation.canGoNext}
                        >
                            <NextIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            
            <Divider orientation="vertical" flexItem />
            
            {/* Zoom */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title="Diminuir Zoom">
                    <IconButton size="small" onClick={controls.zoom.zoomOut}>
                        <ZoomOutIcon />
                    </IconButton>
                </Tooltip>
                
                <Typography variant="caption" sx={{ minWidth: 50, textAlign: 'center' }}>
                    {controls.zoom.value}%
                </Typography>
                
                <Tooltip title="Aumentar Zoom">
                    <IconButton size="small" onClick={controls.zoom.zoomIn}>
                        <ZoomInIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            
            <Divider orientation="vertical" flexItem />
            
            {/* Rotação */}
            <Tooltip title="Rotacionar">
                <IconButton size="small" onClick={controls.rotation.rotate}>
                    <RotateIcon />
                </IconButton>
            </Tooltip>
            
            {/* Atualizar */}
            <Tooltip title="Atualizar">
                <IconButton size="small" onClick={onRefresh}>
                    <RefreshIcon />
                </IconButton>
            </Tooltip>
            
            {/* Spacer */}
            <Box sx={{ flex: 1 }} />
            
            {/* Fullscreen */}
            {!isMobile && (
                <Tooltip title={controls.fullscreen.isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}>
                    <IconButton size="small" onClick={controls.fullscreen.toggle}>
                        {controls.fullscreen.isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                </Tooltip>
            )}
        </Toolbar>
    );
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export const PainelVisualizacao: React.FC<PainelVisualizacaoProps> = ({ className }) => {
    const { selectedDocument } = useCockpitContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // TODO: Buscar todos os documentos para navegação
    const allDocuments: any[] = [];
    
    const { documentUrl, loading, error, controls } = useDocumentViewer(selectedDocument, allDocuments);
    
    const handleRefresh = () => {
        // Forçar recarregamento do documento
        window.location.reload();
    };
    
    const handleDownload = () => {
        if (documentUrl && selectedDocument) {
            const link = document.createElement('a');
            link.href = documentUrl;
            link.download = selectedDocument.file_name;
            link.click();
        }
    };
    
    return (
        <Paper className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">
                        Visualização de Documento
                    </Typography>
                    
                    {selectedDocument && (
                        <Tooltip title="Baixar Documento">
                            <IconButton onClick={handleDownload}>
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                
                {selectedDocument && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {selectedDocument.file_name}
                    </Typography>
                )}
            </Box>
            
            {/* Barra de Ferramentas */}
            {selectedDocument && !loading && !error && (
                <DocumentToolbar controls={controls} onRefresh={handleRefresh} />
            )}
            
            {/* Área de Visualização */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {loading && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%' 
                    }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress size={60} />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Carregando documento...
                            </Typography>
                        </Box>
                    </Box>
                )}
                
                {error && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error">
                            <Typography variant="body2">
                                <strong>Erro ao carregar documento:</strong> {error}
                            </Typography>
                        </Alert>
                    </Box>
                )}
                
                {!selectedDocument && !loading && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%',
                        textAlign: 'center',
                        p: 3
                    }}>
                        <Box>
                            <ViewIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Nenhum documento selecionado
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Selecione um documento na lista ao lado para visualizar
                            </Typography>
                        </Box>
                    </Box>
                )}
                
                {documentUrl && !loading && !error && (
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            transform: `scale(${controls.zoom.value / 100}) rotate(${controls.rotation.value}deg)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease',
                            overflow: 'auto'
                        }}
                    >
                        <iframe
                            src={documentUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                backgroundColor: 'white'
                            }}
                            title={selectedDocument?.file_name || 'Documento'}
                            onLoad={() => console.log('📄 [PainelVisualizacao] Documento carregado no iframe')}
                            onError={() => console.error('❌ [PainelVisualizacao] Erro ao carregar no iframe')}
                        />
                    </Box>
                )}
            </Box>
            
            {/* FAB para Mobile */}
            {isMobile && selectedDocument && (
                <Zoom in={true}>
                    <Fab
                        color="primary"
                        size="small"
                        onClick={controls.fullscreen.toggle}
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                        }}
                    >
                        <FullscreenIcon />
                    </Fab>
                </Zoom>
            )}
            
            {/* Footer com informações do documento */}
            {selectedDocument && (
                <Box sx={{ 
                    p: 1, 
                    borderTop: 1, 
                    borderColor: 'divider', 
                    backgroundColor: 'grey.50' 
                }}>
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                        Tipo: {selectedDocument.document_type} • 
                        Status: {selectedDocument.status} • 
                        Criado em: {new Date(selectedDocument.created_at).toLocaleDateString('pt-BR')}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default PainelVisualizacao;

