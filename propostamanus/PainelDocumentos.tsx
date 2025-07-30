// ARQUIVO: src/components/panels/PainelDocumentos/PainelDocumentos.tsx
// DESCRIÇÃO: Painel central com lista de documentos do aluno

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    TextField,
    InputAdornment,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Collapse,
    IconButton
} from '@mui/material';
import {
    Search as SearchIcon,
    Description as DocumentIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as FileIcon,
    ExpandLess,
    ExpandMore,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useCockpitContext } from '../cockpit/CockpitLayout';
import { useQuery } from 'react-query';
import { useDataProvider } from 'react-admin';

// =====================================================================
// INTERFACES
// =====================================================================
interface PainelDocumentosProps {
    className?: string;
}

interface DocumentExtraction {
    id: string;
    file_name: string;
    storage_path: string;
    document_type: string;
    status: string;
    enrollment_id: string;
    created_at: string;
    file_size?: number;
    mime_type?: string;
}

interface DocumentGroup {
    type: string;
    label: string;
    documents: DocumentExtraction[];
    icon: React.ReactNode;
}

// =====================================================================
// MAPEAMENTO DE TIPOS DE DOCUMENTO
// =====================================================================
const DOCUMENT_TYPE_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    'rg': { label: 'RG', icon: <DocumentIcon />, color: '#1976d2' },
    'cpf': { label: 'CPF', icon: <DocumentIcon />, color: '#388e3c' },
    'certidao_nascimento': { label: 'Certidão de Nascimento', icon: <DocumentIcon />, color: '#f57c00' },
    'comprovante_residencia': { label: 'Comprovante de Residência', icon: <DocumentIcon />, color: '#7b1fa2' },
    'historico_escolar': { label: 'Histórico Escolar', icon: <DocumentIcon />, color: '#d32f2f' },
    'foto': { label: 'Foto', icon: <ImageIcon />, color: '#0288d1' },
    'outros': { label: 'Outros Documentos', icon: <FileIcon />, color: '#616161' }
};

// =====================================================================
// HOOK PARA BUSCAR DOCUMENTOS
// =====================================================================
const useStudentDocuments = (enrollmentId: string | null) => {
    const dataProvider = useDataProvider();
    
    return useQuery(
        ['studentDocuments', enrollmentId],
        async () => {
            if (!enrollmentId) {
                console.log('📄 [PainelDocumentos] Nenhum enrollment_id fornecido');
                return [];
            }
            
            console.log('📄 [PainelDocumentos] Buscando documentos para enrollment_id:', enrollmentId);
            
            try {
                const response = await dataProvider.getList('document_extractions', {
                    filter: { enrollment_id: enrollmentId },
                    pagination: { page: 1, perPage: 100 },
                    sort: { field: 'created_at', order: 'DESC' }
                });
                
                console.log('📄 [PainelDocumentos] Documentos encontrados:', response.data.length);
                return response.data as DocumentExtraction[];
            } catch (error) {
                console.error('❌ [PainelDocumentos] Erro ao buscar documentos:', error);
                return [];
            }
        },
        {
            enabled: !!enrollmentId,
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 10 * 60 * 1000, // 10 minutos
        }
    );
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export const PainelDocumentos: React.FC<PainelDocumentosProps> = ({ className }) => {
    const {
        studentData,
        selectedDocument,
        setSelectedDocument
    } = useCockpitContext();
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // Estados locais
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['rg', 'cpf']));
    const [showFilters, setShowFilters] = useState(false);
    
    // Buscar documentos
    const { data: documents = [], isLoading, error } = useStudentDocuments(studentData?.enrollment_id);
    
    // Agrupar documentos por tipo
    const documentGroups: DocumentGroup[] = React.useMemo(() => {
        const groups: Record<string, DocumentExtraction[]> = {};
        
        documents.forEach(doc => {
            const type = doc.document_type || 'outros';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(doc);
        });
        
        return Object.entries(groups).map(([type, docs]) => ({
            type,
            label: DOCUMENT_TYPE_MAP[type]?.label || type,
            documents: docs,
            icon: DOCUMENT_TYPE_MAP[type]?.icon || <FileIcon />
        }));
    }, [documents]);
    
    // Filtrar documentos por busca
    const filteredGroups = React.useMemo(() => {
        if (!searchTerm) return documentGroups;
        
        return documentGroups.map(group => ({
            ...group,
            documents: group.documents.filter(doc =>
                doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.label.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(group => group.documents.length > 0);
    }, [documentGroups, searchTerm]);
    
    // Handlers
    const handleDocumentSelect = (document: DocumentExtraction) => {
        setSelectedDocument(document);
        console.log('📄 [PainelDocumentos] Documento selecionado:', document.file_name);
    };
    
    const toggleGroup = (groupType: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupType)) {
                newSet.delete(groupType);
            } else {
                newSet.add(groupType);
            }
            return newSet;
        });
    };
    
    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <PdfIcon />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <ImageIcon />;
            default:
                return <FileIcon />;
        }
    };
    
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    };
    
    // Estados de loading e erro
    if (isLoading) {
        return (
            <Paper className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">Documentos</Typography>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress size={60} />
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Carregando documentos...
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        );
    }
    
    if (error) {
        return (
            <Paper className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">Documentos</Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                    <Alert severity="error">
                        Erro ao carregar documentos
                    </Alert>
                </Box>
            </Paper>
        );
    }
    
    return (
        <Paper className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">
                        Documentos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                            label={documents.length} 
                            size="small" 
                            color="primary" 
                        />
                        <IconButton 
                            size="small" 
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FilterIcon />
                        </IconButton>
                    </Box>
                </Box>
                
                {/* Busca */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                
                {/* Filtros (colapsível) */}
                <Collapse in={showFilters}>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Object.entries(DOCUMENT_TYPE_MAP).map(([type, config]) => (
                            <Chip
                                key={type}
                                label={config.label}
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    // TODO: Implementar filtro por tipo
                                }}
                            />
                        ))}
                    </Box>
                </Collapse>
            </Box>
            
            {/* Lista de Documentos */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {filteredGroups.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento disponível'}
                        </Typography>
                    </Box>
                ) : (
                    <List dense>
                        {filteredGroups.map((group, groupIndex) => (
                            <React.Fragment key={group.type}>
                                {/* Cabeçalho do Grupo */}
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => toggleGroup(group.type)}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {group.icon}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={group.label}
                                            secondary={`${group.documents.length} documento(s)`}
                                        />
                                        <Chip 
                                            label={group.documents.length} 
                                            size="small" 
                                            sx={{ mr: 1 }}
                                        />
                                        {expandedGroups.has(group.type) ? <ExpandLess /> : <ExpandMore />}
                                    </ListItemButton>
                                </ListItem>
                                
                                {/* Documentos do Grupo */}
                                <Collapse in={expandedGroups.has(group.type)}>
                                    {group.documents.map((document) => (
                                        <ListItem key={document.id} disablePadding sx={{ pl: 2 }}>
                                            <ListItemButton
                                                selected={selectedDocument?.id === document.id}
                                                onClick={() => handleDocumentSelect(document)}
                                                sx={{
                                                    borderRadius: 1,
                                                    mx: 1,
                                                    '&.Mui-selected': {
                                                        backgroundColor: 'primary.light',
                                                        color: 'primary.contrastText',
                                                        '&:hover': {
                                                            backgroundColor: 'primary.main',
                                                        }
                                                    }
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    {getFileIcon(document.file_name)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" noWrap>
                                                            {document.file_name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                            <Typography variant="caption">
                                                                {new Date(document.created_at).toLocaleDateString('pt-BR')}
                                                            </Typography>
                                                            {document.file_size && (
                                                                <Typography variant="caption">
                                                                    • {formatFileSize(document.file_size)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                                <Chip
                                                    label={document.status}
                                                    size="small"
                                                    color={document.status === 'processed' ? 'success' : 'default'}
                                                    sx={{ ml: 1 }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </Collapse>
                                
                                {groupIndex < filteredGroups.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>
            
            {/* Footer com informações */}
            {documents.length > 0 && (
                <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                        {selectedDocument ? 
                            `Selecionado: ${selectedDocument.file_name}` : 
                            'Clique em um documento para visualizar'
                        }
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default PainelDocumentos;

