// ARQUIVO: src/components/panels/PainelEdicao/PainelEdicao.tsx
// DESCRIÇÃO: Painel de edição com abas para dados pessoais, endereço e escolaridade

import React from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Button,
    Divider,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Person as PersonIcon,
    Home as HomeIcon,
    School as SchoolIcon,
    Save as SaveIcon,
    CheckCircle as ApproveIcon
} from '@mui/icons-material';
import { useCockpitContext } from '../cockpit/CockpitLayout';
import { AbaDadosPessoais } from './AbaDadosPessoais';
import { AbaEndereco } from './AbaEndereco';
import { AbaEscolaridade } from './AbaEscolaridade';

// =====================================================================
// INTERFACE DO COMPONENTE
// =====================================================================
interface PainelEdicaoProps {
    className?: string;
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export const PainelEdicao: React.FC<PainelEdicaoProps> = ({ className }) => {
    const {
        activeTab,
        setActiveTab,
        studentData,
        loading,
        error,
        saveData,
        approveStudent
    } = useCockpitContext();
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // Estados de loading e erro
    if (loading) {
        return (
            <Box 
                className={className}
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: 400,
                    p: 3
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Carregando dados do aluno...
                </Typography>
            </Box>
        );
    }
    
    if (error) {
        return (
            <Box className={className} sx={{ p: 2 }}>
                <Alert severity="error">
                    <Typography variant="body2">
                        <strong>Erro ao carregar dados:</strong> {error}
                    </Typography>
                </Alert>
            </Box>
        );
    }
    
    if (!studentData) {
        return (
            <Box className={className} sx={{ p: 2 }}>
                <Alert severity="warning">
                    <Typography variant="body2">
                        Dados do aluno não encontrados.
                    </Typography>
                </Alert>
            </Box>
        );
    }
    
    // Handlers
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue as 'personal' | 'address' | 'schooling');
    };
    
    const handleSave = async () => {
        try {
            await saveData(studentData);
        } catch (error) {
            console.error('Erro ao salvar:', error);
        }
    };
    
    const handleApprove = async () => {
        try {
            await approveStudent();
        } catch (error) {
            console.error('Erro ao aprovar:', error);
        }
    };
    
    return (
        <Paper 
            className={className}
            sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Header do Painel */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" component="h2">
                    Edição de Dados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {studentData.nome_completo}
                </Typography>
            </Box>
            
            {/* Abas de Navegação */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant={isMobile ? "fullWidth" : "standard"}
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    <Tab
                        label={isMobile ? "Pessoais" : "Dados Pessoais"}
                        value="personal"
                        icon={<PersonIcon />}
                        iconPosition="start"
                        sx={{ minHeight: 48 }}
                    />
                    <Tab
                        label="Endereço"
                        value="address"
                        icon={<HomeIcon />}
                        iconPosition="start"
                        sx={{ minHeight: 48 }}
                    />
                    <Tab
                        label={isMobile ? "Escola" : "Escolaridade"}
                        value="schooling"
                        icon={<SchoolIcon />}
                        iconPosition="start"
                        sx={{ minHeight: 48 }}
                    />
                </Tabs>
            </Box>
            
            {/* Conteúdo das Abas */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 'personal' && (
                    <AbaDadosPessoais studentData={studentData} />
                )}
                {activeTab === 'address' && (
                    <AbaEndereco addressData={studentData.addresses} />
                )}
                {activeTab === 'schooling' && (
                    <AbaEscolaridade schoolingData={studentData.schooling_data} />
                )}
            </Box>
            
            {/* Barra de Ações */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        fullWidth={isMobile}
                        sx={{ flex: isMobile ? undefined : 1 }}
                    >
                        Salvar Alterações
                    </Button>
                    
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={handleApprove}
                        fullWidth={isMobile}
                        sx={{ flex: isMobile ? undefined : 1 }}
                    >
                        {isMobile ? "Aprovar" : "Aprovar e Matricular"}
                    </Button>
                </Box>
                
                {/* Informações de Status */}
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Última atualização: {new Date().toLocaleString('pt-BR')}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default PainelEdicao;

