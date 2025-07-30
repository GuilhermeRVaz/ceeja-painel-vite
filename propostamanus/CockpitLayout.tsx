// ARQUIVO: src/components/cockpit/CockpitLayout.tsx
// DESCRIÇÃO: Layout principal do Cockpit de Verificação com três painéis integrados

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    IconButton, 
    Drawer, 
    useTheme, 
    useMediaQuery,
    Fab,
    Tooltip
} from '@mui/material';
import { 
    Visibility, 
    VisibilityOff, 
    MenuOpen, 
    Menu as MenuIcon,
    Save as SaveIcon,
    CheckCircle as ApproveIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useDataProvider, useNotify } from 'react-admin';

// =====================================================================
// TIPOS E INTERFACES
// =====================================================================
interface CockpitContextType {
    // Estado dos dados
    studentData: MergedStudentData | null;
    loading: boolean;
    error: string | null;
    
    // Estado da UI
    activeTab: 'personal' | 'address' | 'schooling';
    selectedDocument: DocumentExtraction | null;
    isDocumentPanelVisible: boolean;
    isMobileMenuOpen: boolean;
    
    // Ações
    setActiveTab: (tab: 'personal' | 'address' | 'schooling') => void;
    setSelectedDocument: (doc: DocumentExtraction | null) => void;
    toggleDocumentPanel: () => void;
    toggleMobileMenu: () => void;
    saveData: (data: Partial<StudentData>) => Promise<void>;
    approveStudent: () => Promise<void>;
}

interface MergedStudentData {
    id: string | number;
    student_id?: string | number;
    addresses?: any;
    schooling_data?: any;
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
}

interface CockpitLayoutProps {
    studentId: string;
    onSave?: (data: StudentData) => void;
    onApprove?: (studentId: string) => void;
}

// =====================================================================
// CONTEXT DO COCKPIT
// =====================================================================
const CockpitContext = createContext<CockpitContextType | null>(null);

export const useCockpitContext = () => {
    const context = useContext(CockpitContext);
    if (!context) {
        throw new Error('useCockpitContext deve ser usado dentro de CockpitProvider');
    }
    return context;
};

// =====================================================================
// HOOK PARA DADOS UNIFICADOS
// =====================================================================
const useCockpitData = (studentId: string) => {
    const dataProvider = useDataProvider();
    
    return useQuery(
        ['cockpitData', studentId],
        async () => {
            console.log('🔍 [CockpitData] Buscando dados unificados para studentId:', studentId);
            
            // Buscar dados pessoais
            const personalData = await dataProvider.getOne('personal_data', { id: studentId });
            console.log('📊 [CockpitData] Dados pessoais carregados:', personalData.data);
            
            const actualStudentId = personalData.data.student_id || personalData.data.id;
            
            // Buscar dados relacionados em paralelo
            const [addressesRes, schoolingRes, enrollmentRes] = await Promise.all([
                dataProvider.getList('addresses', { 
                    filter: { student_id: actualStudentId }, 
                    pagination: { page: 1, perPage: 1 }, 
                    sort: { field: 'id', order: 'ASC' } 
                }).catch(() => ({ data: [] })),
                dataProvider.getList('schooling_data', { 
                    filter: { student_id: actualStudentId }, 
                    pagination: { page: 1, perPage: 1 }, 
                    sort: { field: 'id', order: 'ASC' } 
                }).catch(() => ({ data: [] })),
                dataProvider.getList('enrollments', { 
                    filter: { student_id: actualStudentId }, 
                    pagination: { page: 1, perPage: 1 }, 
                    sort: { field: 'created_at', order: 'DESC' } 
                }).catch(() => ({ data: [] }))
            ]);
            
            console.log('📊 [CockpitData] Dados relacionados:', {
                addresses: addressesRes.data.length,
                schooling: schoolingRes.data.length,
                enrollments: enrollmentRes.data.length
            });
            
            // Montar dados unificados
            const unified: MergedStudentData = {
                ...personalData.data,
                student_id: actualStudentId,
                addresses: addressesRes.data[0] || { student_id: actualStudentId },
                schooling_data: schoolingRes.data[0] || { student_id: actualStudentId },
                enrollment_id: enrollmentRes.data[0]?.id || null
            };
            
            console.log('✅ [CockpitData] Dados unificados preparados');
            return unified;
        },
        {
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 10 * 60 * 1000, // 10 minutos
        }
    );
};

// =====================================================================
// PROVIDER DO COCKPIT
// =====================================================================
const CockpitProvider: React.FC<{ 
    studentId: string; 
    children: React.ReactNode;
    onSave?: (data: any) => void;
    onApprove?: (studentId: string) => void;
}> = ({ studentId, children, onSave, onApprove }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const notify = useNotify();
    const dataProvider = useDataProvider();
    
    // Estado dos dados
    const { data: studentData, isLoading: loading, error } = useCockpitData(studentId);
    
    // Estado da UI
    const [activeTab, setActiveTab] = useState<'personal' | 'address' | 'schooling'>('personal');
    const [selectedDocument, setSelectedDocument] = useState<DocumentExtraction | null>(null);
    const [isDocumentPanelVisible, setIsDocumentPanelVisible] = useState(!isMobile);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Ajustar visibilidade do painel de documentos baseado no tamanho da tela
    useEffect(() => {
        if (isMobile) {
            setIsDocumentPanelVisible(false);
        } else if (!isTablet) {
            setIsDocumentPanelVisible(true);
        }
    }, [isMobile, isTablet]);
    
    // Ações
    const toggleDocumentPanel = () => {
        setIsDocumentPanelVisible(prev => !prev);
    };
    
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };
    
    const saveData = async (data: Partial<any>) => {
        try {
            console.log('💾 [CockpitProvider] Salvando dados:', data);
            
            if (onSave) {
                await onSave(data);
            }
            
            notify('Dados salvos com sucesso!', { type: 'success' });
        } catch (error: any) {
            console.error('❌ [CockpitProvider] Erro ao salvar:', error);
            notify(`Erro ao salvar: ${error.message}`, { type: 'error' });
            throw error;
        }
    };
    
    const approveStudent = async () => {
        try {
            console.log('✅ [CockpitProvider] Aprovando aluno:', studentId);
            
            if (onApprove) {
                await onApprove(studentId);
            }
            
            notify('Aluno aprovado! Iniciando processo de matrícula...', { type: 'success' });
        } catch (error: any) {
            console.error('❌ [CockpitProvider] Erro ao aprovar:', error);
            notify(`Erro ao aprovar: ${error.message}`, { type: 'error' });
            throw error;
        }
    };
    
    const contextValue: CockpitContextType = {
        // Estado dos dados
        studentData,
        loading,
        error: error?.message || null,
        
        // Estado da UI
        activeTab,
        selectedDocument,
        isDocumentPanelVisible,
        isMobileMenuOpen,
        
        // Ações
        setActiveTab,
        setSelectedDocument,
        toggleDocumentPanel,
        toggleMobileMenu,
        saveData,
        approveStudent
    };
    
    return (
        <CockpitContext.Provider value={contextValue}>
            {children}
        </CockpitContext.Provider>
    );
};

// =====================================================================
// COMPONENTE DE HEADER
// =====================================================================
const CockpitHeader: React.FC = () => {
    const { 
        studentData, 
        isDocumentPanelVisible, 
        toggleDocumentPanel,
        isMobileMenuOpen,
        toggleMobileMenu,
        saveData,
        approveStudent
    } = useCockpitContext();
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                boxShadow: 1
            }}
        >
            {/* Título e informações do aluno */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isMobile && (
                    <IconButton onClick={toggleMobileMenu}>
                        <MenuIcon />
                    </IconButton>
                )}
                
                <Box>
                    <Typography variant="h6" component="h1">
                        Cockpit de Verificação
                    </Typography>
                    {studentData && (
                        <Typography variant="body2" color="text.secondary">
                            {studentData.nome_completo} - CPF: {studentData.cpf}
                        </Typography>
                    )}
                </Box>
            </Box>
            
            {/* Controles do header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!isMobile && (
                    <Tooltip title={isDocumentPanelVisible ? 'Ocultar Documentos' : 'Mostrar Documentos'}>
                        <IconButton onClick={toggleDocumentPanel}>
                            {isDocumentPanelVisible ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </Tooltip>
                )}
                
                <Tooltip title="Salvar Alterações">
                    <IconButton 
                        color="primary" 
                        onClick={() => saveData(studentData || {})}
                    >
                        <SaveIcon />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Aprovar e Matricular">
                    <IconButton 
                        color="success" 
                        onClick={approveStudent}
                    >
                        <ApproveIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
};

// =====================================================================
// COMPONENTE PRINCIPAL DO LAYOUT
// =====================================================================
export const CockpitLayout: React.FC<CockpitLayoutProps> = ({
    studentId,
    onSave,
    onApprove
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    
    return (
        <CockpitProvider 
            studentId={studentId} 
            onSave={onSave} 
            onApprove={onApprove}
        >
            <CockpitLayoutContent />
        </CockpitProvider>
    );
};

// =====================================================================
// CONTEÚDO DO LAYOUT (SEPARADO PARA USAR O CONTEXT)
// =====================================================================
const CockpitLayoutContent: React.FC = () => {
    const { 
        isDocumentPanelVisible, 
        isMobileMenuOpen, 
        toggleMobileMenu,
        toggleDocumentPanel
    } = useCockpitContext();
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    
    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <CockpitHeader />
            
            {/* Conteúdo Principal */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Layout Desktop - 3 Colunas */}
                {!isMobile && !isTablet && (
                    <>
                        {/* Painel de Edição - 30% */}
                        <Box
                            sx={{
                                width: '30%',
                                borderRight: 1,
                                borderColor: 'divider',
                                overflow: 'auto'
                            }}
                        >
                            <PainelEdicaoPlaceholder />
                        </Box>
                        
                        {/* Painel de Documentos - 20% */}
                        {isDocumentPanelVisible && (
                            <Box
                                sx={{
                                    width: '20%',
                                    borderRight: 1,
                                    borderColor: 'divider',
                                    overflow: 'auto'
                                }}
                            >
                                <PainelDocumentosPlaceholder />
                            </Box>
                        )}
                        
                        {/* Painel de Visualização - 50% ou 70% */}
                        <Box
                            sx={{
                                flex: 1,
                                overflow: 'auto'
                            }}
                        >
                            <PainelVisualizacaoPlaceholder />
                        </Box>
                    </>
                )}
                
                {/* Layout Tablet - 2 Colunas + Drawer */}
                {isTablet && (
                    <>
                        {/* Painel de Edição - 40% */}
                        <Box
                            sx={{
                                width: '40%',
                                borderRight: 1,
                                borderColor: 'divider',
                                overflow: 'auto'
                            }}
                        >
                            <PainelEdicaoPlaceholder />
                        </Box>
                        
                        {/* Painel de Visualização - 60% */}
                        <Box
                            sx={{
                                flex: 1,
                                overflow: 'auto'
                            }}
                        >
                            <PainelVisualizacaoPlaceholder />
                        </Box>
                        
                        {/* Drawer de Documentos */}
                        <Drawer
                            anchor="right"
                            open={isDocumentPanelVisible}
                            onClose={toggleDocumentPanel}
                            variant="temporary"
                            sx={{
                                '& .MuiDrawer-paper': {
                                    width: 320,
                                    boxSizing: 'border-box',
                                },
                            }}
                        >
                            <PainelDocumentosPlaceholder />
                        </Drawer>
                    </>
                )}
                
                {/* Layout Mobile - Abas */}
                {isMobile && (
                    <>
                        {/* Conteúdo Principal */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <MobileTabsPlaceholder />
                        </Box>
                        
                        {/* Menu Mobile */}
                        <Drawer
                            anchor="left"
                            open={isMobileMenuOpen}
                            onClose={toggleMobileMenu}
                            variant="temporary"
                            sx={{
                                '& .MuiDrawer-paper': {
                                    width: 280,
                                    boxSizing: 'border-box',
                                },
                            }}
                        >
                            <PainelEdicaoPlaceholder />
                        </Drawer>
                        
                        {/* FAB para Documentos */}
                        <Fab
                            color="primary"
                            aria-label="documentos"
                            onClick={toggleDocumentPanel}
                            sx={{
                                position: 'fixed',
                                bottom: 16,
                                right: 16,
                            }}
                        >
                            <MenuOpen />
                        </Fab>
                        
                        {/* Drawer de Documentos Mobile */}
                        <Drawer
                            anchor="bottom"
                            open={isDocumentPanelVisible}
                            onClose={toggleDocumentPanel}
                            variant="temporary"
                            sx={{
                                '& .MuiDrawer-paper': {
                                    height: '70vh',
                                    boxSizing: 'border-box',
                                },
                            }}
                        >
                            <PainelDocumentosPlaceholder />
                        </Drawer>
                    </>
                )}
            </Box>
        </Box>
    );
};

// =====================================================================
// COMPONENTES PLACEHOLDER (SERÃO SUBSTITUÍDOS PELOS REAIS)
// =====================================================================
const PainelEdicaoPlaceholder: React.FC = () => (
    <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
            Painel de Edição
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Aqui ficarão as abas de Dados Pessoais, Endereço e Escolaridade
        </Typography>
    </Box>
);

const PainelDocumentosPlaceholder: React.FC = () => (
    <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
            Lista de Documentos
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Aqui ficará a lista de documentos do aluno
        </Typography>
    </Box>
);

const PainelVisualizacaoPlaceholder: React.FC = () => (
    <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
            Visualização de Documento
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Aqui ficará o visualizador de documentos com controles
        </Typography>
    </Box>
);

const MobileTabsPlaceholder: React.FC = () => (
    <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
            Interface Mobile
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Aqui ficará a interface de abas para mobile
        </Typography>
    </Box>
);

export default CockpitLayout;

